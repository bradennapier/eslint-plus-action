import * as github from '@actions/github';
import { Linter } from 'eslint';

export type IssuePersistentState = {
  readonly issue: {
    /**
     * The issueNumber (pr id)
     */
    id: undefined | number;
    /**
     * The issue summary id that can be used to edit or remove the issue summary
     */
    summaryId: undefined | number;
  };

  readonly workflow: WorkflowPersistentState;
};

export type WorkflowPersistentState = {
  /** 1581373 */
  id?: number;
  /** ".github/workflows/test.yml"  */
  path?: string;
  /**
   * We currently can't get this in any way but actually making a comment so we save it
   * for future use.  This is the user that will take action when api calls are made.
   */
  userId: undefined | number;
  readonly scheduler: {
    /**
     * Date that the schedule was last ran, if ever.
     */
    lastRunAt: undefined | string;
  };
};

type OctokitResponse<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any[]) => any,
  R = ReturnType<T>
> = R extends Promise<infer R> ? R : R;

type OctokitParameters<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any[]) => any
> = NonNullable<Parameters<T>[0]>;

export type PrResponse = {
  endCursor?: string;
  hasNextPage?: boolean;
  files: string[];
};

export type Octokit = ReturnType<typeof github['getOctokit']>;
export type OctokitPlugin = import('@octokit/core/dist-types/types').OctokitPlugin;

export type OctokitRequestOptions = import('@octokit/types/dist-types/EndpointDefaults').EndpointDefaults & {
  url: string;
};

export type OctokitOptions = import('@octokit/core/dist-types/types').OctokitOptions;

export type OctokitUpdateChecksResponse = OctokitResponse<
  Octokit['checks']['update']
>;

export type OctokitCreateChecksParams = OctokitParameters<
  Octokit['checks']['create']
>;

export type OctokitUpdateChecksParams = OctokitParameters<
  Octokit['checks']['update']
>;

export type OctokitCreateCheckResponse = OctokitResponse<
  Octokit['checks']['create']
>;
export type OctokitCreateCommentResponse = OctokitResponse<
  Octokit['issues']['createComment']
>;
export type OctokitDeleteCommentResponse = OctokitResponse<
  Octokit['issues']['deleteComment']
>;

export type OctokitListArtifactsResponse = OctokitResponse<
  Octokit['actions']['listArtifactsForRepo']
>;

export type GithubContext = typeof github['context'];

export type GithubActionSchedulePayload = {
  /** The cron schedule the report runs on */
  schedule: string;
};

export type CheckUpdaterFn = (
  params: Partial<OctokitUpdateChecksParams>,
) => Promise<OctokitUpdateChecksResponse>;

export type ActionData = {
  name: string;
  isReadOnly: boolean;
  sha: string;
  ref: string;
  eventName: string;

  prHtmlUrl: string | undefined;
  repoHtmlUrl: string | undefined;

  issueNumber: number | undefined;
  issueSummary: boolean;
  issueSummaryType: 'full' | 'compact';
  issueSummaryMethod: 'edit' | 'refresh';
  issueSummaryOnlyOnEvent: boolean;

  includeGlob: string[];
  ignoreGlob: string[];

  reportWarnings: boolean;

  reportWarningsAsErrors: boolean;
  reportIgnoredFiles: boolean;
  reportSuggestions: boolean;

  runId: number;
  runNumber: number;

  state: LintState;
  persist: IssuePersistentState;

  eslint: {
    rulePaths: string[];
    extensions: string[];
    configFile: string | undefined;
    followSymbolicLinks: boolean;
    errorOnUnmatchedPattern: boolean;
    useEslintIgnore: boolean;
    ignorePath: string | undefined;
    useEslintrc: boolean;
    fix: boolean;
  };
};

export type LintRuleSummary = {
  ruleUrl?: string;
  ruleId: string;
  message: string;
  level: 'failure' | 'warning';
  annotations: ChecksAnnotations[];
};

