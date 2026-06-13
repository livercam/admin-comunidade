import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  Church,
  Tags,
  Crown,
  Flag,
  LifeBuoy,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Shield,
  Megaphone,
  HelpCircle,
} from 'lucide-react'

const menuItems = [
  { path: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { path: '/moderacao', label: 'Moderação', icon: Shield },
  { path: '/usuarios', label: 'Usuários', icon: Users },
  { path: '/pedidos', label: 'Pedidos de Oração', icon: HeartHandshake },
  { path: '/testemunhos', label: 'Testemunhos', icon: Church },
  { path: '/celulas', label: 'Células', icon: Church },
  { path: '/categorias', label: 'Categorias', icon: Tags },
  { path: '/titulos', label: 'Títulos Ministeriais', icon: Crown },
  { path: '/denuncias', label: 'Denúncias', icon: Flag },
  { path: '/suporte', label: 'Suporte', icon: LifeBuoy },
  { path: '/anuncios', label: 'Anúncios', icon: Megaphone },
  { path: '/faq', label: 'Ajuda / FAQ', icon: HelpCircle },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  const filteredMenu = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={styles.container}>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Botão flutuante para abrir sidebar quando fechada */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={styles.floatingToggle}
          title="Abrir menu"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          width: sidebarOpen ? 260 : 0,
          padding: sidebarOpen ? '20px 12px' : '20px 0',
          overflow: sidebarOpen ? 'visible' : 'hidden',
          borderRight: sidebarOpen ? 'none' : 'none',
        }}
      >
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>
            <Crown size={24} color="#FFF" />
          </div>
          {sidebarOpen && (
            <div style={styles.logoTextArea}>
              <h2 style={styles.logoText}>Interceder</h2>
              <span style={styles.logoSub}>Admin</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.toggleBtn}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Search */}
        {sidebarOpen && (
          <div style={styles.searchBox}>
            <Search size={16} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Buscar menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        )}

        {/* Navigation */}
        <nav style={styles.nav}>
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                ...styles.navLink,
                padding: sidebarOpen ? '12px 16px' : '12px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                ...(isActive ? styles.navLinkActive : styles.navLinkInactive),
              })}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            ...styles.logoutButton,
            padding: sidebarOpen ? '12px 16px' : '12px',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
          }}
          title={!sidebarOpen ? 'Sair' : undefined}
        >
          <LogOut size={20} />
          {sidebarOpen && <span>Sair</span>}
        </button>
      </aside>

      {/* Main Content */}
      <div style={styles.mainWrapper}>
        {/* Topbar */}
        <header style={styles.topbar}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.mobileMenuBtn}
          >
            <Menu size={22} />
          </button>

          <div style={styles.topbarLeft}>
            <h3 style={styles.pageTitle}>
              {menuItems.find(
                (item) =>
                  item.path === window.location.pathname
              )?.label || 'Dashboard'}
            </h3>
          </div>

          <div style={styles.topbarRight}>
            <button style={styles.iconBtn}>
              <Bell size={20} />
              <span style={styles.notifBadge}>3</span>
            </button>
            <div style={styles.adminAvatar}>
              <span>A</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F5F6FA',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  sidebar: {
    backgroundColor: '#1E1B2E',
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 12px',
    flexShrink: 0,
    transition: 'width 0.3s ease',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    zIndex: 100,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    paddingLeft: 4,
    position: 'relative',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #A94438, #E07A5F)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoTextArea: {
    flex: 1,
  },
  logoText: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#FFFFFF',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  toggleBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#FFFFFF',
    cursor: 'pointer',
    padding: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    position: 'absolute' as const,
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  floatingToggle: {
    position: 'fixed' as const,
    top: 20,
    left: 20,
    zIndex: 1001,
    background: '#1E1B2E',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#FFFFFF',
    cursor: 'pointer',
    width: 44,
    height: 44,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: '8px 12px',
    marginBottom: 16,
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    overflowY: 'auto',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    fontSize: 14,
    textDecoration: 'none',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  navLinkInactive: {
    background: 'transparent',
    color: '#9CA3AF',
  },
  navLinkActive: {
    background: 'rgba(169, 68, 56, 0.25)',
    color: '#FFFFFF',
    fontWeight: 600,
    borderLeft: '3px solid #A94438',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#9CA3AF',
    fontSize: 14,
    borderRadius: 8,
    cursor: 'pointer',
    marginTop: 12,
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 28px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    gap: 16,
  },
  mobileMenuBtn: {
    display: 'none',
    background: 'transparent',
    border: 'none',
    color: '#374151',
    cursor: 'pointer',
    padding: 4,
  },
  topbarLeft: {
    flex: 1,
  },
  pageTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: '#1F2937',
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    position: 'relative',
    background: '#F3F4F6',
    border: 'none',
    borderRadius: 8,
    width: 38,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6B7280',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 700,
    width: 18,
    height: 18,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #A94438, #E07A5F)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
  },
  mainContent: {
    flex: 1,
    padding: 28,
    overflowY: 'auto',
    backgroundColor: '#F5F6FA',
  },
}

