import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  ApiError,
  createRecord,
  deleteRecord,
  getAuthStatus,
  getLoginUrl,
  getLogoutUrl,
  getRecords,
  updateRecord,
} from './api';
import type { AcademicRecord, AuthStatus, RecordPayload, Resource } from './types';
import './App.css';

const resources: { key: Resource; label: string; singular: string }[] = [
  { key: 'students', label: 'Students', singular: 'student' },
  { key: 'departments', label: 'Departments', singular: 'department' },
  { key: 'courses', label: 'Courses', singular: 'course' },
];

const fields: Record<Resource, { name: string; label: string; type?: string; required?: boolean }[]> = {
  students: [
    { name: 'fname', label: 'First name', required: true },
    { name: 'lname', label: 'Last name', required: true },
    { name: 'email', label: 'Email address', type: 'email', required: true },
    { name: 'major', label: 'Major', required: true },
    { name: 'gender', label: 'Gender', required: true },
    { name: 'city', label: 'City', required: true },
    { name: 'state', label: 'State / province', required: true },
    { name: 'birthdate', label: 'Birth date', type: 'date' },
  ],
  departments: [
    { name: 'department', label: 'Department name', required: true },
    { name: 'deptCode', label: 'Department code', required: true },
  ],
  courses: [
    { name: 'courseName', label: 'Course name', required: true },
    { name: 'courseNum', label: 'Course number', required: true },
    { name: 'deptCode', label: 'Department code', required: true },
  ],
};

const emptyRecords: Record<Resource, AcademicRecord[]> = {
  students: [],
  departments: [],
  courses: [],
};

const fetchAllRecords = async (): Promise<Record<Resource, AcademicRecord[]>> => {
  const [students, departments, courses] = await Promise.all([
    getRecords('students'),
    getRecords('departments'),
    getRecords('courses'),
  ]);
  return { students, departments, courses };
};

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    students: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1.2A4.8 4.8 0 0 1 8.3 13h1.4a4.8 4.8 0 0 1 4.8 4.8V19" /><path d="M16 5.2a3 3 0 0 1 0 5.7M17 13.2a4.8 4.8 0 0 1 3.5 4.6V19" /></>,
    departments: <><path d="M3 20h18M5 20V7l7-4 7 4v13M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 20v-3h4v3" /></>,
    courses: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8M8 10h6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3" /></>,
    edit: <><path d="m14 5 5 5M4 20l4.3-.9L19 8.4 15.6 5 5 15.7z" /><path d="M13.5 6.5 17 10" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    building: <><path d="M3 21h18M5 21V5h14v16M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4" /></>,
  };

  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] ?? paths.building}
    </svg>
  );
}

function recordTitle(resource: Resource, record: AcademicRecord): string {
  if (resource === 'students') return `${record.fname ?? ''} ${record.lname ?? ''}`.trim();
  if (resource === 'departments') return record.department ?? 'Untitled department';
  return record.courseName ?? 'Untitled course';
}

function recordSubtitle(resource: Resource, record: AcademicRecord): string {
  if (resource === 'students') return record.email ?? 'No email provided';
  if (resource === 'departments') return 'Academic department';
  return `Course ${record.courseNum ?? 'number not set'}`;
}

function recordDetail(resource: Resource, record: AcademicRecord): string {
  if (resource === 'students') return record.major ?? 'Major not set';
  if (resource === 'departments') return `Code ${record.deptCode ?? '—'}`;
  return `Department ${record.deptCode ?? '—'}`;
}

