import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  Timestamp,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { HeartHandshake, Search, Trash2, Eye, Lock, Loader } from 'lucide-react'

interface Pedido {
  id: string
  autor_id?: string
  autor_nome?: string
  texto?: string
  categoria?: string
  status?: string
  createdAt?: Timestamp
  criadoEm?: Timestamp
  criado_em?: Timestamp
  intercessores_count?: number
  privacidade?: string
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  ativo: { label: 'Ativo', bg: '#D1FAE5', color: '#065F46' },
  respondido: { label: 'Respondido', bg: '#DBEAFE', color: '#1E40AF' },
  em_moderacao: { label: 'Moderação', bg: '#FEF3C7', color: '#92400E' },
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalDetalhes, setModalDetalhes] = useState<Pedido | null>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const q = query(
      collection(db, 'pedidos_oracao'),
      orderBy('createdAt', 'desc')
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (timeoutId) clearTimeout(timeoutId)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Pedido[]
        setPedidos(data)
        setLoading(false)
      },
      () => {
        setPedidos([])
        setLoading(false)
      }
    )

    timeoutId = setTimeout(() => {
      setPedidos([])
      setLoading(false)
    }, 5000)

    return () => {
      unsubscribe()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido?')) return
    try {
      await deleteDoc(doc(db, 'pedidos_oracao', id))
    } catch (error) {
      console.error('Erro ao excluir pedido:', error)
      alert('Erro ao excluir pedido.')
    }
  }

  const formatDate = (pedido: Pedido) => {
    const ts = pedido.createdAt || pedido.criadoEm || pedido.criado_em
    if (ts instanceof Timestamp) {
      return ts.toDate().toLocaleDateString('pt-BR')
    }
    return '-'
  }

  const truncate = (text?: string, max = 80) => {
    if (!text) return '-'
    return text.length > max ? text.slice(0, max) + '...' : text
  }

  const getAutorNome = (pedido: Pedido) => {
    if (pedido.autor_nome) return pedido.autor_nome
    if (pedido.autor_id) return pedido.autor_id.slice(0, 8) + '...'
    return 'Desconhecido'
  }

  const filteredPedidos = pedidos.filter((p) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.texto?.toLowerCase().includes(q) ||
      p.autor_nome?.toLowerCase().includes(q) ||
      p.categoria?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <Loader size={24} color="#A94438" />
        <p style={{ color: '#6B7280', marginLeft: 12 }}>Carregando pedidos...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>
            <HeartHandshake size={24} color="#A94438" style={{ marginRight: 8 }} />
            Pedidos de Oração
          </h1>
          <p style={styles.subtitle}>
            Gerencie os pedidos de oração da comunidade ({pedidos.length} pedido(s))
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <Search size={16} color="#9CA3AF" />
          <input
            type="text"
            placeholder="Buscar por texto, autor ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={styles.grid}>
        {filteredPedidos.length === 0 ? (
          <div style={styles.emptyState}>
            <HeartHandshake size={48} color="#D1D5DB" />
            <p style={{ color: '#9CA3AF', marginTop: 12 }}>
              {search ? 'Nenhum pedido encontrado para esta busca.' : 'Nenhum pedido de oração encontrado.'}
            </p>
          </div>
        ) : (
          filteredPedidos.map((pedido) => {
            const status = statusConfig[pedido.status || ''] || { label: '-', bg: '#F3F4F6', color: '#6B7280' }
            return (
              <div key={pedido.id} style={styles.card}>
                {/* Header */}
                <div style={styles.cardHeader}>
                  <div style={styles.cardUser}>
                    <div style={styles.avatarPlaceholder}>
                      {getAutorNome(pedido).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={styles.cardAutor}>{getAutorNome(pedido)}</div>
                      <div style={styles.cardDate}>{formatDate(pedido)}</div>
                    </div>
                  </div>
                  <div style={styles.cardTopRight}>
                    {pedido.privacidade === 'celula' && (
                      <span style={styles.privacidadeTag} title="Apenas célula">
                        <Lock size={12} />
                      </span>
                    )}
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: status.bg,
                        color: status.color,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Texto */}
                <p style={styles.cardTexto}>{truncate(pedido.texto)}</p>

                {/* Footer */}
                <div style={styles.cardFooter}>
                  <span style={styles.categoriaTag}>
                    {pedido.categoria || 'Sem categoria'}
                  </span>
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => setModalDetalhes(pedido)}
                      style={styles.btnIcon}
                      title="Ver detalhes"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleExcluir(pedido.id)}
                      style={styles.btnIconDanger}
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de Detalhes */}
      {modalDetalhes && (
        <div style={styles.overlay} onClick={() => setModalDetalhes(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <HeartHandshake size={20} color="#A94438" />
              <h2 style={styles.modalTitle}>Detalhes do Pedido</h2>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalField}>
                <strong>Autor:</strong> {getAutorNome(modalDetalhes)}
              </div>
              <div style={styles.modalField}>
                <strong>Data:</strong> {formatDate(modalDetalhes)}
              </div>
              <div style={styles.modalField}>
                <strong>Categoria:</strong> {modalDetalhes.categoria || '-'}
              </div>
              <div style={styles.modalField}>
                <strong>Status:</strong>{' '}
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: (statusConfig[modalDetalhes.status || ''] || statusConfig['ativo']).bg,
                    color: (statusConfig[modalDetalhes.status || ''] || statusConfig['ativo']).color,
                  }}
                >
                  {(statusConfig[modalDetalhes.status || ''] || statusConfig['ativo']).label}
                </span>
              </div>
              <div style={styles.modalField}>
                <strong>Privacidade:</strong>{' '}
                {modalDetalhes.privacidade === 'celula' ? '🔒 Apenas Célula' : '🌍 Público'}
              </div>
              <div style={{ ...styles.modalField, marginTop: 8 }}>
                <strong>Texto:</strong>
                <p style={{ margin: '8px 0 0', color: '#374151', lineHeight: 1.6, fontSize: 14 }}>
                  {modalDetalhes.texto || '-'}
                </p>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setModalDetalhes(null)} style={styles.btnClose}>
                Fechar
              </button>
              <button
                onClick={() => {
                  handleExcluir(modalDetalhes.id)
                  setModalDetalhes(null)
                }}
                style={styles.btnSave}
              >
                Excluir Pedido
              </button>
            </div>
          </div>
        </div>
      )}
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
    marginBottom: 20,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    padding: '8px 14px',
    width: '100%',
    maxWidth: 400,
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
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #F3F4F6',
    gridColumn: '1 / -1',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: '16px 18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #F3F4F6',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardUser: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #A94438, #E07A5F)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  cardAutor: {
    fontWeight: 600,
    fontSize: 14,
    color: '#1F2937',
  },
  cardDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  cardTopRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  privacidadeTag: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
  },
  cardTexto: {
    margin: 0,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 1.5,
    flex: 1,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTop: '1px solid #F3F4F6',
  },
  categoriaTag: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    fontSize: 12,
    fontWeight: 600,
  },
  cardActions: {
    display: 'flex',
    gap: 6,
  },
  btnIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  btnIconDanger: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 32,
    width: '90%',
    maxWidth: 520,
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: '#1F2937',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalField: {
    marginBottom: 10,
    fontSize: 14,
    color: '#374151',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btnClose: {
    padding: '10px 20px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#374151',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnSave: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
}