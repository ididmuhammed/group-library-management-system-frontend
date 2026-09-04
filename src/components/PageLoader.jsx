export default function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader">
      <div className="page-loader__mark" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
