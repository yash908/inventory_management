import { useState } from 'react'
import toast from 'react-hot-toast'
import { useFetch } from '../hooks/useFetch'
import { orderApi, productApi, customerApi } from '../services/api'
import Modal from '../components/Modal'

function OrderForm({ products, customers, onSubmit, onCancel, loading }) {
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!customerId) e.customer = 'Please select a customer'
    items.forEach((item, i) => {
      if (!item.product_id) e[`product_${i}`] = 'Select a product'
      if (!item.quantity || item.quantity < 1) e[`qty_${i}`] = 'Min qty is 1'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      customer_id: Number(customerId),
      items: items.map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })),
    })
  }

  const addItem = () => setItems((p) => [...p, { product_id: '', quantity: 1 }])
  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i))
  const updateItem = (i, key, val) => setItems((p) => p.map((item, idx) => idx === i ? { ...item, [key]: val } : item))

  const selectedProductIds = items.map((i) => i.product_id).filter(Boolean)

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">Customer *</label>
          <select className="form-select" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
          </select>
          {errors.customer && <span className="form-error">{errors.customer}</span>}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <label className="form-label">Order Items *</label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Item</button>
          </div>
          {items.map((item, i) => (
            <div key={i} className="order-item-row">
              <div>
                <select
                  className="form-select"
                  value={item.product_id}
                  onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                >
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={selectedProductIds.includes(String(p.id)) && item.product_id !== String(p.id)}>
                      {p.name} (Stock: {p.quantity}) — ₹{Number(p.price).toFixed(2)}
                    </option>
                  ))}
                </select>
                {errors[`product_${i}`] && <span className="form-error">{errors[`product_${i}`]}</span>}
              </div>
              <div style={{ width: '80px' }}>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                />
                {errors[`qty_${i}`] && <span className="form-error">{errors[`qty_${i}`]}</span>}
              </div>
              {items.length > 1 && (
                <button type="button" className="order-item-remove" onClick={() => removeItem(i)} title="Remove item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Placing Order…' : 'Place Order'}
        </button>
      </div>
    </form>
  )
}

export default function Orders() {
  const { data: orders, loading, error, refetch } = useFetch(orderApi.getAll)
  const { data: products } = useFetch(productApi.getAll)
  const { data: customers } = useFetch(customerApi.getAll)
  const [showCreate, setShowCreate] = useState(false)
  const [viewOrder, setViewOrder] = useState(null)
  const [cancelConfirm, setCancelConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (data) => {
    setSubmitting(true)
    try {
      await orderApi.create(data)
      toast.success('Order placed successfully!')
      setShowCreate(false)
      refetch()
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  const handleCancelConfirm = async (id) => {
    try {
      await orderApi.delete(id)
      toast.success('Order cancelled.')
      refetch()
    } catch (err) { toast.error(err.message) }
  }

  const statusBadge = (status) => {
    const map = { pending: 'amber', completed: 'green', cancelled: 'red' }
    return <span className={`badge ${map[status] || 'blue'}`}>{status}</span>
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">Orders</h2>
          <p className="section-subtitle">Create and manage customer orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Order
        </button>
      </div>

      {loading && <div className="loading-center"><div className="spinner" /></div>}
      {error && <div className="card" style={{ color: 'var(--red)' }}>⚠️ {error}</div>}

      {orders && (
        <div className="table-wrapper">
          <div className="table-header">
            <h3>All Orders</h3>
            <span className="badge blue">{orders.length} orders</span>
          </div>
          {orders.length === 0 ? (
            <div className="empty-state">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p>No orders yet. Create your first order!</p>
            </div>
          ) : (
            <table>
              <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td className="td-muted">
                      {customers?.find((c) => c.id === o.customer_id)?.full_name || `Customer #${o.customer_id}`}
                    </td>
                    <td className="td-muted">{o.items?.length || 0} item(s)</td>
                    <td><strong>₹{Number(o.total_amount).toFixed(2)}</strong></td>
                    <td>{statusBadge(o.status)}</td>
                    <td className="td-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setViewOrder(o)}>Details</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setCancelConfirm(o)}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreate && products && customers && (
        <Modal title="Create New Order" onClose={() => setShowCreate(false)}>
          <OrderForm
            products={products}
            customers={customers}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={submitting}
          />
        </Modal>
      )}

      {cancelConfirm && (
        <Modal title="Cancel Order" onClose={() => setCancelConfirm(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p>Are you sure you want to cancel order <strong>#{cancelConfirm.id}</strong>? Product stock levels will be restored automatically.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setCancelConfirm(null)}>No, Keep Order</button>
              <button className="btn btn-danger" onClick={() => {
                handleCancelConfirm(cancelConfirm.id)
                setCancelConfirm(null)
              }}>Yes, Cancel Order</button>
            </div>
          </div>
        </Modal>
      )}
      {viewOrder && (
        <Modal title={`Order #${viewOrder.id} Details`} onClose={() => setViewOrder(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span className="td-muted">Customer</span><br />
                <strong>{customers?.find((c) => c.id === viewOrder.customer_id)?.full_name || `#${viewOrder.customer_id}`}</strong>
              </div>
              <div><span className="td-muted">Status</span><br />{statusBadge(viewOrder.status)}</div>
              <div><span className="td-muted">Total Amount</span><br /><strong style={{ color: 'var(--emerald)', fontSize: '1.2rem' }}>₹{Number(viewOrder.total_amount).toFixed(2)}</strong></div>
              <div><span className="td-muted">Date</span><br /><strong>{new Date(viewOrder.created_at).toLocaleString()}</strong></div>
            </div>
            <div>
              <p className="form-label" style={{ marginBottom: '0.5rem' }}>Order Items</p>
              {viewOrder.items?.map((item) => (
                <div key={item.id} className="order-item-row" style={{ gridTemplateColumns: '1fr auto auto' }}>
                  <span>{products?.find((p) => p.id === item.product_id)?.name || `Product #${item.product_id}`}</span>
                  <span className="badge blue">×{item.quantity}</span>
                  <span style={{ color: 'var(--emerald)' }}>₹{Number(item.unit_price).toFixed(2)} ea</span>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setViewOrder(null)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
