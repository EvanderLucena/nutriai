interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = currentPage * 6 + 1;
  const to = Math.min((currentPage + 1) * 6, from + 5);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '12px 4px' }}>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
        {from}–{to}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="btn btn-ghost"
          style={{ padding: '5px 10px', opacity: currentPage === 0 ? 0.3 : 1 }}
        >
          ←
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i)}
            style={{
              padding: '5px 10px', borderRadius: 5, fontSize: 12.5,
              border: i === currentPage ? '1px solid var(--fg)' : '1px solid var(--border)',
              background: i === currentPage ? 'var(--ink)' : 'var(--surface)',
              color: i === currentPage ? 'var(--paper)' : 'var(--fg)',
              fontFamily: 'var(--font-mono)', minWidth: 32, cursor: 'pointer',
            }}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="btn btn-ghost"
          style={{ padding: '5px 10px', opacity: currentPage === totalPages - 1 ? 0.3 : 1 }}
        >
          →
        </button>
      </div>
    </div>
  );
}