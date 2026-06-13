import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import {
  Users,
  HeartHandshake,
  Church,
  Home,
  Activity,
  Crown,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

interface Stats {
  totalUsuarios: number
  totalPedidos: number
  totalTestemunhos: number
  totalCelulas: number
}

interface UserInfo {
  id: string
  nome?: string
  email?: string
  criadoEm?: { toDate?: () => Date; seconds?: number }
  titulo_ministerial?: string
  cargo?: string
  role?: string
}

interface PedidoInfo {
  id: string
  categoria?: string
}

const cards = [
  {
    key: 'totalUsuarios' as const,
    icon: Users,
    label: 'Total de Usuários',
    gradient: 'linear-gradient(135deg, #A94438, #D76B5A)',
    lightColor: '#FEF2F2',
    iconColor: '#A94438',
  },
  {
    key: 'totalPedidos' as const,
    icon: HeartHandshake,
    label: 'Total de Pedidos',
    gradient: 'linear-gradient(135deg, #E07A5F, #F4A261)',
    lightColor: '#FFF7ED',
    iconColor: '#E07A5F',
  },
  {
    key: 'totalTestemunhos' as const,
    icon: Church,
    label: 'Total de Testemunhos',
    gradient: 'linear-gradient(135deg, #81B29A, #A8D5BA)',
    lightColor: '#F0FDF4',
    iconColor: '#81B29A',
  },
  {
    key: 'totalCelulas' as const,
    icon: Home,
    label: 'Total de Células',
    gradient: 'linear-gradient(135deg, #3D405B, #5C5F7A)',
    lightColor: '#F8FAFC',
    iconColor: '#3D405B',
  },
]

// Cores para o gráfico de pizza
const PIE_COLORS = ['#A94438', '#E07A5F', '#81B29A', '#3D405B', '#D97706', '#7C3AED', '#0891B2', '#059669']
const CARGO_LABELS: Record<string, string> = {
  membro: 'Membro',
  pastor: 'Pastor',
  presbitero: 'Presbítero',
  evangelista: 'Evangelista',
  missionario: 'Missionário',
  diacono: 'Diácono',
  lider: 'Líder',
  administrador: 'Administrador',
}

function normalizarCargo(raw?: string): string {
  if (!raw) return 'membro'
  const r = raw.toLowerCase().trim()
  if (r === 'admin' || r === 'administrador') return 'administrador'
  if (r === 'pastor' || r === 'pastora') return 'pastor'
  if (r === 'presbitero' || r === 'presbítero') return 'presbitero'
  if (r === 'evangelista') return 'evangelista'
  if (r === 'missionario' || r === 'missionário') return 'missionario'
  if (r === 'diacono' || r === 'diácono') return 'diacono'
  if (r === 'lider' || r === 'líder' || r === 'lideranca' || r === 'liderança') return 'lider'
  return 'membro'
}

export default function VisaoGeral() {
  const [stats, setStats] = useState<Stats>({
    totalUsuarios: 0,
    totalPedidos: 0,
    totalTestemunhos: 0,
    totalCelulas: 0,
  })
  const [recentUsers, setRecentUsers] = useState<UserInfo[]>([])
  const [pedidos, setPedidos] = useState<PedidoInfo[]>([])
  const [allUsers, setAllUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      if (timeoutId) clearTimeout(timeoutId)
      const users: UserInfo[] = []
      snap.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserInfo)
      })
      setAllUsers(users)
      setStats((prev) => ({ ...prev, totalUsuarios: snap.size }))
      setRecentUsers(
        users
          .sort((a, b) => {
            const aTime = a.criadoEm?.toDate?.()?.getTime() ?? a.criadoEm?.seconds ?? 0
            const bTime = b.criadoEm?.toDate?.()?.getTime() ?? b.criadoEm?.seconds ?? 0
            return bTime - aTime
          })
          .slice(0, 5)
      )
      setLoading(false)
    }, () => {
      setAllUsers([])
      setLoading(false)
    })

    const unsubPedidos = onSnapshot(collection(db, 'pedidos_oracao'), (snap) => {
      setStats((prev) => ({ ...prev, totalPedidos: snap.size }))
      const data: PedidoInfo[] = []
      snap.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as PedidoInfo)
      })
      setPedidos(data)
    })

    const unsubTestemunhos = onSnapshot(collection(db, 'testemunhos'), (snap) => {
      setStats((prev) => ({ ...prev, totalTestemunhos: snap.size }))
    })

    const unsubCelulas = onSnapshot(collection(db, 'celulas'), (snap) => {
      setStats((prev) => ({ ...prev, totalCelulas: snap.size }))
    })

    timeoutId = setTimeout(() => setLoading(false), 5000)

    return () => {
      unsubUsers()
      unsubPedidos()
      unsubTestemunhos()
      unsubCelulas()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Dados REAIS: distribuição de cargos
  const cargosData = useMemo(() => {
    const count: Record<string, number> = {}
    allUsers.forEach((u) => {
      const cargo = normalizarCargo(u.titulo_ministerial || u.cargo || u.role)
      count[cargo] = (count[cargo] || 0) + 1
    })
    return Object.entries(count)
      .map(([key, value]) => ({
        name: CARGO_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
        value,
      })
    ).sort((a, b) => b.value - a.value)
  }, [allUsers])

  // Dados REAIS: pedidos por categoria
  const categoriasData = useMemo(() => {
    const count: Record<string, number> = {}
    pedidos.forEach((p) => {
      const cat = p.categoria || 'sem_categoria'
      count[cat] = (count[cat] || 0) + 1
    })
    return Object.entries(count)
      .map(([key, value]) => {
        const label = key === 'sem_categoria' ? 'Sem categoria' : key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
        return { name: label, value }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [pedidos])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <p style={{ color: '#6B7280' }}>Carregando estatísticas...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard</h1>
          <p style={styles.pageSubtitle}>
            Acompanhe as métricas da comunidade em tempo real
          </p>
        </div>
        <div style={styles.dateBadge}>
          <Activity size={16} />
          <span>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div style={styles.cardsGrid}>
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.key} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={{ ...styles.cardIconBox, backgroundColor: card.lightColor }}>
                  <Icon size={24} color={card.iconColor} />
                </div>
              </div>
              <div style={styles.cardValue}>{stats[card.key]}</div>
              <div style={styles.cardLabel}>{card.label}</div>
              <div style={styles.cardBar}>
                <div
                  style={{
                    ...styles.cardBarFill,
                    width: `${Math.min((stats[card.key] / (stats.totalUsuarios || 1)) * 100, 100)}%`,
                    background: card.gradient,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Gráficos */}
      <div style={styles.chartsRow}>
        {/* Gráfico de Distribuição de Cargos */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <Crown size={18} color="#A94438" />
            <h3 style={styles.chartTitle}>Distribuição de Cargos</h3>
          </div>
          {cargosData.length === 0 ? (
            <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>
              Nenhum usuário cadastrado
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={cargosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {cargosData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfico de Pedidos por Categoria */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <HeartHandshake size={18} color="#E07A5F" />
            <h3 style={styles.chartTitle}>Pedidos por Categoria</h3>
          </div>
          {categoriasData.length === 0 ? (
            <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>
              Nenhum pedido de oração
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoriasData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {categoriasData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Últimos usuários */}
      <div style={styles.recentSection}>
        <div style={styles.recentHeader}>
          <h3 style={styles.sectionTitle}>👥 Últimos Usuários</h3>
          <a href="/usuarios" style={styles.verTodos}>
            Ver todos
          </a>
        </div>
        <div style={styles.recentTable}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Data</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={styles.emptyTd}>
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => (
                  <tr key={user.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.userName}>
                        <div style={styles.userAvatar}>
                          {user.nome?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        {user.nome || 'Sem nome'}
                      </div>
                    </td>
                    <td style={styles.td}>{user.email || '-'}</td>
                    <td style={styles.td}>
                      {user.criadoEm?.toDate
                        ? user.criadoEm.toDate().toLocaleDateString('pt-BR')
                        : user.criadoEm?.seconds
                        ? new Date(user.criadoEm.seconds * 1000).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  pageTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: '#1F2937',
  },
  pageSubtitle: {
    margin: '4px 0 0 0',
    color: '#6B7280',
    fontSize: 14,
  },
  dateBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    color: '#6B7280',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #F3F4F6',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 700,
    color: '#1F2937',
    lineHeight: 1,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  cardBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  cardBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 1s ease',
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 20,
    marginBottom: 24,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  chartTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#1F2937',
  },
  recentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  recentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #F3F4F6',
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#1F2937',
  },
  verTodos: {
    fontSize: 13,
    color: '#A94438',
    textDecoration: 'none',
    fontWeight: 600,
  },
  recentTable: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    padding: '12px 20px',
    color: '#6B7280',
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '1px solid #F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  tr: {
    borderBottom: '1px solid #F3F4F6',
  },
  td: {
    padding: '12px 20px',
    color: '#1F2937',
  },
  emptyTd: {
    padding: '32px 20px',
    textAlign: 'center',
    color: '#9CA3AF',
  },
  userName: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #A94438, #E07A5F)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: 13,
    flexShrink: 0,
  },
}