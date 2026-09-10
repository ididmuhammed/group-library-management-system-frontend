import { useEffect, useState } from "react";
import { bookApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageLoader from "../components/PageLoader";
import BookFormDialog from "../components/BookFormDialog";

export default function BooksPage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogState, setDialogState] = useState(null); // null | { mode: 'create' | 'edit', book? }
  const [busyId, setBusyId] = useState(null);

  const canCreate = hasPermission("BOOK_CREATE");
  const canUpdate = hasPermission("BOOK_UPDATE");
  const canDelete = hasPermission("BOOK_DELETE");
  const canBorrow = hasPermission("BOOK_BORROW");
  const canReserve = hasPermission("BOOK_RESERVE");

  async function loadBooks() {
    setLoading(true);
    try {
      const { data } = await bookApi.list();
      setBooks(data);
    } catch (err) {
      notify(extractErrorMessage(err, "Could not load the catalog."), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBorrow(book) {
    setBusyId(book.id);
    try {
      await bookApi.borrow(book.id);
      notify(`"${book.title}" is checked out to you.`, "success");
      loadBooks();
    } catch (err) {
      notify(
        extractErrorMessage(err, "Could not check out this book."),
        "error",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleReserve(book) {
    setBusyId(book.id);
    try {
      await bookApi.reserve(book.id);
      notify(
        `You're on the list for "${book.title}" — we'll email you when a copy is ready.`,
        "success",
      );
      loadBooks();
    } catch (err) {
      notify(extractErrorMessage(err, "Could not reserve this book."), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(book) {
    if (!window.confirm(`Remove "${book.title}" from the catalog?`)) return;
    setBusyId(book.id);
    try {
      await bookApi.remove(book.id);
      notify(`"${book.title}" removed from the catalog.`, "success");
      loadBooks();
    } catch (err) {
      notify(extractErrorMessage(err, "Could not remove this book."), "error");
    } finally {
      setBusyId(null);
    }
  }

  function handleDialogSaved() {
    setDialogState(null);
    loadBooks();
  }

  const filtered = books.filter((b) => {
    const haystack =
      `${b.title} ${b.author} ${b.category || ""} ${b.isbn || ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Catalog</p>
          <h1>Every title on the shelves</h1>
        </div>
        {canCreate && (
          <button
            className="btn btn--primary"
            onClick={() => setDialogState({ mode: "create" })}
          >
            Add a book
          </button>
        )}
      </header>

      <div className="page__toolbar">
        <input
          type="search"
          placeholder="Search by title, author, category, or ISBN"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <p className="page__count">
          {filtered.length} of {books.length} titles
        </p>
      </div>

      {loading ? (
        <PageLoader label="Pulling the shelves…" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No titles match that search.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((book) => {
            const isOut = book.availableCopies <= 0;
            return (
              <article className="index-card" key={book.id}>
                <div className="index-card__tab">
                  {book.category || "Uncategorized"}
                </div>
                <h2 className="index-card__title">{book.title}</h2>
                <p className="index-card__author">{book.author}</p>
                {book.isbn && (
                  <p className="index-card__isbn">ISBN {book.isbn}</p>
                )}

                <div className="index-card__availability">
                  <span
                    className={
                      isOut ? "stamp stamp--out" : "stamp stamp--available"
                    }
                  >
                    {isOut
                      ? "All copies out"
                      : `${book.availableCopies} of ${book.totalCopies} available`}
                  </span>
                  {(book.lostCopies > 0 || book.damagedCopies > 0) && (
                    <span className="stamp stamp--out">
                      {book.lostCopies > 0 && `${book.lostCopies} lost`}
                      {book.lostCopies > 0 && book.damagedCopies > 0 && " · "}
                      {book.damagedCopies > 0 && `${book.damagedCopies} damaged`}
                    </span>
                  )}
                </div>

                <div className="index-card__actions">
                  {canBorrow && !isOut && (
                    <button
                      className="btn btn--small btn--primary"
                      disabled={busyId === book.id}
                      onClick={() => handleBorrow(book)}
                    >
                      Borrow
                    </button>
                  )}
                  {canReserve && isOut && (
                    <button
                      className="btn btn--small btn--primary"
                      disabled={busyId === book.id}
                      onClick={() => handleReserve(book)}
                    >
                      {busyId === book.id ? "Reserving…" : "Reserve"}
                    </button>
                  )}
                  {canUpdate && (
                    <button
                      className="btn btn--small btn--ghost"
                      onClick={() => setDialogState({ mode: "edit", book })}
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="btn btn--small btn--danger"
                      disabled={busyId === book.id}
                      onClick={() => handleDelete(book)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {dialogState && (
        <BookFormDialog
          mode={dialogState.mode}
          book={dialogState.book}
          onClose={() => setDialogState(null)}
          onSaved={handleDialogSaved}
        />
      )}
    </div>
  );
}