function App() {
  const [activeResource, setActiveResource] = useState<Resource>('students');
  const [records, setRecords] = useState(emptyRecords);
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AcademicRecord | null>(null);
  const [formValues, setFormValues] = useState<RecordPayload>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const refreshRecords = async () => {
    try {
      setRecords(await fetchAllRecords());
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    void fetchAllRecords()
      .then((result) => {
        if (active) setRecords(result);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load records.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    getAuthStatus()
      .then((status) => {
        if (active) setAuth(status);
      })
      .catch((caught: unknown) => {
        if (active) {
          setAuthError(caught instanceof Error ? caught.message : 'Unable to check sign-in status.');
        }
      });
    return () => { active = false; };
  }, []);

  const handleRefresh = () => {
    setError('');
    setRefreshing(true);
    void refreshRecords();
  };

  const activeResourceInfo = resources.find((resource) => resource.key === activeResource)!;
  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records[activeResource];
    return records[activeResource].filter((record) =>
      Object.values(record).some((value) =>
        String(value ?? '').toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [activeResource, query, records]);
  const totalRecords = records.students.length + records.departments.length + records.courses.length;

  const openCreateDialog = () => {
    setEditingRecord(null);
    setFormValues(Object.fromEntries(fields[activeResource].map((field) => [field.name, ''])));
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (record: AcademicRecord) => {
    setEditingRecord(record);
    setFormValues(Object.fromEntries(fields[activeResource].map((field) => [field.name, record[field.name as keyof AcademicRecord] ?? ''])));
    setFormError('');
    setDialogOpen(true);
  };

  const submitRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingRecord?._id) {
        await updateRecord(activeResource, editingRecord._id, formValues);
      } else {
        await createRecord(activeResource, formValues);
      }
      setDialogOpen(false);
      await refreshRecords();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to save this record.';
      setFormError(message);
      if (caught instanceof ApiError && caught.status === 401) {
        setAuth((current) => current ? { ...current, authenticated: false, user: null } : current);
      }
    } finally {
      setSaving(false);
    }
  };

  const removeRecord = async (record: AcademicRecord) => {
    if (!record._id || !window.confirm(`Delete ${recordTitle(activeResource, record)}? This cannot be undone.`)) {
      return;
    }
    setError('');
    try {
      await deleteRecord(activeResource, record._id);
      await refreshRecords();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete this record.');
      if (caught instanceof ApiError && caught.status === 401) {
        setAuth((current) => current ? { ...current, authenticated: false, user: null } : current);
      }
    }
  };

  const currentUser = auth?.user?.displayName || 'Signed in';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Campus Records home">
          <span className="brand-mark"><Icon name="building" /></span>
          <span className="brand-copy"><strong>campus</strong><small>RECORDS</small></span>
        </a>

        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Record collections">
          {resources.map((resource, index) => (
            <button
              className={`nav-item ${activeResource === resource.key ? 'active' : ''}`}
              aria-current={activeResource === resource.key ? 'page' : undefined}
              aria-label={resource.label}
              key={resource.key}
              onClick={() => { setActiveResource(resource.key); setQuery(''); }}
              title={resource.label}
              type="button"
            >
              <Icon name={resource.key} />
              <span>{resource.label}</span>
              <span className="nav-count">{String(index + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-dot" />
            <div><strong>Academic workspace</strong><span>MongoDB connected</span></div>
          </div>
          <span className="sidebar-version">CAMPUS RECORDS · 1.0</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{activeResourceInfo.label}</strong></div>
          <div className="topbar-actions">
            {auth?.authenticated ? (
              <>
                <span className="user-chip"><span className="avatar">{currentUser.slice(0, 1).toUpperCase()}</span>{currentUser}</span>
                <a className="button button-quiet" href={getLogoutUrl()}>Sign out</a>
              </>
            ) : (
              <a
                className={`button button-quiet ${auth && !auth.githubOAuthConfigured ? 'disabled' : ''}`}
                href={auth?.githubOAuthConfigured ? getLoginUrl() : undefined}
                aria-disabled={Boolean(auth && !auth.githubOAuthConfigured)}
                title={auth && !auth.githubOAuthConfigured ? 'Configure GitHub OAuth to enable sign-in.' : undefined}
              >
                Sign in
              </a>
            )}
          </div>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> ACADEMIC OPERATIONS</div>
              <h1>Good work starts<br /><span>with good records.</span></h1>
              <p className="welcome-copy">A clear view of the people, programs, and courses that make your campus work.</p>
            </div>
            <div className="welcome-art" aria-hidden="true">
              <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
              <div className="art-card art-card-back"><span /><span /><span /></div>
              <div className="art-card art-card-front"><div className="art-avatar">A</div><div className="art-lines"><span /><span /><span /></div><div className="art-check">✓</div></div>
              <span className="art-spark spark-one">✳</span><span className="art-spark spark-two">✦</span>
            </div>
          </section>

          <section className="metrics" aria-label="Academic record totals">
            <article className="metric-card metric-primary">
              <div className="metric-icon"><Icon name="building" /></div>
              <div className="metric-label">TOTAL RECORDS</div>
              <div className="metric-value">{loading ? '—' : totalRecords.toLocaleString()}</div>
              <div className="metric-foot">Across your academic workspace</div>
              <span className="metric-decoration">✳</span>
            </article>
            {resources.map((resource, index) => (
              <button
                className={`metric-card metric-secondary ${activeResource === resource.key ? 'metric-selected' : ''}`}
                key={resource.key}
                onClick={() => { setActiveResource(resource.key); setQuery(''); }}
                type="button"
              >
                <div className={`metric-icon metric-icon-${index}`}><Icon name={resource.key} /></div>
                <div className="metric-label">{resource.label.toUpperCase()}</div>
                <div className="metric-value">{loading ? '—' : records[resource.key].length.toLocaleString()}</div>
                <div className="metric-foot">View {resource.label.toLowerCase()} <span>↗</span></div>
              </button>
            ))}
          </section>

          <section className="directory-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> DIRECTORY</div>
                <h2>{activeResourceInfo.label}</h2>
                <p>Browse and manage your {activeResourceInfo.label.toLowerCase()} records.</p>
              </div>
              <div className="section-actions">
                {auth?.authenticated ? (
                  <button className="button button-primary" onClick={openCreateDialog} type="button">
                    <Icon name="plus" /> Add {activeResourceInfo.singular}
                  </button>
                ) : (
                  <span className="edit-hint">{auth?.githubOAuthConfigured ? 'Sign in to manage records' : 'Read-only · GitHub sign-in is not configured'}</span>
                )}
              </div>
            </div>

            {authError && <div className="notice notice-error" role="status">{authError}</div>}
            {error && (
              <div className="notice notice-error" role="alert">
                <span>{error}</span>
                <button className="text-button" onClick={handleRefresh} type="button">Try again</button>
              </div>
            )}

            <div className="directory-card">
              <div className="directory-toolbar">
                <div className="record-count"><strong>{loading ? '—' : visibleRecords.length}</strong> {visibleRecords.length === 1 ? activeResourceInfo.singular : activeResourceInfo.label.toLowerCase()}</div>
                <div className="toolbar-right">
                  <label className="search-box">
                    <Icon name="search" />
                    <input
                      aria-label={`Search ${activeResourceInfo.label.toLowerCase()}`}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search records..."
                      type="search"
                      value={query}
                    />
                    <kbd>/</kbd>
                  </label>
                  <button
                    aria-label="Refresh records"
                    className={`icon-button ${refreshing ? 'spinning' : ''}`}
                    disabled={refreshing}
                    onClick={handleRefresh}
                    type="button"
                  >
                    <Icon name="refresh" />
                  </button>
                </div>
              </div>

              <div className="table-scroll">
                <table>
                  <thead><tr><th>RECORD</th><th>ACADEMIC DETAILS</th><th>REFERENCE</th>{auth?.authenticated && <th className="actions-heading">ACTIONS</th>}</tr></thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="empty-cell" colSpan={auth?.authenticated ? 4 : 3}><span className="loader" /> Loading {activeResourceInfo.label.toLowerCase()}...</td></tr>
                    ) : visibleRecords.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={auth?.authenticated ? 4 : 3}>
                          <div className="empty-state">
                            <span className="empty-icon"><Icon name={activeResource} /></span>
                            <strong>{query ? 'No matching records' : `No ${activeResourceInfo.label.toLowerCase()} yet`}</strong>
                            <span>{query ? 'Try another search term.' : 'Records will appear here once they are added.'}</span>
                          </div>
                        </td>
                      </tr>
                    ) : visibleRecords.map((record) => (
                      <tr key={record._id ?? recordTitle(activeResource, record)}>
                        <td>
                          <div className="record-cell">
                            <span className={`record-avatar avatar-${activeResource}`}>{recordTitle(activeResource, record).slice(0, 1).toUpperCase()}</span>
                            <span className="record-copy"><strong>{recordTitle(activeResource, record)}</strong><small>{recordSubtitle(activeResource, record)}</small></span>
                          </div>
                        </td>
                        <td><span className="detail-text">{recordDetail(activeResource, record)}</span></td>
                        <td><code className="record-id">{record._id ? `#${record._id.slice(-6).toUpperCase()}` : '—'}</code></td>
                        {auth?.authenticated && (
                          <td>
                            <div className="row-actions">
                              <button aria-label={`Edit ${recordTitle(activeResource, record)}`} className="icon-button" onClick={() => openEditDialog(record)} type="button"><Icon name="edit" /></button>
                              <button aria-label={`Delete ${recordTitle(activeResource, record)}`} className="icon-button danger-hover" onClick={() => void removeRecord(record)} type="button"><Icon name="trash" /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-footer"><span>ACADEMIC RECORDS</span><span>Showing {loading ? 0 : visibleRecords.length} of {loading ? '—' : records[activeResource].length}</span></div>
            </div>
          </section>

          <footer className="page-footer"><span>Thoughtfully organized for better learning.</span><span>Built for the people behind the campus <span className="footer-heart">✳</span></span></footer>
        </div>
      </main>

      {dialogOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}>
          <section aria-labelledby="record-dialog-title" aria-modal="true" className="record-modal" role="dialog">
            <div className="modal-heading">
              <div><div className="eyebrow"><span className="eyebrow-line" /> RECORD DETAILS</div><h2 id="record-dialog-title">{editingRecord ? 'Edit' : 'Add'} {activeResourceInfo.singular}</h2></div>
              <button aria-label="Close dialog" className="icon-button" onClick={() => setDialogOpen(false)} type="button"><Icon name="close" /></button>
            </div>
            <form onSubmit={(event) => void submitRecord(event)}>
              <div className="form-grid">
                {fields[activeResource].map((field) => (
                  <label className={`form-field ${field.name === 'email' || field.name === 'courseName' ? 'field-wide' : ''}`} key={field.name}>
                    <span>{field.label}{field.required && <i> *</i>}</span>
                    <input
                      autoComplete="off"
                      onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                      required={field.required}
                      type={field.type ?? 'text'}
                      value={formValues[field.name] ?? ''}
                    />
                  </label>
                ))}
              </div>
              {formError && <div className="notice notice-error" role="alert">{formError}</div>}
              <div className="modal-actions">
                <button className="button button-quiet" onClick={() => setDialogOpen(false)} type="button">Cancel</button>
                <button className="button button-primary" disabled={saving} type="submit">{saving ? 'Saving...' : editingRecord ? 'Save changes' : `Create ${activeResourceInfo.singular}`}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
