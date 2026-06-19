import { useState } from 'react'
import toast from 'react-hot-toast'
import { useFetch } from '../hooks/useFetch'
import { customerApi } from '../services/api'
import Modal from '../components/Modal'

function CustomerForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Full name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
  }

  const f = (key) => ({
    value: form[key],
    onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })),
  })

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-input" placeholder="e.g. Alice Johnson" {...f('full_name')} />
          {errors.full_name && <span className="form-error">{errors.full_name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input className="form-input" type="email" placeholder="alice@example.com" {...f('email')} />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input className="form-input" type="tel" placeholder="+1-555-0101" {...f('phone')} />
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Add Customer'}
        </button>
      </div>
    </form>
  )
}

export default function Customers() {
  const { data: customers, loading, error, refetch } = useFetch(customerApi.getAll)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (data) => {
    setSubmitting(true)
    try {
      await customerApi.create(data)
      toast.success('Customer added successfully!')
      setShowCreate(false)
      refetch()
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  const handleDeleteConfirm = async (id) => {
    try {
      await customerApi.delete(id)
      toast.success('Customer deleted.')
      refetch()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">Customers</h2>
          <p className="section-subtitle">Manage your customer database</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Customer
        </button>
      </div>

      {loading && <div className="loading-center"><div className="spinner" /></div>}
      {error && <div className="card" style={{ color: 'var(--red)' }}>⚠️ {error}</div>}

      {customers && (
        <div className="table-wrapper">
          <div className="table-header">
            <h3>All Customers</h3>
            <span className="badge blue">{customers.length} customers</span>
          </div>
          {customers.length === 0 ? (
            <div className="empty-state">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <p>No customers yet. Add your first customer!</p>
            </div>
          ) : (
            <table>
              <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Member Since</th><th>Actions</th></tr></thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="td-muted">#{c.id}</td>
                    <td><strong>{c.full_name}</strong></td>
                    <td className="td-muted">{c.email}</td>
                    <td className="td-muted">{c.phone || '—'}</td>
                    <td className="td-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreate && (
        <Modal title="Add New Customer" onClose={() => setShowCreate(false)}>
          <CustomerForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={submitting} />
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="Confirm Delete" onClose={() => setDeleteConfirm(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p>Are you sure you want to delete customer <strong>"{deleteConfirm.full_name}"</strong>? All their orders will also be deleted.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => {
                handleDeleteConfirm(deleteConfirm.id)
                setDeleteConfirm(null)
              }}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
