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
import { Church, Search, Trash2, Eye, Heart, Loader } from 'lucide-react'

interface Testemunho {
  id: string
  autor_id?: string
  autor_nome?: string
  texto?: string
  glorias?: number
  criadoEm?: Timestamp
  createdAt?: Timestamp
  criado_em?: Timestamp
  status?: string
  autor_foto_url?: string
  autor_cargo?: string
}

export default function Testemunhos() {
  const [testemunhos, setTestemunhos] = useState<Testemunho[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalDetalhes, setModalDetalhes] = useState<Testemunho | null>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const q = query(
      collection(db, 'testemunhos'),
      orderBy('criadoEm', 'desc')
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (timeoutId) clearTimeout(timeoutId)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Testemunho[]
        setTestemunhos(data)
        setLoading(false)
      },
      () => {
        setTestemunhos([])
        setLoading(false)
      }
    )

    timeoutId = setTimeout(() => {
      setTestemunhos([])
      setLoading(false)
    }, 5000)

    return () => {
      unsubscribe()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este testemunho?')) return
    try {
      await deleteDoc(doc(db, 'testemunhos', id))
    } catch (error) {
      console.error('Erro ao excluir testemunho:', error)
      alert('Erro ao excluir testemunho.')
    }
  }

  const formatDate = (item: Testemunho) => {
    const ts = item.criadoEm || item.createdAt || item.criado_em
    if (ts instanceof Timestamp) {
      return ts.toDate().toLocaleDateString('pt-BR')
    }
    return '-'
  }

  const truncate = (text?: string, max = 100) => {
    if (!text) return '-'
    return text.length > max ? text.slice(0, max) + '...' : text
  }

  const getAutorNome = (item: Testemunho) => {
    if (item.autor_nome) return item.autor_nome
    if (item.autor_id) return item.autor_id.slice(0, 8) + '...'
    return 'Desconhecido'
  }

  const filtered = testemunhos.filter((t) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      t.texto?.toLowerCase().includes(q) ||
      t.autor_nome?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <Loader size={24} color="#A94438" />
        <p style={{ color: '#6B7280', marginLeft: 12 }}>Carregando testemunhos...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>
            <Church size={24} color="#A94438" style={{ marginRight: 8 }} />
            Testemunhos
          </h1>
          <p style={styles.subtitle}>
            Gerencie os testemunhos da comunidade ({testemunhos.length} testemunho(s))
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <Search size={16} color="#9CA3AF" />
          <input
            type="text"
            placeholder="Buscar por texto ou autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={styles.grid}>
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <Church size={48} color="#D1D5DB" />
            <p style={{ color: '#9CA3AF', marginTop: 12 }}>
              {search ? 'Nenhum testemunho encontrado.' : 'Nenhum testemunho cadastrado.'}
            </p>
          </div>
        ) : (
          filtered.map((testemunho) => (
            <div key={testemunho.id} style={styles.card}>
              {/* Header */}
              <div style={styles.cardHeader}>
                <div style={styles.cardUser}>
                  <div style={styles.avatarPlaceholder}>
                    {getAutorNome(testemunho).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={styles.cardAutor}>{getAutorNome(testemunho)}</div>
                    <div style={styles.cardDate}>{formatDate(testemunho)}</div>
                  </div>
                </div>
                <div style={styles.gloriasBadge}>
                  <Heart size={14} color="#DC2626" />
                  <span>{testemunho.glorias ?? 0}</span>
                </div>
              </div>

              {/* Texto */}
              <p style={styles.cardTexto}>{truncate(testemunho.texto)}</p>

              {/* Footer */}
              <div style={styles.cardFooter}>
                <span style={styles.statusTag}>
                  {testemunho.status === 'respondido' ? '✅ Respondido' : '📝 Aberto'}
                </span>
                <div style={styles.cardActions}>
                  <button
                    onClick={() => setModalDetalhes(testemunho)}
                    style={styles.btnIcon}
                    title="Ver detalhes"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => handleExcluir(testemunho.id)}
                    style={styles.btnIconDanger}
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Detalhes */}
      {modalDetalhes && (
        <div style={styles.overlay} onClick={() => setModalDetalhes(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <Church size={20} color="#A94438" />
              <h2 style={styles.modalTitle}>Detalhes do Testemunho</h2>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalField}>
                <strong>Autor:</strong> {getAutorNome(modalDetalhes)}
              </div>
              <div style={styles.modalField}>
                <strong>Data:</strong> {formatDate(modalDetalhes)}
              </div>
              <div style={styles.modalField}>
                <strong>Glórias:</strong> 🙌 {modalDetalhes.glorias ?? 0}
              </div>
              <div style={{ ...styles.modalField, marginTop: 8 }}>
                <strong>Testemunho:</strong>
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
                style={styles.btnDanger}
              >
                Excluir Testemunho
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
    background: 'linear-gradient(135deg, #81B29A, #A8D5BA)',
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
  gloriasBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontSize: 12,
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
  statusTag: {
    fontSize: 12,
    color: '#6B7280',
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
  btnDanger: {
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