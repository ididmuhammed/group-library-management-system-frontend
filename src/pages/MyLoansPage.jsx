import { useEffect, useState } from "react";
import { bookApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/errors";
import { useToast } from "../context/ToastContext";
import PageLoader from "../components/PageLoader";
import { useAuth } from "../context/AuthContext";

const STATUS_LABEL = {
  BORROWED: "On loan",
  RETURNED: "Returned",
  OVERDUE: "Overdue",
};

export default function MyLoansPage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await bookApi.myLoans();
      setLoans(data);
    } catch (err) {
      notify(extractErrorMessage(err, "Could not load your loans."), "error");
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
      notify(`"${record.bookTitle}" returned. Thank you!`, "success");
      load();
    } catch (err) {
      notify(extractErrorMessage(err, "Could not return this book."), "error");
    } finally {
      setBusyId(null);
    }
  }

  const active = loans.filter((l) => l.status !== "RETURNED");
  const past = loans.filter((l) => l.status === "RETURNED");

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Your ledger</p>
          <h1>Books you've borrowed</h1>
        </div>
      </header>

      {loading ? (
        <PageLoader label="Checking your ledger…" />
      ) : (
        <>
          <section>
            <h2 className="section-heading">Currently out ({active.length})</h2>
            {active.length === 0 ? (
              <div className="empty-state">
                <p>
                  Nothing checked out right now. Visit the catalog to borrow a
                  book.
                </p>
              </div>
            ) : (
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Borrowed</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((record) => (
                    <tr key={record.id}>
                      <td>{record.bookTitle}</td>
                      <td>{record.borrowedDate}</td>
                      <td>
                        <span className="stamp stamp--due">
                          {record.dueDate}
                        </span>
                      </td>
                      <td>{STATUS_LABEL[record.status] || record.status}</td>
                      <td>
                        {hasPermission("BORROW_RECORD_READ_ALL") && (
                          <button
                            className="btn btn--small btn--primary"
                            disabled={busyId === record.id}
                            onClick={() => handleReturn(record)}
                          >
                            {busyId === record.id ? "Returning.." : "Return"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="section-heading">Past loans</h2>
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Borrowed</th>
                    <th>Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {past.map((record) => (
                    <tr key={record.id}>
                      <td>{record.bookTitle}</td>
                      <td>{record.borrowedDate}</td>
                      <td>{record.returnedDate}</td>
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
