import { useState } from 'react';
import { userApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/errors';
import { useToast } from '../context/ToastContext';

export default function RoleAssignDialog({ targetUser, roles, onClose, onSaved }) {
  const { notify } = useToast();
  const [selected, setSelected] = useState(targetUser.roles);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggleRole(roleName) {
    setSelected((current) =>
      current.includes(roleName) ? current.filter((r) => r !== roleName) : [...current, roleName]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (selected.length === 0) {
      setError('Choose at least one role.');
      return;
    }
    setSubmitting(true);
    try {
      await userApi.updateRoles(targetUser.id, selected);
      notify(`Roles updated for ${targetUser.username}.`, 'success');
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not update roles.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>Roles for {targetUser.username}</h2>

        <form onSubmit={handleSubmit} className="form">
          <div className="checkbox-list">
            {roles.map((r) => (
              <label className="checkbox-list__item" key={r.id}>
                <input type="checkbox" checked={selected.includes(r.name)} onChange={() => toggleRole(r.name)} />
                {r.name.replace('ROLE_', '')}
                <span className="checkbox-list__meta">{r.permissions.length} permissions</span>
              </label>
            ))}
          </div>

          {error && <p className="form__error" role="alert">{error}</p>}

          <div className="dialog__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save roles'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
