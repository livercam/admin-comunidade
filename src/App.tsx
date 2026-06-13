import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth, isAdminEmail } from './config/firebase'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/Login'
import VisaoGeral from './pages/VisaoGeral'
import Moderacao from './pages/Moderacao'
import Usuarios from './pages/Usuarios'
import Pedidos from './pages/Pedidos'
import Testemunhos from './pages/Testemunhos'
import Celulas from './pages/Celulas'
import Configuracoes from './pages/Configuracoes'
import Categorias from './pages/Categorias'
import Suporte from './pages/Suporte'
import Denuncias from './pages/Denuncias'
import TitulosMinisteriais from './pages/TitulosMinisteriais'
import Anuncios from './pages/Anuncios'
import Faq from './pages/Faq'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Se há um utilizador logado mas não é admin, desloga-o
      if (currentUser && !isAdminEmail(currentUser.email)) {
        await signOut(auth)
        setUser(null)
      } else {
        setUser(currentUser)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          element={user ? <AdminLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="/" element={<VisaoGeral />} />
          <Route path="/moderacao" element={<Moderacao />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/testemunhos" element={<Testemunhos />} />
          <Route path="/celulas" element={<Celulas />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/titulos" element={<TitulosMinisteriais />} />
          <Route path="/denuncias" element={<Denuncias />} />
          <Route path="/suporte" element={<Suporte />} />
          <Route path="/anuncios" element={<Anuncios />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    fontSize: 18,
  },
}

export default App
