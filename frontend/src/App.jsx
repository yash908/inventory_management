import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Orders from './pages/Orders'

export default function App() {
  const pageNames = {
    '/': { title: 'Dashboard', subtitle: 'Welcome back 👋' },
    '/products': { title: 'Products', subtitle: 'Manage your product catalog' },
    '/customers': { title: 'Customers', subtitle: 'View and manage customers' },
    '/orders': { title: 'Orders', subtitle: 'Track and manage orders' },
  }
  const pathname = window.location.pathname
  const page = pageNames[pathname] || pageNames['/']

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{page.title}</div>
            <div className="topbar-subtitle">{page.subtitle}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="status-dot" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>System Online</span>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </main>
    </div>
  )
}
