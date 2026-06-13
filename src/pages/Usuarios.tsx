import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Users, Crown, Trash2, Search, Diamond } from 'lucide-react'

interface User {
  id: string
  nome?: string
  email?: string
  whatsapp?: string
  foto_url?: string
  photoURL?: string
  avatar_url?: string
  criadoEm?: Timestamp
  criado_em?: Timestamp
  createdAt?: Timestamp
  titulo_ministerial?: string
  role?: string
  tipo?: string
  perfil?: string
  cargo?: string
  papel?: string
  endossos_uids?: string[]
  verificado_lideranca?: boolean
  isPremium?: boolean
}

const DEFAULT_ROLES = [
  { value: 'membro', label: 'Membro' },
  { value: 'diacono', label: 'Diácono' },
  { value: 'missionario', label: 'Missionário' },
  { value: 'evangelista', label: 'Evangelista' },
  { value: 'presbitero', label: 'Presbítero' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'lider', label: 'Líder' },
  { value: 'administrador', label: 'Administrador' },
]

const roleColors: Record<string, string> = {
  administrador: '#DC2626',
  pastor: '#1D4ED8',
  presbitero: '#7C3AED',
  evangelista: '#059669',
  missionario: '#D97706',
  diacono: '#0891B2',
  lider: '#0F766E',
  membro: '#6B7280',
}

const roleLabels: Record<string, string> = {
  administrador: 'Administrador',
  pastor: 'Pastor',
  presbitero: 'Presbítero',
  evangelista: 'Evangelista',
  missionario: 'Missionário',
  diacono: 'Diácono',
  lider: 'Líder',
  membro: 'Membro',
}

function normalizarCargo(raw: string): string {
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

function getCargo(user: User): string {
  if (user.titulo_ministerial) {
    return normalizarCargo(user.titulo_ministerial)
  }
  const raw = user.cargo || user.papel || user.role || user.tipo || 'Membro'
  return normalizarCargo(raw)
}

function getFotoUrl(user: User): string | null {
  return user.foto_url || user.photoURL || user.avatar_url || null
}

function formatWhatsApp(whatsapp?: string): string {
  if (!whatsapp) return 'Não informado'
  const digits = whatsapp.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return whatsapp
}

function formatCriadoEm(user: User): string {
  const ts = user.criadoEm || user.criado_em || user.createdAt
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleDateString('pt-BR')
  }
  return ts || '-'
}

