export default function PaginationControls({ page, totalPages, totalElements, onPageChange, pageSize, onPageSizeChange }) {
  const isFirst = page <= 0;
  const isLast = page >= totalPages - 1;

  return (
    <div className="pagination">
      <span className="pagination__summary">
        {totalElements === 0
          ? 'No results'
          : `Page ${page + 1} of ${Math.max(totalPages, 1)} · ${totalElements} total`}
      </span>

      <div className="pagination__controls">
        {onPageSizeChange && (
          <select
            className="pagination__page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Results per page"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
        )}
        <button
          type="button"
          className="btn btn--small btn--ghost"
          disabled={isFirst}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        <button
          type="button"
          className="btn btn--small btn--ghost"
          disabled={isLast}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
