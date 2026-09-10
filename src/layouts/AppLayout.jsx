import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", permission: "DASHBOARD_VIEW" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/books", label: "Catalog", permission: "BOOK_READ" },
      { to: "/inventory", label: "Inventory", permission: "INVENTORY_READ" },
    ],
  },
  {
    label: "My Activity",
    items: [
      {
        to: "/my-loans",
        label: "My Borrowed Books",
        permission: "BOOK_BORROW",
      },
      {
        to: "/my-reservations",
        label: "My Reservations",
        permission: "BOOK_RESERVE",
      },
    ],
  },
  {
    label: "Circulation Records",
    items: [
      {
        to: "/all-borrowed-books",
        label: "Borrowed Books",
        permission: "BORROW_RECORD_READ_ALL",
      },
      {
        to: "/all-reservations",
        label: "All Reservations",
        permission: "RESERVATION_READ_ALL",
      },
      { to: "/all-fines", label: "All Fines", permission: "FINE_READ" },
    ],
  },
  {
    label: "User Management",
    items: [
      { to: "/admin/users", label: "People", permission: "USER_READ" },
      { to: "/admin/roles", label: "Roles", permission: "ROLE_MANAGE" },
    ],
  },
];

export default function AppLayout() {
  const { user, hasPermission, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer any time the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          type="button"
          className="topbar__menu-btn"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span className={"hamburger" + (mobileOpen ? " hamburger--open" : "")}>
            <span />
            <span />
            <span />
          </span>
        </button>
        <div className="topbar__brand">
          <span className="rail__mark">§</span>
          <p className="rail__title">Cops Lib</p>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="rail__backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={"rail" + (mobileOpen ? " rail--open" : "")}>
        <div className="rail__brand">
          <span className="rail__mark">§</span>
          <div>
            <p className="rail__title">Cops Lib</p>
            <p className="rail__subtitle">Library records</p>
          </div>
        </div>

        <nav className="rail__nav">
          {visibleGroups.map((group) => (
            <div className="rail__group" key={group.label}>
              <p className="rail__group-label">{group.label}</p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    "rail__link" + (isActive ? " rail__link--active" : "")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="rail__account">
          <div className="rail__avatar">
            {(user?.fullName || user?.username || "?")
              .slice(0, 1)
              .toUpperCase()}
          </div>
          <div className="rail__account-info">
            <p className="rail__account-name">
              {user?.fullName || user?.username}
            </p>
            <p className="rail__account-roles">
              {(user?.roles || []).join(", ")}
            </p>
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
