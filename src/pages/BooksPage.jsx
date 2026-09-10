import { useEffect, useState } from "react";
import { bookApi } from "../api/endpoints";
import { extractErrorMessage } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageLoader from "../components/PageLoader";
import BookFormDialog from "../components/BookFormDialog";
import PaginationControls from "../components/PaginationControls";

const SORT_OPTIONS = [
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
  { value: "category", label: "Category" },
  { value: "availableCopies", label: "Copies available" },
];

export default function BooksPage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState(null); // null | { mode: 'create' | 'edit', book? }
  const [busyId, setBusyId] = useState(null);

  // Filters (sent to the backend)
  const [searchInput, setSearchInput] = useState(""); // raw input, debounced into `search`
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState("title");
  const [sortDir, setSortDir] = useState("asc");

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const canCreate = hasPermission("BOOK_CREATE");
  const canUpdate = hasPermission("BOOK_UPDATE");
  const canDelete = hasPermission("BOOK_DELETE");
  const canBorrow = hasPermission("BOOK_BORROW");
  const canReserve = hasPermission("BOOK_RESERVE");

  // Debounce free-text search so we don't fire a request per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(0);
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  async function loadBooks() {
    setLoading(true);
    try {
      const { data } = await bookApi.list({
        page,
        size: pageSize,
        sort: `${sortField},${sortDir}`,
        search: search || undefined,
        category: category || undefined,
        availableOnly: availableOnly || undefined,
      });
      setBooks(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      notify(extractErrorMessage(err, "Could not load the catalog."), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortField, sortDir, search, category, availableOnly]);

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
      // Removing the last row on a page you can't go back from - nudge back a page.
      if (books.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        loadBooks();
      }
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

  function toggleSortDir() {
    setPage(0);
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

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
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="search-input"
        />
        <input
          type="text"
          placeholder="Filter by category"
          value={category}
          onChange={(e) => {
            setPage(0);
            setCategory(e.target.value);
          }}
          className="search-input search-input--narrow"
        />
        <label className="checkbox-list__item checkbox-list__item--inline">
          Available only
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => {
              setPage(0);
              setAvailableOnly(e.target.checked);
            }}
          />
        </label>

        <div className="sort-control">
          <select
            value={sortField}
            onChange={(e) => {
              setPage(0);
              setSortField(e.target.value);
            }}
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
            ))}
          </select>
          <button type="button" className="btn btn--small btn--ghost" onClick={toggleSortDir}>
            {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Pulling the shelves…" />
      ) : books.length === 0 ? (
        <div className="empty-state">
          <p>No titles match that search.</p>
        </div>
      ) : (
        <div className="card-grid">
          {books.map((book) => {
            const isOut = book.availableCopies <= 0;
            return (
              <article className="index-card" key={book.id}>
                {book.imageUrl && (
                  <img className="index-card__cover" src={book.imageUrl} alt={book.title} />
                )}
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

      {!loading && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPage(0);
            setPageSize(size);
          }}
        />
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
