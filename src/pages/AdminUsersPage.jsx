import { useEffect, useState } from 'react';
import { userApi, roleApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import UserFormDialog from '../components/UserFormDialog';
import RoleAssignDialog from '../components/RoleAssignDialog';

export default function AdminUsersPage() {
  const { hasPermission, user: currentUser } = useAuth();
  const { notify } = useToast();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [rolesTarget, setRolesTarget] = useState(null); // user being edited
  const [busyId, setBusyId] = useState(null);

  const canCreate = hasPermission('USER_CREATE');
  const canManageRoles = hasPermission('USER_MANAGE_ROLES');
  const canUpdate = hasPermission('USER_UPDATE');
  const canDelete = hasPermission('USER_DELETE');

  async function loadAll() {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([userApi.list(), roleApi.list()]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      notify(extractErrorMessage(err, 'Could not load users.'), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggleEnabled(targetUser) {
    setBusyId(targetUser.id);
    try {
      await userApi.setEnabled(targetUser.id, !targetUser.enabled);
      notify(`${targetUser.username} ${targetUser.enabled ? 'disabled' : 're-enabled'}.`, 'success');
      loadAll();
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
      loadAll();
    } catch (err) {
      notify(extractErrorMessage(err, 'Could not remove this user.'), 'error');
    } finally {
      setBusyId(null);
    }
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
                <td>{u.fullName || '—'}</td>
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

      {createOpen && (
        <UserFormDialog roles={roles} onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); loadAll(); }} />
      )}

      {rolesTarget && (
        <RoleAssignDialog
          targetUser={rolesTarget}
          roles={roles}
          onClose={() => setRolesTarget(null)}
          onSaved={() => { setRolesTarget(null); loadAll(); }}
        />
      )}
    </div>
  );
}
