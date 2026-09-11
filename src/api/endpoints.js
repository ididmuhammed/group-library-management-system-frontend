import api from "./axios";

// Builds a multipart/form-data body with a JSON part (named `jsonPartName`)
// and an optional file part named "image". Used by the book/user create &
// update endpoints, which accept an optional cover/profile image alongside
// the JSON fields.
function toFormData(jsonPartName, payload, imageFile) {
  const formData = new FormData();
  formData.append(
    jsonPartName,
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  if (imageFile) {
    formData.append("image", imageFile);
  }
  return formData;
}

export const authApi = {
  login: (username, password) =>
    api.post("/auth/login", { username, password }),
  me: () => api.get("/auth/me"),
};

export const bookApi = {
  list: (params) => api.get("/books", { params }),
  get: (id) => api.get(`/books/${id}`),
  create: (payload, imageFile) =>
    api.post("/books", toFormData("book", payload, imageFile)),
  update: (id, payload, imageFile) =>
    api.put(`/books/${id}`, toFormData("book", payload, imageFile)),
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
  list: (params) => api.get("/admin/users", { params }),
  get: (id) => api.get(`/admin/users/${id}`),
  create: (payload, imageFile) =>
    api.post("/admin/users", toFormData("user", payload, imageFile)),
  updateImage: (id, imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return api.put(`/admin/users/${id}/image`, formData);
  },
  updateRoles: (id, roleNames) =>
    api.put(`/admin/users/${id}/roles`, { roleNames }),
  setEnabled: (id, enabled) =>
    api.patch(`/admin/users/${id}/enabled?enabled=${enabled}`),
  remove: (id) => api.delete(`/admin/users/${id}`),
};

export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
};

export const inventoryApi = {
  summary: () => api.get("/inventory/summary"),
  logs: () => api.get("/inventory/logs"),
  recordAcquisition: (payload) => api.post("/inventory/acquisitions", payload),
  markLoanLost: (recordId, note) =>
    api.post(`/inventory/borrow-records/${recordId}/lost`, { note }),
  markLoanDamaged: (recordId, note) =>
    api.post(`/inventory/borrow-records/${recordId}/damaged`, { note }),
  recordShelfLoss: (payload) => api.post("/inventory/shelf-loss", payload),
  recordShelfDamage: (payload) => api.post("/inventory/shelf-damage", payload),
};

export const roleApi = {
  list: () => api.get("/admin/roles"),
  permissions: () => api.get("/admin/roles/permissions"),
  create: (payload) => api.post("/admin/roles", payload),
  updatePermissions: (id, permissionNames) =>
    api.put(`/admin/roles/${id}/permissions`, permissionNames),
};
