export type ReviewStatus = "pending" | "processing" | "completed" | "failed";
export type Severity = "critical" | "warning" | "suggestion";

export interface ReviewIssue {
  severity: Severity;
  category?: string;
  title: string;
  description?: string;
  line?: number;
  suggestion?: string;
}

export interface ReviewResult {
  overallScore?: number;
  readability?: number;
  performance?: number;
  security?: number;
  maintainability?: number;
  timeComplexity?: string;
  spaceComplexity?: string;
  issues?: ReviewIssue[];
  refactoring?: Array<{ before?: string; after?: string; explanation?: string }>;
  summary?: string;
}

export interface Review {
  _id: string;
  code: string;
  language: string;
  filename: string;
  status: ReviewStatus;
  error?: string;
  result?: ReviewResult;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginationData {
  page: number;
  totalPages: number;
  total: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface ReviewListResponse {
  data: Review[];
  pagination: PaginationData;
  summary?: { totalReviews: number; avgScore: number | null; latestScore: number | null };
}

export interface RepoReview {
  _id: string;
  repoUrl: string;
  repoName: string;
  status: "processing" | "completed" | "failed";
  error?: string;
  avgScore?: number;
  totalIssues?: number;
  criticalCount?: number;
  filesReviewed?: number;
  createdAt: string;
  files?: Array<{ path: string; result?: ReviewResult }>;
}

export interface RepoReviewListResponse {
  data: RepoReview[];
  pagination: PaginationData;
}
