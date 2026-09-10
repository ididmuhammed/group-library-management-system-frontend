
import { useEffect, useState } from 'react';
import { bookApi, inventoryApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';

const STATUS_LABEL = {
  BORROWED: 'On loan',
  RETURNED: 'Returned',
  OVERDUE: 'Overdue',
  LOST: 'Lost',
  DAMAGED: 'Damaged',
};

export default function AllBorrowedBooksPage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const canManageInventory = hasPermission('INVENTORY_MANAGE');

  async function load() {
    setLoading(true);

    try {
      const { data } = await bookApi.allBorrowedBooks();
      setLoans(data);
    } catch (err) {
      notify(
        extractErrorMessage(err, 'Could not load borrowed books.'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleReturn(record) {
    setBusyId(record.id);

    try {
      await bookApi.returnBook(record.id);

      notify(
        `"${record.book.title}" returned successfully.`,
        'success'
      );

      load();
    } catch (err) {
      notify(
        extractErrorMessage(err, 'Could not return this book.'),
        'error'
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkLost(record) {
    const note = window.prompt(
      `Report "${record.book.title}" as lost by ${record.borrower.fullName || record.borrower.username}. Add a note (optional):`,
    );
    if (note === null) return;
    setBusyId(record.id);
    try {
      await inventoryApi.markLoanLost(record.id, note || undefined);
      notify(`"${record.book.title}" marked lost and a fine was issued.`, 'success');
      load();
    } catch (err) {
      notify(extractErrorMessage(err, 'Could not mark this book as lost.'), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkDamaged(record) {
    const note = window.prompt(
      `Report "${record.book.title}" as damaged, returned by ${record.borrower.fullName || record.borrower.username}. Add a note (optional):`,
    );
    if (note === null) return;
    setBusyId(record.id);
    try {
      await inventoryApi.markLoanDamaged(record.id, note || undefined);
      notify(`"${record.book.title}" marked damaged and a fine was issued.`, 'success');
      load();
    } catch (err) {
      notify(extractErrorMessage(err, 'Could not mark this book as damaged.'), 'error');
    } finally {
      setBusyId(null);
    }
  }

  const active = loans.filter((l) => l.status === 'BORROWED' || l.status === 'OVERDUE');
  const past = loans.filter((l) => l.status !== 'BORROWED' && l.status !== 'OVERDUE');

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Circulation ledger</p>
          <h1>Borrowed books</h1>
        </div>
      </header>

      {loading ? (
        <PageLoader label="Checking the circulation ledger…" />
      ) : (
        <>
          <section>
            <h2 className="section-heading">
              Currently out ({active.length})
            </h2>

            {active.length === 0 ? (
              <div className="empty-state">
                <p>No books are currently checked out.</p>
              </div>
            ) : (
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Borrower</th>
                    <th>Borrowed</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {active.map((record) => (
                    <tr key={record.id}>
                      <td>{record.book.title}</td>

                      <td>
                        {record.borrower.fullName ||
                          record.borrower.username}
                      </td>

                      <td>{record.borrowedDate}</td>

                      <td>
                        <span className="stamp stamp--due">
                          {record.dueDate}
                        </span>
                      </td>

                      <td>
                        {STATUS_LABEL[record.status] || record.status}
                      </td>

                      <td>
                        <div className="fine-actions">
                          <button
                            className="btn btn--small btn--primary"
                            disabled={busyId === record.id}
                            onClick={() => handleReturn(record)}
                          >
                            {busyId === record.id ? 'Returning…' : 'Return'}
                          </button>
                          {canManageInventory && (
                            <>
                              <button
                                className="btn btn--small btn--danger"
                                disabled={busyId === record.id}
                                onClick={() => handleMarkLost(record)}
                              >
                                Report lost
                              </button>
                              <button
                                className="btn btn--small btn--danger"
                                disabled={busyId === record.id}
                                onClick={() => handleMarkDamaged(record)}
                              >
                                Report damaged
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="section-heading">
                Past loans
              </h2>

              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Borrower</th>
                    <th>Borrowed</th>
                    <th>Returned</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {past.map((record) => (
                    <tr key={record.id}>
                      <td>{record.book.title}</td>

                      <td>
                        {record.borrower.fullName ||
                          record.borrower.username}
                      </td>

                      <td>{record.borrowedDate}</td>

                      <td>{record.returnedDate}</td>

                      <td>
                        {record.status === 'RETURNED' ? (
                          STATUS_LABEL[record.status]
                        ) : (
                          <span className="stamp stamp--out">
                            {STATUS_LABEL[record.status] || record.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}

