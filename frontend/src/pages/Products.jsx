import { useState } from 'react'
import toast from 'react-hot-toast'
import { useFetch } from '../hooks/useFetch'
import { productApi } from '../services/api'
import Modal from '../components/Modal'

function ProductForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || { name: '', sku: '', price: '', quantity: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    if (form.price === '' || isNaN(form.price) || Number(form.price) < 0) e.price = 'Valid price required'
    if (form.quantity === '' || isNaN(form.quantity) || Number(form.quantity) < 0) e.quantity = 'Valid quantity required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, price: Number(form.price), quantity: Number(form.quantity) })
  }

  const f = (key) => ({
    value: form[key],
    onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })),
  })

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input className="form-input" placeholder="e.g. Laptop Pro 15" {...f('name')} />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">SKU Code *</label>
            <input className="form-input" placeholder="e.g. LAP-001" {...f('sku')} />
            {errors.sku && <span className="form-error">{errors.sku}</span>}
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Price (₹) *</label>
            <input className="form-input" type="number" step="0.01" min="0" placeholder="0.00" {...f('price')} />
            {errors.price && <span className="form-error">{errors.price}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Quantity in Stock *</label>
            <input className="form-input" type="number" min="0" placeholder="0" {...f('quantity')} />
            {errors.quantity && <span className="form-error">{errors.quantity}</span>}
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  )
}

export default function Products() {
  const { data: products, loading, error, refetch } = useFetch(productApi.getAll)
  const [showCreate, setShowCreate] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (data) => {
    setSubmitting(true)
    try {
      await productApi.create(data)
      toast.success('Product created successfully!')
      setShowCreate(false)
      refetch()
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  const handleUpdate = async (data) => {
    setSubmitting(true)
    try {
      await productApi.update(editProduct.id, data)
      toast.success('Product updated!')
      setEditProduct(null)
      refetch()
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  const handleDeleteConfirm = async (id) => {
    try {
      await productApi.delete(id)
      toast.success('Product deleted.')
      refetch()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">Products</h2>
          <p className="section-subtitle">Manage your product catalog and inventory</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Product
        </button>
      </div>

      {loading && <div className="loading-center"><div className="spinner" /></div>}
      {error && <div className="card" style={{ color: 'var(--red)' }}>⚠️ {error}</div>}

      {products && (
        <div className="table-wrapper">
          <div className="table-header">
            <h3>All Products</h3>
            <span className="badge blue">{products.length} items</span>
          </div>
          {products.length === 0 ? (
            <div className="empty-state">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <p>No products yet. Add your first product!</p>
            </div>
          ) : (
            <table>
              <thead><tr><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td><span className="badge blue">{p.sku}</span></td>
                    <td>₹{Number(p.price).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.quantity === 0 ? 'red' : p.quantity <= 10 ? 'amber' : 'green'}`}>
                        {p.quantity} units
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditProduct(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreate && (
        <Modal title="Add New Product" onClose={() => setShowCreate(false)}>
          <ProductForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={submitting} />
        </Modal>
      )}
      {editProduct && (
        <Modal title="Edit Product" onClose={() => setEditProduct(null)}>
          <ProductForm initial={editProduct} onSubmit={handleUpdate} onCancel={() => setEditProduct(null)} loading={submitting} />
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="Confirm Delete" onClose={() => setDeleteConfirm(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p>Are you sure you want to delete product <strong>"{deleteConfirm.name}"</strong>? This action cannot be undone.</p>
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
