export type Resource = 'students' | 'departments' | 'courses';

export interface AcademicRecord {
  _id?: string;
  fname?: string;
  lname?: string;
  email?: string;
  major?: string;
  gender?: string;
  city?: string;
  state?: string;
  birthdate?: string;
  department?: string;
  deptCode?: string;
  courseNum?: string;
  courseName?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user: { displayName?: string } | null;
  githubOAuthConfigured: boolean;
}

export type RecordPayload = Record<string, string>;
