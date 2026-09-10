import { useState } from 'react';
import { bookApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/errors';
import { useToast } from '../context/ToastContext';

export default function BookFormDialog({ mode, book, onClose, onSaved }) {
  const { notify } = useToast();
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    title: book?.title || '',
    author: book?.author || '',
    isbn: book?.isbn || '',
    category: book?.category || '',
    totalCopies: book?.totalCopies ?? 1,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = { ...form, totalCopies: Number(form.totalCopies) };
    try {
      if (isEdit) {
        await bookApi.update(book.id, payload);
        notify(`"${form.title}" updated.`, 'success');
      } else {
        await bookApi.create(payload);
        notify(`"${form.title}" added to the catalog.`, 'success');
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save this book.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit book' : 'Add a book'}</h2>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Title</span>
            <input value={form.title} onChange={(e) => update('title', e.target.value)} required autoFocus />
          </label>

          <label className="field">
            <span>Author</span>
            <input value={form.author} onChange={(e) => update('author', e.target.value)} required />
          </label>

          <div className="field-row">
            <label className="field">
              <span>ISBN</span>
              <input value={form.isbn} onChange={(e) => update('isbn', e.target.value)} />
            </label>
            <label className="field">
              <span>Category</span>
              <input value={form.category} onChange={(e) => update('category', e.target.value)} />
            </label>
          </div>

          <label className="field field--narrow">
            <span>Total copies</span>
            <input
            // disabled={true}
              type="number"
              min={1}
              value={form.totalCopies}
              onChange={(e) => update('totalCopies', e.target.value)}
              required
            />
          </label>

          {error && <p className="form__error" role="alert">{error}</p>}

          <div className="dialog__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
