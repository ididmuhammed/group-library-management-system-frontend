import { useEffect, useState } from "react";
import { inventoryApi, bookApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageLoader from "../components/PageLoader";

const LOG_TYPE_LABEL = {
  ACQUISITION: "New acquisition",
  LOST: "Marked lost",
  DAMAGED: "Marked damaged",
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-UG").format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-UG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

function AcquisitionForm({ books, onSaved }) {
  const { notify } = useToast();
  const [bookId, setBookId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!bookId) {
      notify("Choose a book first.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await inventoryApi.recordAcquisition({
        bookId: Number(bookId),
        quantity: Number(quantity),
        note: note || undefined,
      });
      notify(
        `Logged ${quantity} new ${quantity === 1 ? "copy" : "copies"} of "${data.bookTitle}".`,
        "success",
      );
      setBookId("");
      setQuantity(1);
      setNote("");
      onSaved();
    } catch (err) {
      notify(extractErrorMessage(err, "Could not log this acquisition."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label className="field">
        <span>Book</span>
        <select value={bookId} onChange={(e) => setBookId(e.target.value)} required>
          <option value="" disabled>
            Select a book…
          </option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} — {b.author}
            </option>
          ))}
        </select>
      </label>

      <div className="field-row">
        <label className="field field--narrow">
          <span>Copies received</span>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Note (optional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Supplier invoice #4471"
          />
        </label>
      </div>

      <div className="dialog__actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? "Logging…" : "Log acquisition"}
        </button>
      </div>
    </form>
  );
}

function ShelfAdjustmentForm({ books, onSaved }) {
  const { notify } = useToast();
  const [type, setType] = useState("LOST");
  const [bookId, setBookId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!bookId) {
      notify("Choose a book first.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        bookId: Number(bookId),
        quantity: Number(quantity),
        note: note || undefined,
      };
      const { data } =
        type === "LOST"
          ? await inventoryApi.recordShelfLoss(payload)
          : await inventoryApi.recordShelfDamage(payload);
      notify(
        `Recorded ${quantity} ${type === "LOST" ? "lost" : "damaged"} ${quantity === 1 ? "copy" : "copies"} of "${data.bookTitle}".`,
        "success",
      );
      setBookId("");
      setQuantity(1);
      setNote("");
      onSaved();
    } catch (err) {
      notify(extractErrorMessage(err, "Could not record this adjustment."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="field-row">
        <label className="field field--narrow">
          <span>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="LOST">Lost on shelf</option>
            <option value="DAMAGED">Damaged on shelf</option>
          </select>
        </label>
        <label className="field">
          <span>Book</span>
          <select value={bookId} onChange={(e) => setBookId(e.target.value)} required>
            <option value="" disabled>
              Select a book…
            </option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} — {b.author} ({b.availableCopies} on shelf)
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field-row">
        <label className="field field--narrow">
          <span>Copies</span>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Note (optional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Found water-damaged during stock take"
          />
        </label>
      </div>

      <p className="page__hint">
        Use this for copies found lost or damaged on the shelf. For a copy that&rsquo;s currently
        checked out, report it from that loan on the Borrowed Books page instead.
      </p>

      <div className="dialog__actions">
        <button type="submit" className="btn btn--danger" disabled={submitting}>
          {submitting ? "Saving…" : "Record"}
        </button>
      </div>
    </form>
  );
}

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();

  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const canManage = hasPermission("INVENTORY_MANAGE");

  async function load() {
    setLoading(true);
    try {
      const [summaryRes, logsRes, booksRes] = await Promise.all([
        inventoryApi.summary(),
        inventoryApi.logs(),
        // This page needs the full catalog for its dropdowns, not one page
        // of it - bookApi.list now returns a paged { content, ... } object.
        bookApi.list({ size: 1000, sort: "title,asc" }),
      ]);
      setSummary(summaryRes.data);
      setLogs(logsRes.data);
      setBooks(booksRes.data.content);
    } catch (err) {
      notify(extractErrorMessage(err, "Could not load inventory data."), "error");
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
        <PageLoader label="Counting the shelves…" />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Stock control</p>
          <h1>Inventory</h1>
        </div>
        <button className="btn btn--ghost" type="button" onClick={load}>
          Refresh
        </button>
      </header>

      {summary && (
        <div className="stat-grid">
          <StatCard label="Titles in catalog" value={formatNumber(summary.totalTitles)} />
          <StatCard label="Total copies" value={formatNumber(summary.totalCopies)} />
          <StatCard
            label="On the shelf"
            value={formatNumber(summary.availableCopies)}
            hint={`${formatNumber(summary.outOfStockTitles)} titles out of stock`}
          />
          <StatCard label="Out on loan" value={formatNumber(summary.borrowedCopies)} />
          <StatCard
            label="Lost copies"
            value={formatNumber(summary.lostCopies)}
            tone={summary.lostCopies > 0 ? "alert" : undefined}
          />
          <StatCard
            label="Damaged copies"
            value={formatNumber(summary.damagedCopies)}
            tone={summary.damagedCopies > 0 ? "alert" : undefined}
          />
        </div>
      )}

      {canManage && (
        <div className="dashboard-grid">
          <section className="panel">
            <h2 className="section-heading">Log a new acquisition</h2>
            <AcquisitionForm books={books} onSaved={load} />
          </section>

          <section className="panel">
            <h2 className="section-heading">Report lost or damaged stock</h2>
            <ShelfAdjustmentForm books={books} onSaved={load} />
          </section>
        </div>
      )}

      <h2 className="section-heading">Inventory activity</h2>

      {logs.length === 0 ? (
        <div className="empty-state">
          <p>No acquisitions, losses, or damage have been logged yet.</p>
        </div>
      ) : (
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Change</th>
              <th>Copies</th>
              <th>Note</th>
              <th>By</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.bookTitle}</td>
                <td>
                  <span
                    className={
                      log.type === "ACQUISITION" ? "stamp stamp--available" : "stamp stamp--out"
                    }
                  >
                    {LOG_TYPE_LABEL[log.type] || log.type}
                  </span>
                </td>
                <td>{log.quantity}</td>
                <td>{log.note || "—"}</td>
                <td>{log.performedBy}</td>
                <td>{formatDateTime(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
