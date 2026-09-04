import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="status-page">
      <p className="status-page__code">404</p>
      <h1>Nothing filed under that call number</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link className="btn btn--primary" to="/books">Back to the catalog</Link>
    </div>
  );
}
