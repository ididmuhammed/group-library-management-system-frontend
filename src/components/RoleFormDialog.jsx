import { useState } from 'react';
import { roleApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/errors';
import { useToast } from '../context/ToastContext';

export default function RoleFormDialog({ mode, role, allPermissions, onClose, onSaved }) {
  const { notify } = useToast();
  const isEdit = mode === 'edit';

  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selected, setSelected] = useState(role?.permissions || []);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function togglePermission(p) {
    setSelected((current) => (current.includes(p) ? current.filter((x) => x !== p) : [...current, p]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (selected.length === 0) {
      setError('Choose at least one permission.');
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        await roleApi.updatePermissions(role.id, selected);
        notify(`Permissions updated for ${role.name}.`, 'success');
      } else {
        await roleApi.create({ name, description, permissionNames: selected });
        notify(`Role ${name} created.`, 'success');
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save this role.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div className="dialog dialog--wide" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{isEdit ? `Edit permissions — ${role.name}` : 'Define a role'}</h2>

        <form onSubmit={handleSubmit} className="form">
          {!isEdit && (
            <div className="field-row">
              <label className="field">
                <span>Role name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="ROLE_CATALOGER"
                  required
                  autoFocus
                />
              </label>
              <label className="field">
                <span>Description</span>
                <input value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
            </div>
          )}

          <div className="field">
            <span>Permissions</span>
            <div className="checkbox-list checkbox-list--grid">
              {allPermissions.map((p) => (
                <label className="checkbox-list__item" key={p}>
                  <input type="checkbox" checked={selected.includes(p)} onChange={() => togglePermission(p)} />
                  {p}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="form__error" role="alert">{error}</p>}

          <div className="dialog__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save permissions' : 'Create role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
