import { useState, useEffect, useMemo } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Church, Edit2, Trash2, Users, HeartHandshake, Star, Home } from 'lucide-react'

interface Celula {
  id: string
  nome?: string
  descricao?: string
  membros?: string[]
  membros_ids?: string[]
  criadoEm?: Timestamp
  criado_em?: Timestamp
  createdAt?: Timestamp
  destaque_tipo?: string | null
  destaque_validade?: Timestamp | null
}

interface PedidoOracao {
  id: string
  celula_id?: string
  celulas_destino?: string[]
}

const destaqueOptions = [
  { value: '', label: 'Nenhum (Normal)' },
  { value: 'padrao', label: '📌 Padrão' },
  { value: 'top1', label: '👑 Top 1' },
  { value: 'top2', label: '🥈 Top 2' },
  { value: 'top3', label: '🥉 Top 3' },
]

const destaqueLabels: Record<string, string> = {
  padrao: '📌 Padrão',
  top1: '👑 Top 1',
  top2: '🥈 Top 2',
  top3: '🥉 Top 3',
}

const destaqueColors: Record<string, string> = {
  padrao: '#7C3AED',
  top1: '#D97706',
  top2: '#6B7280',
  top3: '#A94438',
}

function isDestaqueAtivo(celula: Celula): boolean {
  if (!celula.destaque_tipo) return false
  if (!celula.destaque_validade) return true
  return celula.destaque_validade.toDate() > new Date()
}

