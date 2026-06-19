import { useNavigate } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { dashboardApi } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: stats, loading, error } = useFetch(dashboardApi.getStats)
  const { data: logs, loading: logsLoading } = useFetch(dashboardApi.getLogs)

  const cards = stats
    ? [
        { label: 'Total Products', value: stats.total_products, color: 'indigo', path: '/products', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
        { label: 'Total Customers', value: stats.total_customers, color: 'emerald', path: '/customers', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { label: 'Total Orders', value: stats.total_orders, color: 'amber', path: '/orders', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
        { label: 'Low Stock Items', value: stats.low_stock_products?.length || 0, color: 'red', path: '/products', icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
      ]
    : []

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">Dashboard</h2>
          <p className="section-subtitle">Overview of your inventory and operations</p>
        </div>
      </div>

      {loading && <div className="loading-center"><div className="spinner" /></div>}
      {error && <div className="card" style={{ color: 'var(--red)' }}>⚠️ {error}</div>}

      {stats && (
        <>
          <div className="stats-grid">
            {cards.map((card) => (
              <div
                key={card.label}
                className={`stat-card ${card.color}`}
                onClick={() => card.path && navigate(card.path)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`stat-icon ${card.color}`}>{card.icon}</div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            {stats.low_stock_products?.length > 0 && (
              <div className="table-wrapper">
                <div className="table-header">
                  <h3>⚠️ Low Stock Products</h3>
                  <span className="badge red">{stats.low_stock_products.length} items</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Stock</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.low_stock_products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td className="td-muted">{p.sku}</td>
                        <td>
                          <span className={`badge ${p.quantity === 0 ? 'red' : 'amber'}`}>
                            {p.quantity === 0 ? 'Out of Stock' : `${p.quantity} left`}
                          </span>
                        </td>
                        <td>₹{Number(p.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Recent Activity Logs */}
            <div className="table-wrapper">
              <div className="table-header">
                <h3>⚡ Recent System Activity</h3>
                <span className="badge blue">Audit Trail</span>
              </div>
              {logsLoading && <div className="loading-center"><div className="spinner" /></div>}
              {logs && logs.length === 0 ? (
                <div className="empty-state">
                  <p>No activity recorded yet.</p>
                </div>
              ) : (
                logs && (
                  <table>
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Details</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ width: '180px' }}>
                            <span className={`badge ${
                              log.action.includes('Created') || log.action.includes('Placed') ? 'green' :
                              log.action.includes('Deleted') || log.action.includes('Cancelled') ? 'red' : 'blue'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td>{log.details}</td>
                          <td className="td-muted" style={{ width: '220px' }}>{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
