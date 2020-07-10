import { promises as file } from 'fs';
import path from 'path';
import cloneDeep from 'lodash.clonedeep';
import * as artifact from '@actions/artifact';

import {
  Octokit,
  GitHubArtifact,
  ActionData,
  IssuePersistentState,
  OctokitListArtifactsResponse,
  WorkflowPersistentState,
} from './types';
import {
  REPO,
  OWNER,
  ARTIFACT_KEY,
  ARTIFACTS_BASE_DIR,
  DEFAULT_WORKFLOW_STATE,
  DEFAULT_ISSUE_STATE,
} from './constants';
import { unzipEntry } from './fs';
import {
  getIssueStateName,
  getIssueLintResultsName,
  getWorkflowStateName,
} from './utils';
import { getCurrentWorkflow } from './api';

type ArtifactFilter =
  | null
  | ((artifacts: GitHubArtifact[]) => GitHubArtifact[]);

const defaultArtifactFilter = (artifacts: GitHubArtifact[]) =>
  artifacts.filter((artifact) => artifact.name.startsWith(ARTIFACT_KEY));

function getArtifactsForRepo(client: Octokit) {
  return client.actions.listArtifactsForRepo({
    owner: OWNER,
    repo: REPO,
  });
}

function deleteArtifact(client: Octokit, artifact: GitHubArtifact) {
  return client.actions.deleteArtifact({
    owner: OWNER,
    repo: REPO,
    artifact_id: artifact.id,
  });
}

export async function saveArtifact(
  filename: string,
  contents: string,
): Promise<void> {
  const filePath = path.join(ARTIFACTS_BASE_DIR, filename);

  await file.mkdir(ARTIFACTS_BASE_DIR, { recursive: true });
  await file.writeFile(filePath, contents);

  const client = artifact.create();
  await client.uploadArtifact(filename, [filePath], ARTIFACTS_BASE_DIR);
}

export async function downloadArtifacts(
  client: Octokit,
  filter: ArtifactFilter = defaultArtifactFilter,
  _artifacts?: OctokitListArtifactsResponse,
): Promise<string[]> {
  const artifacts = _artifacts || (await getArtifactsForRepo(client));

  const filtered = filter
    ? filter(artifacts.data.artifacts)
    : artifacts.data.artifacts;

  if (filtered.length === 0) {
    return [];
  }

  return Promise.all(
    filtered.map((artifact) => downloadArtifact(client, artifact)),
  );
}

export async function cleanupArtifactsForIssue(
  client: Octokit,
  data: ActionData,
  _artifacts?: OctokitListArtifactsResponse,
): Promise<void> {
  await Promise.all([
    deleteArtifacts(client, (artifacts) =>
      artifacts.filter((artifact) =>
        [getIssueStateName(data), getIssueLintResultsName(data)].includes(
          artifact.name,
        ),
      ),
    ),
    _artifacts,
  ]);
}

export async function deleteArtifacts(
  client: Octokit,
  filter: ArtifactFilter = defaultArtifactFilter,
  _artifacts?: OctokitListArtifactsResponse,
): Promise<void> {
  const artifacts = _artifacts || (await getArtifactsForRepo(client));

  const filtered = filter
    ? filter(artifacts.data.artifacts)
    : artifacts.data.artifacts;

  if (filtered.length === 0) {
    return;
  }

  await Promise.all(
    filtered.map((artifact) => deleteArtifact(client, artifact)),
  );
}

export async function deleteArtifactByName(
  client: Octokit,
  name: string | string[],
  _artifacts?: OctokitListArtifactsResponse,
): Promise<void> {
  const artifacts = _artifacts || (await getArtifactsForRepo(client));

  const names = Array.isArray(name) ? name : [name];

  const filtered = artifacts.data.artifacts.filter((artifact) =>
    names.includes(artifact.name),
  );

  if (filtered.length === 0) {
    return;
  }

  await Promise.all(
    filtered.map((artifact) => deleteArtifact(client, artifact)),
  );
}

export async function downloadArtifact(
  client: Octokit,
  target: GitHubArtifact,
): Promise<string> {
  const downloadData = await client.actions.downloadArtifact({
    owner: OWNER,
    repo: REPO,
    artifact_id: target.id,
    archive_format: 'zip',
  });

  return unzipEntry(target.name, Buffer.from(downloadData.data));
}

/**
 * We save and keep certain values over multiple runs to allow us to share
 * certain data such as our issue comment ids
 */
export async function getIssueState(
  client: Octokit,
  data: ActionData,
  _artifacts?: OctokitListArtifactsResponse,
): Promise<IssuePersistentState> {
  const artifacts = _artifacts || (await getArtifactsForRepo(client));

  const [[artifact], workflowState] = await Promise.all([
    downloadArtifacts(
      client,
      (artifactList) =>
        artifactList.filter((a) => a.name === getIssueStateName(data)),
      artifacts,
    ),
    getWorkflowState(client, data, artifacts),
  ]);

  if (!artifact) {
    const state = cloneDeep(DEFAULT_ISSUE_STATE);
    state.issue.id = data.issueNumber;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state as any).workflow = workflowState;
    return state as IssuePersistentState;
  }

  const state = JSON.parse(artifact);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (state as any).workflow = workflowState;

  return state as IssuePersistentState;
}

export async function getWorkflowState(
  client: Octokit,
  data: ActionData,
  _artifacts?: OctokitListArtifactsResponse,
): Promise<WorkflowPersistentState> {
  const [artifact] = await downloadArtifacts(
    client,
    (artifactList) =>
      artifactList.filter((a) => a.name === getWorkflowStateName(data)),
    _artifacts || (await getArtifactsForRepo(client)),
  );

  const state: WorkflowPersistentState = artifact
    ? JSON.parse(artifact)
    : cloneDeep(DEFAULT_WORKFLOW_STATE);

  if (!state.id) {
    console.log('Getting Current Workflow Information');
    const currentWorkflow = await getCurrentWorkflow(client, data);
    if (currentWorkflow) {
      state.id = currentWorkflow.id;
      state.path = currentWorkflow.path;
      await updateWorkflowState(client, data, state);
    }
  }

  return state;
}

/**
 * Uploads the workflow state from `data.workflow` so it can be retrieved in future runs for this
 * issue.
 */
export async function updateIssueState(
  client: Octokit,
  data: ActionData,
): Promise<void> {
  const artifacts = await getArtifactsForRepo(client);
  const name = getIssueStateName(data);

  await Promise.all([
    deleteArtifactByName(client, name, artifacts),
    saveArtifact(
      getIssueStateName(data),
      JSON.stringify({
        ...data.persist,
        // we dont want to include the workflow state on the issue level state
        workflow: undefined,
      }),
    ),
  ]);
}

/**
 * Since this idiom does not technically exist, we need to remove any previous state first, thus the workflow
 * (more global) state is not generally ideal to use often.  We will use it for simple schedule updates
 */
export async function updateWorkflowState(
  client: Octokit,
  data: ActionData,
  workflowState: WorkflowPersistentState,
): Promise<void> {
  const artifacts = await getArtifactsForRepo(client);
  const name = getWorkflowStateName(data);
  await Promise.all([
    deleteArtifactByName(client, name, artifacts),
    saveArtifact(name, JSON.stringify(workflowState)),
  ]);
}
