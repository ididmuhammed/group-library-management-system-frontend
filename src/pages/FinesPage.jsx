import { useEffect, useState } from 'react';
import { bookApi } from '../api/endpoints';
import { extractErrorMessage } from '../api/errors';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';

const REASON_LABEL = {
  OVERDUE: 'Overdue',
  LOST_BOOK: 'Lost book',
  DAMAGED_BOOK: 'Damaged book',
};

const STATUS_LABEL = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
  WAIVED: 'Waived',
};

function formatAmount(amount) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export default function FinesPage() {
  const { notify } = useToast();

  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);

    try {
      const { data } = await bookApi.allFines();
      setFines(data);
    } catch (err) {
      notify(
        extractErrorMessage(err, 'Could not load fines.'),
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

  async function handlePay(fine) {
    setBusyId(fine.id);

    try {
      await bookApi.payFine(fine.id);

      notify(
        `Fine for "${fine.borrowRecord?.book?.title}" paid successfully.`,
        'success'
      );

      await load();
    } catch (err) {
      notify(
        extractErrorMessage(err, 'Could not pay this fine.'),
        'error'
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleWaive(fine) {
    setBusyId(fine.id);

    try {
      await bookApi.waiveFine(fine.id);

      notify(
        `Fine for "${fine.borrowRecord?.book?.title}" waived successfully.`,
        'success'
      );

      await load();
    } catch (err) {
      notify(
        extractErrorMessage(err, 'Could not waive this fine.'),
        'error'
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Finance ledger</p>
          <h1>Fines</h1>
        </div>
      </header>

      {loading ? (
        <PageLoader label="Checking the fines ledger…" />
      ) : (
        <section>
          <h2 className="section-heading">
            All fines ({fines.length})
          </h2>

          {fines.length === 0 ? (
            <div className="empty-state">
              <p>No fines have been recorded.</p>
            </div>
          ) : (
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Borrower</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Issued</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {fines.map((fine) => {
                  const record = fine.borrowRecord;
                  const book = record?.book;
                  const borrower = record?.borrower;

                  return (
                    <tr key={fine.id}>
                      <td>
                        {book?.title || 'Unknown book'}
                      </td>

                      <td>
                        {borrower?.fullName ||
                          borrower?.username ||
                          'Unknown borrower'}
                      </td>

                      <td>
                        {REASON_LABEL[fine.reason] ||
                          fine.reason}
                      </td>

                      <td>
                        <strong>
                          {formatAmount(fine.amount)}
                        </strong>
                      </td>

                      <td>
                        {fine.issuedDate}
                      </td>

                      <td>
                        {STATUS_LABEL[fine.status] ||
                          fine.status}
                      </td>

                      <td>
                        {fine.status === 'UNPAID' && (
                          <div className="fine-actions">
                            <button
                              className="btn btn--small btn--primary"
                              disabled={busyId === fine.id}
                              onClick={() => handlePay(fine)}
                            >
                              {busyId === fine.id
                                ? 'Processing…'
                                : 'Pay'}
                            </button>

                            <button
                              className="btn btn--small"
                              disabled={busyId === fine.id}
                              onClick={() => handleWaive(fine)}
                            >
                              Waive
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}