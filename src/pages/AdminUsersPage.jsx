import { useEffect, useState } from 'react';
import { userApi, roleApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import UserFormDialog from '../components/UserFormDialog';
import RoleAssignDialog from '../components/RoleAssignDialog';
import PaginationControls from '../components/PaginationControls';

const SORT_OPTIONS = [
  { value: 'username', label: 'Username' },
  { value: 'email', label: 'Email' },
  { value: 'fullName', label: 'Full name' },
  { value: 'createdAt', label: 'Date added' },
];

export default function AdminUsersPage() {
  const { hasPermission, user: currentUser } = useAuth();
  const { notify } = useToast();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [rolesTarget, setRolesTarget] = useState(null); // user being edited
  const [busyId, setBusyId] = useState(null);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [enabledFilter, setEnabledFilter] = useState(''); // '', 'true', 'false'

  // Sorting
  const [sortField, setSortField] = useState('username');
  const [sortDir, setSortDir] = useState('asc');

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const canCreate = hasPermission('USER_CREATE');
  const canManageRoles = hasPermission('USER_MANAGE_ROLES');
  const canUpdate = hasPermission('USER_UPDATE');
  const canDelete = hasPermission('USER_DELETE');

  // Debounce free-text search.
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(0);
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data } = await userApi.list({
        page,
        size: pageSize,
        sort: `${sortField},${sortDir}`,
        search: search || undefined,
        role: roleFilter || undefined,
        enabled: enabledFilter || undefined,
      });
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      notify(extractErrorMessage(err, 'Could not load users.'), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadRoles() {
    try {
      const { data } = await roleApi.list();
      setRoles(data);
    } catch (err) {
      notify(extractErrorMessage(err, 'Could not load roles.'), 'error');
    }
  }

  useEffect(() => {
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortField, sortDir, search, roleFilter, enabledFilter]);

  async function handleToggleEnabled(targetUser) {
    setBusyId(targetUser.id);
    try {
      await userApi.setEnabled(targetUser.id, !targetUser.enabled);
      notify(`${targetUser.username} ${targetUser.enabled ? 'disabled' : 're-enabled'}.`, 'success');
      loadUsers();
    } catch (err) {
      notify(extractErrorMessage(err, 'Could not update this account.'), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(targetUser) {
    if (!window.confirm(`Permanently remove ${targetUser.username}?`)) return;
    setBusyId(targetUser.id);
    try {
      await userApi.remove(targetUser.id);
      notify(`${targetUser.username} removed.`, 'success');
      if (users.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        loadUsers();
      }
    } catch (err) {
      notify(extractErrorMessage(err, 'Could not remove this user.'), 'error');
    } finally {
      setBusyId(null);
    }
  }

  function toggleSortDir() {
    setPage(0);
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Directory</p>
          <h1>People with access</h1>
        </div>
        {canCreate && (
          <button className="btn btn--primary" onClick={() => setCreateOpen(true)}>
            Add a person
          </button>
        )}
      </header>

      <div className="page__toolbar">
        <input
          type="search"
          placeholder="Search by name, username, or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="search-input"
        />

        <select
          value={roleFilter}
          onChange={(e) => {
            setPage(0);
            setRoleFilter(e.target.value);
          }}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>{r.name.replace('ROLE_', '')}</option>
          ))}
        </select>

        <select
          value={enabledFilter}
          onChange={(e) => {
            setPage(0);
            setEnabledFilter(e.target.value);
          }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>

        <div className="sort-control">
          <select
            value={sortField}
            onChange={(e) => {
              setPage(0);
              setSortField(e.target.value);
            }}
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
            ))}
          </select>
          <button type="button" className="btn btn--small btn--ghost" onClick={toggleSortDir}>
            {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Pulling the directory…" />
      ) : (
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="chip-row" style={{ alignItems: 'center' }}>
                    {u.profileImageUrl ? (
                      <img className="table-avatar" src={u.profileImageUrl} alt="" />
                    ) : (
                      <span className="rail__avatar" style={{ width: 30, height: 30, fontSize: '0.75rem' }}>
                        {(u.fullName || u.username || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                    {u.fullName || '—'}
                  </div>
                </td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <div className="chip-row">
                    {u.roles.map((r) => (
                      <span className="chip" key={r}>{r.replace('ROLE_', '')}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={u.enabled ? 'stamp stamp--available' : 'stamp stamp--out'}>
                    {u.enabled ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    {canManageRoles && (
                      <button className="btn btn--small btn--ghost" onClick={() => setRolesTarget(u)}>
                        Roles
                      </button>
                    )}
                    {canUpdate && (
                      <button
                        className="btn btn--small btn--ghost"
                        disabled={busyId === u.id}
                        onClick={() => handleToggleEnabled(u)}
                      >
                        {u.enabled ? 'Disable' : 'Enable'}
                      </button>
                    )}
                    {canDelete && u.id !== currentUser?.id && (
                      <button
                        className="btn btn--small btn--danger"
                        disabled={busyId === u.id}
                        onClick={() => handleDelete(u)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPage(0);
            setPageSize(size);
          }}
        />
      )}

      {createOpen && (
        <UserFormDialog roles={roles} onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); loadUsers(); }} />
      )}

      {rolesTarget && (
        <RoleAssignDialog
          targetUser={rolesTarget}
          roles={roles}
          onClose={() => setRolesTarget(null)}
          onSaved={() => { setRolesTarget(null); loadUsers(); }}
        />
      )}
    </div>
  );
}
