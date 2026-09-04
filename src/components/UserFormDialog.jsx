import { useState } from 'react';
import { userApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/errors';
import { useToast } from '../context/ToastContext';

export default function UserFormDialog({ roles, onClose, onSaved }) {
  const { notify } = useToast();
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', roleNames: [] });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleRole(roleName) {
    setForm((f) => ({
      ...f,
      roleNames: f.roleNames.includes(roleName)
        ? f.roleNames.filter((r) => r !== roleName)
        : [...f.roleNames, roleName],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.roleNames.length === 0) {
      setError('Choose at least one role.');
      return;
    }
    setSubmitting(true);
    try {
      await userApi.create(form);
      notify(`${form.username} added.`, 'success');
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create this user.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>Add a person</h2>

        <form onSubmit={handleSubmit} className="form">
          <div className="field-row">
            <label className="field">
              <span>Full name</span>
              <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} autoFocus />
            </label>
            <label className="field">
              <span>Username</span>
              <input value={form.username} onChange={(e) => update('username', e.target.value)} required />
            </label>
          </div>

          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </label>

          <label className="field">
            <span>Temporary password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              minLength={8}
              required
            />
          </label>

          <div className="field">
            <span>Roles</span>
            <div className="checkbox-list">
              {roles.map((r) => (
                <label className="checkbox-list__item" key={r.id}>
                  <input
                    type="checkbox"
                    checked={form.roleNames.includes(r.name)}
                    onChange={() => toggleRole(r.name)}
                  />
                  {r.name.replace('ROLE_', '')}
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
              {submitting ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