export type LintState = {
  userId: number;
  lintCount: number;
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  ignoredCount: number;
  ignoredFiles: string[];
  summary: string;
  rulesSummaries: Map<string, LintRuleSummary>;
  annotationCount: number;
  checkId: number;
  conclusion:
    | 'success'
    | 'failure'
    | 'neutral'
    | 'cancelled'
    | 'skipped'
    | 'timed_out'
    | 'action_required'
    | 'pending';
};

export type GitHubArtifact = {
  id: number;
  node_id: string;
  name: string;
  size_in_bytes: number;
  url: string;
  archive_download_url: string;
  expired: boolean;
  created_at: string;
  expires_at: string;
};

export type GitHubWorkflow = {
  id: number;
  node_id: string;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  url: string;
  html_url: string;
  badge_url: string;
};

export type ActionDataWithPR = Omit<ActionData, 'issueNumber'> & {
  issueNumber: number;
};

/* They make it impossible to get these types by import so... */

export type ChecksAnnotations = {
  path: string;
  start_line: number;
  end_line: number;
  start_column?: number;
  end_column?: number;
  annotation_level: 'notice' | 'warning' | 'failure';
  message: string;
  title?: string;
  raw_details?: string;
  suggestions: Linter.LintSuggestion[];
};

export type ChecksUpdateParams = {
  owner: string;
  repo: string;
  check_run_id: number;
  /**
   * The name of the check. For example, "code-coverage".
   */
  name?: string;
  /**
   * The URL of the integrator's site that has the full details of the check.
   */
  details_url?: string;
  /**
   * A reference for the run on the integrator's system.
   */
  external_id?: string;
  /**
   * This is a timestamp in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format: `YYYY-MM-DDTHH:MM:SSZ`.
   */
  started_at?: string;
  /**
   * The current status. Can be one of `queued`, `in_progress`, or `completed`.
   */
  status?: 'queued' | 'in_progress' | 'completed';
  /**
   * **Required if you provide `completed_at` or a `status` of `completed`**. The final conclusion of the check. Can be one of `success`, `failure`, `neutral`, `cancelled`, `skipped`, `timed_out`, or `action_required`.
   * **Note:** Providing `conclusion` will automatically set the `status` parameter to `completed`. Only GitHub can change a check run conclusion to `stale`.
   */
  conclusion?:
    | 'success'
    | 'failure'
    | 'neutral'
    | 'cancelled'
    | 'skipped'
    | 'timed_out'
    | 'action_required';
  /**
   * The time the check completed. This is a timestamp in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format: `YYYY-MM-DDTHH:MM:SSZ`.
   */
  completed_at?: string;
  /**
   * Check runs can accept a variety of data in the `output` object, including a `title` and `summary` and can optionally provide descriptive details about the run. See the [`output` object](https://developer.github.com/v3/checks/runs/#output-object-1) description.
   */
  output?: ChecksUpdateParamsOutput;
  /**
   * Possible further actions the integrator can perform, which a user may trigger. Each action includes a `label`, `identifier` and `description`. A maximum of three actions are accepted. See the [`actions` object](https://developer.github.com/v3/checks/runs/#actions-object) description. To learn more about check runs and requested actions, see "[Check runs and requested actions](https://developer.github.com/v3/checks/runs/#check-runs-and-requested-actions)."
   */
  actions?: ChecksUpdateParamsActions[];
};

export type ChecksCreateParamsActions = {
  label: string;
  description: string;
  identifier: string;
};
export type ChecksUpdateParamsOutput = {
  title?: string;
  summary: string;
  text?: string;
  annotations?: ChecksAnnotations[];
  images?: ChecksUpdateParamsOutputImages[];
};

export type ChecksUpdateParamsOutputImages = {
  alt: string;
  image_url: string;
  caption?: string;
};

export type ChecksUpdateParamsActions = {
  label: string;
  description: string;
  identifier: string;
};

export type RequestDescriptor = {
  request: OctokitRequestOptions;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: { [key: string]: any };
};