function formatDateToInput(ts: Timestamp | null | undefined): string {
  if (!ts) return ''
  const d = ts.toDate()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function Celulas() {
  const [celulas, setCelulas] = useState<Celula[]>([])
  const [pedidos, setPedidos] = useState<PedidoOracao[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Celula | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formDestaqueTipo, setFormDestaqueTipo] = useState('')
  const [formDestaqueValidade, setFormDestaqueValidade] = useState('')

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const unsubCelulas = onSnapshot(
      collection(db, 'celulas'),
      (snapshot) => {
        if (timeoutId) clearTimeout(timeoutId)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Celula[]
        setCelulas(data)
        setLoading(false)
      },
      () => {
        setCelulas([])
        setLoading(false)
      }
    )

    const unsubPedidos = onSnapshot(
      collection(db, 'pedidos_oracao'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PedidoOracao[]
        setPedidos(data)
      },
      () => {
        setPedidos([])
      }
    )

    timeoutId = setTimeout(() => {
      setCelulas([])
      setLoading(false)
    }, 5000)

    return () => {
      unsubCelulas()
      unsubPedidos()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const pedidosPorCelula = useMemo(() => {
    const map: Record<string, number> = {}
    pedidos.forEach((p) => {
      const celulas = p.celulas_destino || (p.celula_id ? [p.celula_id] : [])
      celulas.forEach((celulaId: string) => {
        if (celulaId) {
          map[celulaId] = (map[celulaId] || 0) + 1
        }
      })
    })
    return map
  }, [pedidos])

  const openModalEdit = (celula: Celula) => {
    setEditando(celula)
    setFormNome(celula.nome || '')
    setFormDescricao(celula.descricao || '')
    setFormDestaqueTipo(celula.destaque_tipo || '')
    setFormDestaqueValidade(formatDateToInput(celula.destaque_validade))
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditando(null)
    setFormNome('')
    setFormDescricao('')
    setFormDestaqueTipo('')
    setFormDestaqueValidade('')
  }

  const handleSave = async () => {
    if (!editando) return
    if (!formNome.trim()) {
      alert('O nome da célula é obrigatório.')
      return
    }

    try {
      const updateData: Record<string, unknown> = {
        nome: formNome.trim(),
        descricao: formDescricao.trim(),
      }

      if (formDestaqueTipo) {
        updateData.destaque_tipo = formDestaqueTipo
        if (formDestaqueValidade) {
          updateData.destaque_validade = Timestamp.fromDate(new Date(formDestaqueValidade))
        } else {
          updateData.destaque_validade = null
        }
      } else {
        updateData.destaque_tipo = null
        updateData.destaque_validade = null
      }

      await updateDoc(doc(db, 'celulas', editando.id), updateData)
      closeModal()
    } catch (error) {
      console.error('Erro ao atualizar célula:', error)
      alert('Erro ao atualizar célula.')
    }
  }

  const handleExcluir = async (id: string, nome?: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a célula "${nome || id}"?`)) return
    try {
      await deleteDoc(doc(db, 'celulas', id))
    } catch (error) {
      console.error('Erro ao excluir célula:', error)
      alert('Erro ao excluir célula.')
    }
  }

  const formatDate = (celula: Celula): string => {
    const ts = celula.criadoEm || celula.criado_em || celula.createdAt
    if (ts instanceof Timestamp) {
      return ts.toDate().toLocaleDateString('pt-BR')
    }
    return ts || '-'
  }

  const truncate = (text?: string, max = 60) => {
    if (!text) return '-'
    return text.length > max ? text.slice(0, max) + '...' : text
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <p style={{ color: '#6B7280' }}>Carregando células...</p>
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
            Células
          </h1>
          <p style={styles.subtitle}>
            Gerencie as células da comunidade ({celulas.length} célula(s))
          </p>
        </div>
      </div>

      {/* Grid de Células */}
      {celulas.length === 0 ? (
        <div style={styles.emptyState}>
          <Home size={48} color="#D1D5DB" />
          <p style={{ color: '#9CA3AF', marginTop: 12 }}>Nenhuma célula encontrada</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {celulas.map((celula) => {
            const destaqueAtivo = isDestaqueAtivo(celula)
            const qtdMembros = celula.membros_ids?.length ?? celula.membros?.length ?? 0
            const qtdPedidos = pedidosPorCelula[celula.id] || 0

            return (
              <div
                key={celula.id}
                style={{
                  ...styles.card,
                  ...(destaqueAtivo ? styles.cardDestaque : {}),
                }}
              >
                {/* Header do Card */}
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleRow}>
                    <Church size={20} color="#A94438" />
                    <h3 style={styles.cardNome}>{celula.nome || '-'}</h3>
                  </div>
                  <div style={styles.cardActions}>
                    <button onClick={() => openModalEdit(celula)} style={styles.btnIcon} title="Editar">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleExcluir(celula.id, celula.nome)} style={styles.btnIconDanger} title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Descrição */}
                <p style={styles.cardDescricao}>{truncate(celula.descricao, 80)}</p>

                {/* Badges */}
                <div style={styles.cardBadges}>
                  <span style={styles.badgeMembros}>
                    <Users size={14} />
                    {qtdMembros} membro(s)
                  </span>
                  <span style={styles.badgePedidos}>
                    <HeartHandshake size={14} />
                    {qtdPedidos} pedido(s)
                  </span>
                </div>

                {/* Destaque */}
                {destaqueAtivo && celula.destaque_tipo && (
                  <div
                    style={{
                      ...styles.destaqueBanner,
                      backgroundColor: (destaqueColors[celula.destaque_tipo] || '#6B7280') + '15',
                      borderColor: destaqueColors[celula.destaque_tipo] || '#6B7280',
                    }}
                  >
                    <Star size={14} color={destaqueColors[celula.destaque_tipo] || '#6B7280'} />
                    <span style={{ color: destaqueColors[celula.destaque_tipo] || '#6B7280', fontSize: 12, fontWeight: 600 }}>
                      {destaqueLabels[celula.destaque_tipo] || celula.destaque_tipo}
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div style={styles.cardFooter}>
                  <span style={styles.cardDate}>{formatDate(celula) !== '-' ? `Criada: ${formatDate(celula)}` : ''}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Edição */}
      {modalOpen && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <Church size={20} color="#A94438" />
              <h2 style={styles.modalTitle}>Editar Célula</h2>
            </div>

            <label style={styles.label}>Nome da Célula *</label>
            <input
              type="text"
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              placeholder="Ex: Célula da Família"
              style={styles.input}
            />

            <label style={styles.label}>Descrição</label>
            <textarea
              value={formDescricao}
              onChange={(e) => setFormDescricao(e.target.value)}
              placeholder="Breve descrição da célula..."
              style={styles.textarea}
              rows={3}
            />

            <hr style={styles.divider} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Star size={16} color="#D97706" />
              <h3 style={{ margin: 0, fontSize: 16, color: '#374151' }}>
                Configurações de Destaque
              </h3>
            </div>

            <label style={styles.label}>Tipo de Destaque</label>
            <select
              value={formDestaqueTipo}
              onChange={(e) => setFormDestaqueTipo(e.target.value)}
              style={styles.input}
            >
              {destaqueOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {formDestaqueTipo && (
              <>
                <label style={styles.label}>Data de Validade</label>
                <input
                  type="datetime-local"
                  value={formDestaqueValidade}
                  onChange={(e) => setFormDestaqueValidade(e.target.value)}
                  style={styles.input}
                />
                <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0 0' }}>
                  {formDestaqueValidade
                    ? 'O destaque expirará automaticamente após esta data.'
                    : 'Se não definir uma data, o destaque ficará ativo permanentemente.'}
                </p>
              </>
            )}

            <div style={styles.modalActions}>
              <button onClick={closeModal} style={styles.btnCancel}>
                Cancelar
              </button>
              <button onClick={handleSave} style={styles.btnSave}>
                Salvar Alterações
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
    marginBottom: 24,
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
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #F3F4F6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: '18px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #F3F4F6',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardDestaque: {
    borderLeft: '4px solid #D97706',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  cardNome: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#1F2937',
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
  cardDescricao: {
    margin: 0,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 1.5,
  },
  cardBadges: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  badgeMembros: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 999,
    backgroundColor: '#F0FDF4',
    color: '#059669',
    fontSize: 12,
    fontWeight: 600,
  },
  badgePedidos: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    color: '#A94438',
    fontSize: 12,
    fontWeight: 600,
  },
  destaqueBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid',
  },
  cardFooter: {
    marginTop: 4,
    paddingTop: 10,
    borderTop: '1px solid #F3F4F6',
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
    marginBottom: 24,
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: '#1F2937',
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #E5E7EB',
    margin: '20px 0',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  btnCancel: {
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
    backgroundColor: '#A94438',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
}