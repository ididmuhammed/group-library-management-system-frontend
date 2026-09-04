import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div className="status-page">
      <p className="status-page__code">403</p>
      <h1>This shelf is off limits</h1>
      <p>Your account doesn't have permission to view this page. Ask an administrator if you think this is wrong.</p>
      <Link className="btn btn--primary" to="/books">Back to the catalog</Link>
    </div>
  );
}
