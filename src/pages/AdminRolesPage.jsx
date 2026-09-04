import { useEffect, useState } from 'react';
import { roleApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/errors';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import RoleFormDialog from '../components/RoleFormDialog';

export default function AdminRolesPage() {
  const { notify } = useToast();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState(null); // null | { mode: 'create' | 'edit', role? }

  async function loadAll() {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([roleApi.list(), roleApi.permissions()]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
    } catch (err) {
      notify(extractErrorMessage(err, 'Could not load roles.'), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSaved() {
    setDialogState(null);
    loadAll();
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Access control</p>
          <h1>Roles &amp; permissions</h1>
        </div>
        <button className="btn btn--primary" onClick={() => setDialogState({ mode: 'create' })}>
          Define a role
        </button>
      </header>

      {loading ? (
        <PageLoader label="Reading the permission ledger…" />
      ) : (
        <div className="card-grid">
          {roles.map((role) => {
            const isAdmin = role.name === 'ROLE_ADMIN';
            return (
              <article className="index-card index-card--role" key={role.id}>
                <div className="index-card__tab">{role.name.replace('ROLE_', '')}</div>
                <p className="index-card__author">{role.description || 'No description'}</p>
                <div className="chip-row">
                  {role.permissions.sort().map((p) => (
                    <span className="chip" key={p}>{p}</span>
                  ))}
                </div>
                <div className="index-card__actions">
                  <button
                    className="btn btn--small btn--ghost"
                    disabled={isAdmin}
                    title={isAdmin ? "ROLE_ADMIN always keeps every permission" : undefined}
                    onClick={() => setDialogState({ mode: 'edit', role })}
                  >
                    {isAdmin ? 'Locked' : 'Edit permissions'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {dialogState && (
        <RoleFormDialog
          mode={dialogState.mode}
          role={dialogState.role}
          allPermissions={permissions}
          onClose={() => setDialogState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