export default function Usuarios() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleOptions, setRoleOptions] = useState(DEFAULT_ROLES)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (timeoutId) clearTimeout(timeoutId)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[]
        setUsers(data)
        setLoading(false)
      },
      () => {
        setUsers([])
        setLoading(false)
      }
    )

    const unsubTitulos = onSnapshot(
      query(collection(db, 'titulos_ministeriais'), orderBy('ordem', 'asc')),
      (snapshot) => {
        const titulos = snapshot.docs.map((doc) => ({
          value: doc.data().value || doc.id,
          label: doc.data().label || doc.data().value || 'Sem nome',
        }))
        if (titulos.length > 0) {
          const existentes = titulos.map((t) => t.value)
          if (!existentes.includes('membro')) {
            titulos.push({ value: 'membro', label: 'Membro' })
          }
          setRoleOptions(titulos)
        }
      },
      () => {
        // erro ao carregar títulos - manter padrão
      }
    )

    timeoutId = setTimeout(() => {
      setUsers([])
      setLoading(false)
    }, 5000)

    return () => {
      unsubUsers()
      unsubTitulos()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const handleExcluir = async (id: string, nome?: string) => {
    if (!window.confirm(`Tem certeza que deseja banir/excluir o usuário "${nome || id}"?`)) return
    try {
      await deleteDoc(doc(db, 'users', id))
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      alert('Erro ao excluir usuário.')
    }
  }

  const handleTogglePremium = async (userId: string, premium: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isPremium: premium,
      })
    } catch (error) {
      console.error('Erro ao atualizar premium:', error)
    }
  }

  const handleChangeRole = async (userId: string, novoCargo: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        titulo_ministerial: novoCargo,
        cargo: novoCargo,
        role: novoCargo,
      })
    } catch (error) {
      const errMsg = (error as Error).message
      if (errMsg?.includes('permission') || errMsg?.includes('denied')) {
        try {
          const apiKey = 'AIzaSyBygqdqXmJRTrkdKcISdkR4l8Jql7nXD6o'
          const url = `https://firestore.googleapis.com/v1/projects/interceder-ef0cd/databases/(default)/documents/users/${userId}?key=${apiKey}&updateMask.fieldPaths=titulo_ministerial&updateMask.fieldPaths=cargo&updateMask.fieldPaths=role`
          await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                titulo_ministerial: { stringValue: novoCargo },
                cargo: { stringValue: novoCargo },
                role: { stringValue: novoCargo },
              }
            }),
          })
        } catch {
          alert('Erro ao atualizar cargo. Verifique as permissões do Firestore.')
        }
      } else {
        alert('Erro ao atualizar cargo.')
      }
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      u.nome?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.whatsapp?.includes(q)
    )
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <p style={{ color: '#6B7280' }}>Carregando usuários...</p>
      </div>
    )
  }

  const totalLiderancas = users.filter(u => {
    const c = getCargo(u)
    return c === 'pastor' || c === 'presbitero' || c === 'diacono' || c === 'lider'
  }).length

  return (
    <div>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>
            <Users size={24} color="#A94438" style={{ marginRight: 8 }} />
            Usuários
          </h1>
          <p style={styles.subtitle}>
            Gerencie os usuários da comunidade
          </p>
        </div>
      </div>

      {/* Stats + Search */}
      <div style={styles.toolbar}>
        <div style={styles.statsRow}>
          <span style={styles.stat}>Total: <strong>{users.length}</strong></span>
          <span style={styles.stat}>Lideranças: <strong style={{ color: '#A94438' }}>{totalLiderancas}</strong></span>
          <span style={styles.stat}>Endossos: <strong>{users.reduce((acc, u) => acc + (u.endossos_uids?.length || 0), 0)}</strong></span>
        </div>
        <div style={styles.searchBox}>
          <Search size={16} color="#9CA3AF" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Tabela */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Usuário</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>WhatsApp</th>
              <th style={styles.th}>Cargo</th>
              <th style={styles.th}>Cadastro</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...styles.td, textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                  {search ? 'Nenhum usuário encontrado para esta busca.' : 'Nenhum usuário cadastrado.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const cargo = getCargo(user)
                return (
                  <tr key={user.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        {getFotoUrl(user) ? (
                          <img src={getFotoUrl(user)!} alt="avatar" style={styles.avatar} />
                        ) : (
                          <div style={styles.avatarPlaceholder}>
                            {(user.nome?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={styles.userName}>
                            {user.nome || '-'}
                            {user.isPremium === true && (
                              <Diamond size={14} color="#D97706" style={{ marginLeft: 4 }} />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{user.email || '-'}</td>
                    <td style={styles.td}>{formatWhatsApp(user.whatsapp)}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: roleColors[cargo] || '#6B7280',
                        }}
                      >
                        {roleLabels[cargo] || cargo.charAt(0).toUpperCase() + cargo.slice(1)}
                      </span>
                    </td>
                    <td style={styles.td}>{formatCriadoEm(user)}</td>
                    <td style={styles.td}>
                      <div style={styles.actionCell}>
                        <button
                          onClick={() => handleTogglePremium(user.id, !user.isPremium)}
                          style={{
                            ...styles.btnPremium,
                            backgroundColor: user.isPremium ? '#FEF3C7' : '#F3F4F6',
                            color: user.isPremium ? '#92400E' : '#6B7280',
                          }}
                          title={user.isPremium ? 'Remover Premium' : 'Ativar Premium'}
                        >
                          {user.isPremium ? '💎' : '⬜'}
                        </button>
                        <select
                          value={cargo}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          style={styles.selectRole}
                        >
                          {roleOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleExcluir(user.id, user.nome)}
                          style={styles.btnDanger}
                          title="Excluir/Banir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: '#1F2937',
    display: 'flex',
    alignItems: 'center',
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: '#6B7280',
    fontSize: 14,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  statsRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  stat: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    padding: '8px 14px',
    minWidth: 280,
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    color: '#1F2937',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
  },
  tableWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 14,
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    borderBottom: '1px solid #E5E7EB',
  },
  tr: {
    borderBottom: '1px solid #F3F4F6',
  },
  td: {
    padding: '12px 16px',
    color: '#1F2937',
    verticalAlign: 'middle' as const,
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 600,
    color: '#1F2937',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: 12,
    whiteSpace: 'nowrap' as const,
  },
  actionCell: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  selectRole: {
    padding: '5px 8px',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    fontSize: 12,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    cursor: 'pointer',
    outline: 'none',
  },
  btnPremium: {
    width: 32,
    height: 32,
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDanger: {
    width: 32,
    height: 32,
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
}