import api from "./axios";

export const authApi = {
  login: (username, password) =>
    api.post("/auth/login", { username, password }),
  me: () => api.get("/auth/me"),
};

export const bookApi = {
  list: () => api.get("/books"),
  get: (id) => api.get(`/books/${id}`),
  create: (payload) => api.post("/books", payload),
  update: (id, payload) => api.put(`/books/${id}`, payload),
  remove: (id) => api.delete(`/books/${id}`),
  borrow: (id) => api.post(`/books/${id}/borrow`),
  returnBook: (recordId) =>
    api.post(`/books/borrow-records/${recordId}/return`),
  myLoans: () => api.get("/books/my-loans"),
  allBorrowedBooks: () => api.get("/books/borrow-records"),
  allFines: () => api.get("fines"),
  payFine: (id) => api.patch(`fines/${id}/pay`),
  waiveFine: (id) => api.patch(`/fines/${id}/waive`),
  reserve: (id) => api.post(`/books/${id}/reserve`),
};

export const reservationApi = {
  myReservations: () => api.get("/reservations/my"),
  allReservations: () => api.get("/reservations"),
  pickup: (id) => api.post(`/reservations/${id}/pickup`),
  cancel: (id) => api.delete(`/reservations/${id}`),
};

export const userApi = {
  list: () => api.get("/admin/users"),
  get: (id) => api.get(`/admin/users/${id}`),
  create: (payload) => api.post("/admin/users", payload),
  updateRoles: (id, roleNames) =>
    api.put(`/admin/users/${id}/roles`, { roleNames }),
  setEnabled: (id, enabled) =>
    api.patch(`/admin/users/${id}/enabled?enabled=${enabled}`),
  remove: (id) => api.delete(`/admin/users/${id}`),
};

export const roleApi = {
  list: () => api.get("/admin/roles"),
  permissions: () => api.get("/admin/roles/permissions"),
  create: (payload) => api.post("/admin/roles", payload),
  updatePermissions: (id, permissionNames) =>
    api.put(`/admin/roles/${id}/permissions`, permissionNames),
};
