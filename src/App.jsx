import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import SuperAdminPage from './pages/SuperAdminPage'
import StorePage from './pages/StorePage'
import AdminPage from './pages/AdminPage'
import './index.css'
import './App.css'

export default function App() {
  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname.startsWith('/admin/')) {
        window.location.reload()
      }
    }
    window.addEventListener('popstate', onPopState)

    const onClick = (e) => {
      const a = e.target.closest('a')
      if (a && a.getAttribute('href')?.startsWith('/admin/')) {
        e.preventDefault()
        window.location.href = a.getAttribute('href')
      }
    }
    document.addEventListener('click', onClick, true)

    return () => {
      window.removeEventListener('popstate', onPopState)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StorePage />} />
          <Route path="/loja/:slug" element={<StorePage />} />
          <Route path="/super-admin" element={<SuperAdminPage />} />
          <Route path="/admin/:slug" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
