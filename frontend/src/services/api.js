import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Response interceptor for error normalization
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      (Array.isArray(error.response?.data?.detail)
        ? error.response.data.detail.map((e) => e.msg).join(', ')
        : null) ||
      error.message ||
      'An unexpected error occurred.'
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)))
  }
)

// ---- Products ----
export const productApi = {
  getAll: () => api.get('/products/').then((r) => r.data),
  getById: (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (data) => api.post('/products/', data).then((r) => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/products/${id}`).then((r) => r.data),
}

// ---- Customers ----
export const customerApi = {
  getAll: () => api.get('/customers/').then((r) => r.data),
  getById: (id) => api.get(`/customers/${id}`).then((r) => r.data),
  create: (data) => api.post('/customers/', data).then((r) => r.data),
  delete: (id) => api.delete(`/customers/${id}`).then((r) => r.data),
}

// ---- Orders ----
export const orderApi = {
  getAll: () => api.get('/orders/').then((r) => r.data),
  getById: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  create: (data) => api.post('/orders/', data).then((r) => r.data),
  delete: (id) => api.delete(`/orders/${id}`).then((r) => r.data),
}

// ---- Dashboard ----
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats').then((r) => r.data),
  getLogs: () => api.get('/dashboard/logs').then((r) => r.data),
}

export default api
