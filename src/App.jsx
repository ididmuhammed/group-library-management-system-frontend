import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import RequireAuth from './routes/RequireAuth';
import RequirePermission from './routes/RequirePermission';
import AppLayout from './layouts/AppLayout';

import LoginPage from './pages/LoginPage';
import BooksPage from './pages/BooksPage';
import MyLoansPage from './pages/MyLoansPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminRolesPage from './pages/AdminRolesPage';
import ForbiddenPage from './pages/ForbiddenPage';
import NotFoundPage from './pages/NotFoundPage';
import AllBorrowedBooksPage from './pages/AllBorrowedBooksPage'
import FinesPage from './pages/FinesPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/books" replace />} />

              <Route element={<RequirePermission permission="BOOK_READ" />}>
                <Route path="/books" element={<BooksPage />} />
              </Route>

              <Route element={<RequirePermission permission="BOOK_BORROW" />}>

                <Route path="/my-loans" element={<MyLoansPage />} />
              </Route>

              <Route element={<RequirePermission permission="BORROW_RECORD_READ_ALL" />}>
                <Route path='/all-borrowed-books' element={<AllBorrowedBooksPage />} />
              </Route>

               <Route element={<RequirePermission permission="BORROW_RECORD_READ_ALL" />}>
                <Route path='/all-fines' element={<FinesPage />} />
              </Route>

              <Route element={<RequirePermission permission="USER_READ" />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>

              <Route element={<RequirePermission permission="ROLE_MANAGE" />}>
                <Route path="/admin/roles" element={<AdminRolesPage />} />
              </Route>

              <Route path="/forbidden" element={<ForbiddenPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}






