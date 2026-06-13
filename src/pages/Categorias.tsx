import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Tags, Plus, Edit2, Trash2, FolderOpen, Database, Download, Bookmark } from 'lucide-react'

interface Categoria {
  id: string
  nome?: string
  icone?: string
  value?: string
  criado_em?: Timestamp
}

// Categorias padrão - usadas como fallback e para popular o Firestore
const DEFAULT_CATEGORIAS: Categoria[] = [
  { id: 'saude', nome: 'Saúde', icone: '🩺', value: 'saude' },
  { id: 'familia', nome: 'Família', icone: '👨‍👩‍👧‍👦', value: 'familia' },
  { id: 'financas', nome: 'Finanças', icone: '💰', value: 'financas' },
  { id: 'espiritual', nome: 'Espiritual', icone: '🙏', value: 'espiritual' },
  { id: 'vida_sentimental', nome: 'Vida Sentimental', icone: '💕', value: 'vida_sentimental' },
  { id: 'outros', nome: 'Outros', icone: '📌', value: 'outros' },
]

// Cores para os cards baseadas no nome da categoria
const categoryColors: Record<string, string> = {
  default: '#6B7280',
}

function getColorFromName(nome?: string): string {
  const colors = [
    '#A94438', '#E07A5F', '#81B29A', '#3D405B',
    '#D97706', '#7C3AED', '#0891B2', '#059669',
    '#DC2626', '#1D4ED8', '#0F766E', '#B45309',
  ]
  if (!nome) return colors[0]
  let hash = 0
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>(DEFAULT_CATEGORIAS)
  const [loading, setLoading] = useState(true)
  const [usoFirestore, setUsoFirestore] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formIcone, setFormIcone] = useState('')
  const [populando, setPopulando] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const unsubscribe = onSnapshot(
      collection(db, 'categorias_pedidos'),
      (snapshot) => {
        if (timeoutId) clearTimeout(timeoutId)
        const firestoreCategorias = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Categoria[]

        if (firestoreCategorias.length === 0) {
          // Coleção vazia: usar apenas padrão
          setCategorias(DEFAULT_CATEGORIAS)
          setUsoFirestore(false)
        } else {
          // Merge: padrão + Firestore (Firestore tem prioridade)
          const valoresFirestore = firestoreCategorias.map(c => c.value || c.nome)
          const padraoFaltantes = DEFAULT_CATEGORIAS.filter(
            c => !valoresFirestore.includes(c.value || c.nome)
          )
          setCategorias([...firestoreCategorias, ...padraoFaltantes])
          setUsoFirestore(true)
        }
        setLoading(false)
      },
      () => {
        setCategorias(DEFAULT_CATEGORIAS)
        setLoading(false)
      }
    )

    timeoutId = setTimeout(() => {
      setCategorias(DEFAULT_CATEGORIAS)
      setLoading(false)
    }, 5000)

    return () => {
      unsubscribe()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Função para popular as categorias padrão no Firestore
  const handlePopularPadrao = async () => {
    if (!window.confirm('Deseja cadastrar todas as categorias padrão no Firestore?')) return
    setPopulando(true)
    let sucesso = 0
    let erro = 0
    for (const cat of DEFAULT_CATEGORIAS) {
      try {
        await addDoc(collection(db, 'categorias_pedidos'), {
          nome: cat.nome,
          icone: cat.icone || '',
          value: cat.value || cat.nome?.toLowerCase().replace(/\s+/g, '_'),
          criado_em: serverTimestamp(),
        })
        sucesso++
      } catch (e) {
        console.error('Erro ao criar categoria:', cat.nome, e)
        erro++
      }
    }
    setPopulando(false)
    alert(`${sucesso} categoria(s) criada(s)${erro > 0 ? `, ${erro} erro(s).` : ' com sucesso!'}`)
  }

  const openModalCreate = () => {
    setEditando(null)
    setFormNome('')
    setFormIcone('')
    setModalOpen(true)
  }

  const openModalEdit = (cat: Categoria) => {
    setEditando(cat)
    setFormNome(cat.nome || '')
    setFormIcone(cat.icone || '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditando(null)
    setFormNome('')
    setFormIcone('')
  }

  const handleSave = async () => {
    if (!formNome.trim()) {
      alert('O nome da categoria é obrigatório.')
      return
    }

    try {
      if (editando) {
        await updateDoc(doc(db, 'categorias_pedidos', editando.id), {
          nome: formNome.trim(),
          icone: formIcone.trim() || '',
        })
      } else {
        await addDoc(collection(db, 'categorias_pedidos'), {
          nome: formNome.trim(),
          icone: formIcone.trim() || '',
          criado_em: serverTimestamp(),
        })
      }
      closeModal()
    } catch (error) {
      const errMsg = (error as Error).message
      if (errMsg?.includes('permission') || errMsg?.includes('denied')) {
        alert('⚠️ Permissão negada no Firestore.')
      } else {
        alert('Erro ao salvar categoria: ' + errMsg)
      }
    }
  }

  const handleExcluir = async (id: string, nome?: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${nome || id}"?`)) return
    try {
      await deleteDoc(doc(db, 'categorias_pedidos', id))
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      alert('Erro ao excluir categoria.')
    }
  }

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return '-'
    return timestamp.toDate().toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <p style={{ color: '#6B7280' }}>Carregando categorias...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>
            <Tags size={24} color="#A94438" style={{ marginRight: 8 }} />
            Categorias
          </h1>
          <p style={styles.subtitle}>
            Gerencie as categorias de pedidos de oração
          </p>
        </div>
        <button onClick={openModalCreate} style={styles.btnPrimary}>
          <Plus size={18} />
          Nova Categoria
        </button>
      </div>

      {/* Status Card */}
      <div style={styles.infoCard}>
        <div style={styles.infoIcon}>
          {usoFirestore ? <Database size={18} /> : <Bookmark size={18} />}
        </div>
        <div style={styles.infoContent}>
          <strong>{usoFirestore ? 'Modo: Firestore + Padrão' : 'Modo: Apenas Padrão'}</strong>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>
            {usoFirestore
              ? 'Categorias do Firestore aparecem primeiro. As padrão são fallback.'
              : 'Clique no botão abaixo para cadastrar as categorias padrão no Firestore.'
            }
          </p>
          {!usoFirestore && (
            <button
              onClick={handlePopularPadrao}
              disabled={populando}
              style={{
                ...styles.btnOutline,
                marginTop: 10,
                fontSize: 13,
                padding: '8px 16px',
              }}
            >
              <Download size={16} />
              {populando ? 'Populando...' : 'Popular Categorias Padrão no Firestore'}
            </button>
          )}
        </div>
      </div>

      {/* Grid de Categorias */}
      {categorias.length === 0 ? (
        <div style={styles.emptyState}>
          <FolderOpen size={48} color="#D1D5DB" />
          <p style={{ color: '#9CA3AF', marginTop: 12 }}>Nenhuma categoria encontrada</p>
          <button onClick={openModalCreate} style={styles.btnOutline}>
            <Plus size={16} />
            Criar primeira categoria
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {categorias.map((cat) => {
            const color = getColorFromName(cat.nome)
            return (
              <div
                key={cat.id}
                style={{
                  ...styles.card,
                  borderTop: `4px solid ${color}`,
                }}
              >
                <div style={styles.cardHeader}>
                  <div
                    style={{
                      ...styles.cardIconBox,
                      backgroundColor: color + '20',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{cat.icone || '📁'}</span>
                  </div>
                  <div style={styles.cardActions}>
                    <button onClick={() => openModalEdit(cat)} style={styles.btnIcon} title="Editar">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleExcluir(cat.id, cat.nome)} style={styles.btnIconDanger} title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <h3 style={styles.cardNome}>{cat.nome || '-'}</h3>
                <div style={styles.cardFooter}>
                  <span style={styles.cardDate}>
                    {formatDate(cat.criado_em) !== '-' ? `Criada em ${formatDate(cat.criado_em)}` : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <Tags size={20} color="#A94438" />
              <h2 style={styles.modalTitle}>
                {editando ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
            </div>

            <label style={styles.label}>Nome da Categoria *</label>
            <input
              type="text"
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              placeholder="Ex: Cura Interior"
              style={styles.input}
            />

            <label style={styles.label}>Ícone / Emoji</label>
            <input
              type="text"
              value={formIcone}
              onChange={(e) => setFormIcone(e.target.value)}
              placeholder="Ex: 🙏 ou ❤️"
              style={styles.input}
            />

            <div style={styles.modalActions}>
              <button onClick={closeModal} style={styles.btnCancel}>
                Cancelar
              </button>
              <button onClick={handleSave} style={styles.btnSave}>
                {editando ? 'Atualizar' : 'Criar'}
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
    marginBottom: 20,
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
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#A94438',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnOutline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#374151',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    marginTop: 12,
  },
  infoCard: {
    display: 'flex',
    gap: 12,
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: 10,
    padding: '14px 18px',
    color: '#166534',
    marginBottom: 24,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoContent: {
    flex: 1,
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
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
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  cardNome: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#1F2937',
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
    maxWidth: 460,
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
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