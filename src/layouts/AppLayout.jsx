import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/books', label: 'Catalog', permission: 'BOOK_READ' },
  { to: '/my-loans', label: 'My Borrowed Books', permission: 'BOOK_BORROW' },

   { to: '/all-borrowed-books', label: 'Borrowed Books', permission: 'BORROW_RECORD_READ_ALL' },
{ to: '/all-fines', label: 'All Fines', permission: 'BORROW_RECORD_READ_ALL' },
  { to: '/admin/users', label: 'People', permission: 'USER_READ' },
  { to: '/admin/roles', label: 'Roles', permission: 'ROLE_MANAGE' },
];

export default function AppLayout() {
  const { user, hasPermission, logout } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  return (
    <div className="app-shell">
      <aside className="rail">
        <div className="rail__brand">
          <span className="rail__mark">§</span>
          <div>
            <p className="rail__title">Stacks</p>
            <p className="rail__subtitle">Library records</p>
          </div>
        </div>

        <nav className="rail__nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 'rail__link' + (isActive ? ' rail__link--active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="rail__account">
          <div className="rail__avatar">{(user?.fullName || user?.username || '?').slice(0, 1).toUpperCase()}</div>
          <div className="rail__account-info">
            <p className="rail__account-name">{user?.fullName || user?.username}</p>
            <p className="rail__account-roles">{(user?.roles || []).join(', ')}</p>
          </div>
          <button className="rail__logout" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
