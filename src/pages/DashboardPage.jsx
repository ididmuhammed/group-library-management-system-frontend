import { useEffect, useState } from "react";
import { dashboardApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/errors";
import { useToast } from "../context/ToastContext";
import PageLoader from "../components/PageLoader";

const LOAN_STATUS_LABEL = {
  BORROWED: "On loan",
  RETURNED: "Returned",
  OVERDUE: "Overdue",
};

function formatAmount(amount) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-UG").format(Number(value || 0));
}

function StatCard({ label, value, hint, tone }) {
  return (
    <div className={"stat-card" + (tone ? ` stat-card--${tone}` : "")}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {hint && <p className="stat-card__hint">{hint}</p>}
    </div>
  );
}

function BarList({ rows, emptyLabel }) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  if (rows.length === 0) {
    return <p className="bar-list__empty">{emptyLabel}</p>;
  }

  return (
    <div className="bar-list">
      {rows.map((row) => (
        <div className="bar-list__row" key={row.label}>
          <span className="bar-list__label">{row.label}</span>
          <span className="bar-list__track">
            <span
              className={
                "bar-list__fill" +
                (row.tone ? ` bar-list__fill--${row.tone}` : "")
              }
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </span>
          <span className="bar-list__value">{formatNumber(row.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { notify } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    try {
      const { data } = await dashboardApi.stats();
      setStats(data);
    } catch (err) {
      notify(extractErrorMessage(err, "Could not load the dashboard."), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="page">
        <PageLoader label="Tallying the ledgers…" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page">
        <div className="empty-state">
          <p>Statistics are not available right now.</p>
        </div>
      </div>
    );
  }

  const { books, borrowing, reservations, fines, users, topBorrowedBooks, recentLoans } = stats;

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Overview</p>
          <h1>Dashboard</h1>
        </div>
        <button className="btn btn--ghost" type="button" onClick={load}>
          Refresh
        </button>
      </header>

      {/* ---- Top-line stats ---- */}
      <div className="stat-grid">
        <StatCard
          label="Books on loan"
          value={formatNumber(borrowing.currentlyBorrowed)}
          hint={`${formatNumber(borrowing.totalRecords)} loans all-time`}
        />
        <StatCard
          label="Overdue loans"
          value={formatNumber(borrowing.overdue)}
          hint={`${formatNumber(borrowing.dueSoon)} due within 3 days`}
          tone={borrowing.overdue > 0 ? "alert" : undefined}
        />
        <StatCard
          label="Damaged copies"
          value={formatNumber(books.damagedCopies)}
          hint={`${formatNumber(fines.damagedBookCount)} billed as fines · ${formatAmount(fines.damagedBookAmount)}`}
          tone={books.damagedCopies > 0 ? "alert" : undefined}
        />
        <StatCard
          label="Lost copies"
          value={formatNumber(books.lostCopies)}
          hint={`${formatNumber(fines.lostBookCount)} billed as fines · ${formatAmount(fines.lostBookAmount)}`}
          tone={books.lostCopies > 0 ? "alert" : undefined}
        />
        <StatCard
          label="Unpaid fines"
          value={formatAmount(fines.totalUnpaid)}
          hint={`${formatNumber(fines.unpaidCount)} outstanding`}
        />
        <StatCard
          label="Available copies"
          value={formatNumber(books.availableCopies)}
          hint={`of ${formatNumber(books.totalCopies)} total copies`}
        />
        <StatCard
          label="Out-of-stock titles"
          value={formatNumber(books.outOfStockTitles)}
          hint={`${formatNumber(books.totalTitles)} titles in catalog`}
        />
        <StatCard
          label="Pending reservations"
          value={formatNumber(reservations.pending)}
          hint={`${formatNumber(reservations.total)} reservations total`}
        />
      </div>

      <div className="dashboard-grid">
        {/* ---- Borrowing snapshot ---- */}
        <section className="panel">
          <h2 className="section-heading">Borrowing snapshot</h2>
          <BarList
            emptyLabel="No borrowing activity yet."
            rows={[
              { label: "On loan", value: borrowing.currentlyBorrowed },
              { label: "Overdue", value: borrowing.overdue, tone: "alert" },
              { label: "Due soon", value: borrowing.dueSoon, tone: "warn" },
              { label: "Returned", value: borrowing.returned },
            ]}
          />
        </section>

        {/* ---- Reservations snapshot ---- */}
        <section className="panel">
          <h2 className="section-heading">Reservations</h2>
          <BarList
            emptyLabel="No reservations have been placed."
            rows={[
              { label: "Pending", value: reservations.pending },
              { label: "Ready for pickup", value: reservations.available },
              { label: "Fulfilled", value: reservations.fulfilled },
              { label: "Expired", value: reservations.expired },
              { label: "Cancelled", value: reservations.cancelled },
            ]}
          />
        </section>

        {/* ---- Fines breakdown ---- */}
        <section className="panel">
          <h2 className="section-heading">Fines by reason</h2>
          <BarList
            emptyLabel="No fines have been issued."
            rows={[
              { label: "Overdue", value: fines.overdueFineCount },
              { label: "Damaged (fined)", value: fines.damagedBookCount, tone: "alert" },
              { label: "Lost (fined)", value: fines.lostBookCount, tone: "alert" },
            ]}
          />
          <dl className="mini-stats">
            <div>
              <dt>Total issued</dt>
              <dd>{formatAmount(fines.totalIssued)}</dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd>{formatAmount(fines.totalPaid)}</dd>
            </div>
            <div>
              <dt>Waived</dt>
              <dd>{formatAmount(fines.totalWaived)}</dd>
            </div>
          </dl>
        </section>

        {/* ---- Stock condition (loan losses + shelf losses combined) ---- */}
        <section className="panel">
          <h2 className="section-heading">Stock condition</h2>
          <BarList
            emptyLabel="No copies in the catalog yet."
            rows={[
              { label: "On the shelf", value: books.availableCopies },
              { label: "Out on loan", value: books.borrowedCopies },
              { label: "Lost", value: books.lostCopies, tone: "alert" },
              { label: "Damaged", value: books.damagedCopies, tone: "alert" },
            ]}
          />
          <p className="bar-list__empty" style={{ marginTop: 8 }}>
            Includes copies lost or damaged on the shelf, not just those billed to a borrower.
          </p>
        </section>

        {/* ---- Catalog by category ---- */}
        <section className="panel">
          <h2 className="section-heading">Catalog by category</h2>
          <BarList
            emptyLabel="No books in the catalog yet."
            rows={books.byCategory
              .slice(0, 6)
              .map((c) => ({ label: c.category, value: c.titleCount }))}
          />
        </section>

        {/* ---- Top borrowed books ---- */}
        <section className="panel">
          <h2 className="section-heading">Most borrowed</h2>
          {topBorrowedBooks.length === 0 ? (
            <p className="bar-list__empty">No loans have been recorded yet.</p>
          ) : (
            <ol className="rank-list">
              {topBorrowedBooks.map((b, idx) => (
                <li className="rank-list__item" key={b.bookId}>
                  <span className="rank-list__pos">{idx + 1}</span>
                  <span className="rank-list__body">
                    <span className="rank-list__title">{b.title}</span>
                    <span className="rank-list__meta">{b.author}</span>
                  </span>
                  <span className="chip">{formatNumber(b.borrowCount)} loans</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ---- Community ---- */}
        <section className="panel">
          <h2 className="section-heading">Community</h2>
          <dl className="mini-stats">
            <div>
              <dt>Members</dt>
              <dd>{formatNumber(users.members)}</dd>
            </div>
            <div>
              <dt>Librarians</dt>
              <dd>{formatNumber(users.librarians)}</dd>
            </div>
            <div>
              <dt>Admins</dt>
              <dd>{formatNumber(users.admins)}</dd>
            </div>
            <div>
              <dt>Active accounts</dt>
              <dd>{formatNumber(users.activeUsers)} / {formatNumber(users.totalUsers)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* ---- Recent activity ---- */}
      <h2 className="section-heading">Recent loan activity</h2>

      {recentLoans.length === 0 ? (
        <div className="empty-state">
          <p>No loans have been recorded yet.</p>
        </div>
      ) : (
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Borrower</th>
              <th>Borrowed</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentLoans.map((loan) => (
              <tr key={loan.id}>
                <td>{loan.bookTitle}</td>
                <td>{loan.borrowerName}</td>
                <td>{loan.borrowedDate}</td>
                <td>{loan.dueDate}</td>
                <td>
                  {loan.overdue ? (
                    <span className="stamp stamp--out">Overdue</span>
                  ) : (
                    <span className="stamp stamp--pending">
                      {LOAN_STATUS_LABEL[loan.status] || loan.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
