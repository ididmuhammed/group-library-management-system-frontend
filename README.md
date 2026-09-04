# Stacks — Library Management Frontend

A React (Vite) frontend for the Spring Boot library management backend. Uses
`react-router-dom` for navigation and `axios` for all API calls, with JWT
access/refresh tokens and permission-aware routing/UI.

## Setup

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if your backend isn't on :8080
npm run dev
```

Opens on `http://localhost:5173`. Make sure the backend is running and its CORS
config allows this origin (the default backend config allows all origins).

Log in with the backend's seeded admin account (`admin` / `Admin@123` unless you
overrode it), then create other users from **People → Add a person**.

## How auth & permissions work here

- `src/api/axios.js` — a single axios instance. A request interceptor attaches
  `Authorization: Bearer <accessToken>` to every call. A response interceptor
  catches `401`s, refreshes the token once via `/api/auth/refresh`, and replays
  the original request; concurrent 401s share one in-flight refresh.
- `src/context/AuthContext.jsx` — decodes the JWT's `authorities` claim
  client-side (`src/api/jwt.js`) to drive which nav links and buttons render,
  and fetches `/api/auth/me` for display info (name, roles). **This is a UI
  convenience only** — every permission is re-checked server-side by Spring
  Security regardless of what the frontend shows or hides.
- `src/routes/RequireAuth.jsx` — redirects to `/login` if there's no valid
  session.
- `src/routes/RequirePermission.jsx` — wraps a route and redirects to
  `/forbidden` if the current user lacks the named permission (e.g.
  `BOOK_CREATE`, `USER_MANAGE_ROLES`).

## Structure

```
src/
  api/          axios instance, endpoint groups, JWT decode, error helpers
  context/      AuthContext, ToastContext
  routes/       RequireAuth, RequirePermission guards
  layouts/      AppLayout (left rail navigation)
  pages/        LoginPage, BooksPage, MyLoansPage, AdminUsersPage, AdminRolesPage, ForbiddenPage, NotFoundPage
  components/   BookFormDialog, UserFormDialog, RoleAssignDialog, RoleFormDialog, PageLoader
  styles/       index.css (single global stylesheet)
```

## Pages

| Route | Who sees it | What it does |
|---|---|---|
| `/login` | everyone | sign in |
| `/books` | `BOOK_READ` | browse/search the catalog; create/edit/delete/borrow depending on permissions |
| `/my-loans` | `BOOK_BORROW` | your active and past loans, with a return action |
| `/admin/users` | `USER_READ` | directory of users; create, assign roles, enable/disable, delete depending on permissions |
| `/admin/roles` | `ROLE_MANAGE` | view roles and their permission sets; create roles; edit non-admin roles' permissions |

## Notes

- No open self-registration screen — by design, matching the backend: only an
  authenticated admin (or anyone holding `USER_CREATE`) can create accounts.
- `ROLE_ADMIN`'s permission set is shown but locked in the UI, matching the
  backend's refusal to let it be edited.
- Tokens are stored in `localStorage`. For stricter XSS resistance, swap this
  for an httpOnly-cookie-based refresh flow on the backend and keep only the
  access token in memory — the frontend's `tokenStore` in `src/api/axios.js`
  is the single place that would need to change.
