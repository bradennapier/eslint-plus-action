import * as github from '@actions/github';

export type PrResponse = {
  endCursor?: string;
  hasNextPage?: boolean;
  files: string[];
};

export type Octokit = ReturnType<typeof github['getOctokit']>;
export type GithubContext = typeof github['context'];

export type ActionData = {
  sha: string;
  prID: number | undefined;
  prHtmlUrl: string | undefined;
  repoHtmlUrl: string | undefined;

  includeGlob: string[];
  ignoreGlob: string[];

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
    fixTypes: undefined | ('problem' | 'suggestion' | 'layout' | undefined)[];
  };
};

export type LintState = {
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  summary: string;
  rulesSummaries: Map<
    string,
    {
      ruleUrl?: string;
      ruleId: string;
      message: string;
      level: 'failure' | 'warning';
      annotations: ChecksUpdateParamsOutputAnnotations[];
    }
  >;
};

type NotUndefined<T> = T extends undefined ? never : T;

type UpdateParams = NotUndefined<Parameters<Octokit['checks']['update']>[0]>;

export type ExpectedUpdateParams = {
  [K in keyof UpdateParams]: UpdateParams[K];
};

export type ActionDataWithPR = Omit<ActionData, 'prID'> & { prID: number };

/* They make it impossible to get these types by import so... */

export type ChecksUpdateParamsOutputAnnotations = {
  path: string;
  start_line: number;
  end_line: number;
  start_column?: number;
  end_column?: number;
  annotation_level: 'notice' | 'warning' | 'failure';
  message: string;
  title?: string;
  raw_details?: string;
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
  annotations?: ChecksUpdateParamsOutputAnnotations[];
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
