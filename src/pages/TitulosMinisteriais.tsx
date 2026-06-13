import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Crown, Plus, Edit2, Trash2, Database, Bookmark } from 'lucide-react'

interface Titulo {
  id: string
  label?: string
  value?: string
  ordem?: number
}

const DEFAULT_TITULOS: Titulo[] = [
  { id: 'membro', label: 'Membro', value: 'membro', ordem: 0 },
  { id: 'diacono', label: 'Diácono', value: 'diacono', ordem: 1 },
  { id: 'missionario', label: 'Missionário', value: 'missionario', ordem: 2 },
  { id: 'evangelista', label: 'Evangelista', value: 'evangelista', ordem: 3 },
  { id: 'presbitero', label: 'Presbítero', value: 'presbitero', ordem: 4 },
  { id: 'pastor', label: 'Pastor', value: 'pastor', ordem: 5 },
  { id: 'lider', label: 'Líder', value: 'lider', ordem: 6 },
  { id: 'administrador', label: 'Administrador', value: 'administrador', ordem: 7 },
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
  default: '#6B7280',
}

export default function TitulosMinisteriais() {
  const [titulos, setTitulos] = useState<Titulo[]>(DEFAULT_TITULOS)
  const [loading, setLoading] = useState(true)
  const [usoFirestore, setUsoFirestore] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Titulo | null>(null)
  const [formLabel, setFormLabel] = useState('')
  const [formValue, setFormValue] = useState('')

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const q = query(
      collection(db, 'titulos_ministeriais'),
      orderBy('ordem', 'asc')
    )

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (timeoutId) clearTimeout(timeoutId)
        
        const firestoreTitulos = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Titulo[]

        if (firestoreTitulos.length === 0) {
          setTitulos(DEFAULT_TITULOS)
        } else {
          const valoresFirestore = firestoreTitulos.map(t => t.value)
          const padraoFaltantes = DEFAULT_TITULOS.filter(
            t => !valoresFirestore.includes(t.value)
          )
          setTitulos([...firestoreTitulos, ...padraoFaltantes])
          setUsoFirestore(true)
        }
        setLoading(false)
      },
      () => {
        setTitulos(DEFAULT_TITULOS)
        setLoading(false)
      }
    )

    timeoutId = setTimeout(() => {
      setTitulos(DEFAULT_TITULOS)
      setLoading(false)
    }, 5000)

    return () => {
      unsubscribe()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const openModalCreate = () => {
    setEditando(null)
    setFormLabel('')
    setFormValue('')
    setModalOpen(true)
  }

  const openModalEdit = (t: Titulo) => {
    setEditando(t)
    setFormLabel(t.label || '')
    setFormValue(t.value || '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditando(null)
    setFormLabel('')
    setFormValue('')
  }

  const handleSave = async () => {
    if (!formLabel.trim() || !formValue.trim()) {
      alert('Preencha o nome e o valor do título.')
      return
    }

    const value = formValue.trim().toLowerCase().replace(/\s+/g, '_')

    try {
      if (editando) {
        const isPadrao = DEFAULT_TITULOS.some(dt => dt.id === editando.id && dt.value === editando.value)
        
        if (isPadrao) {
          await addDoc(collection(db, 'titulos_ministeriais'), {
            label: formLabel.trim(),
            value,
            ordem: titulos.length,
            criadoEm: serverTimestamp(),
          })
        } else {
          await updateDoc(doc(db, 'titulos_ministeriais', editando.id), {
            label: formLabel.trim(),
            value,
          })
        }
      } else {
        await addDoc(collection(db, 'titulos_ministeriais'), {
          label: formLabel.trim(),
          value,
          ordem: titulos.length,
          criadoEm: serverTimestamp(),
        })
      }
      closeModal()
    } catch (error) {
      const errMsg = (error as Error).message
      if (errMsg?.includes('permission') || errMsg?.includes('denied')) {
        alert(
          '⚠️ Permissão negada no Firestore.\n\n' +
          'Os títulos padrão continuam funcionando normalmente.'
        )
      } else {
        alert('Erro ao salvar título: ' + errMsg)
      }
    }
  }

  const handleExcluir = async (id: string, label?: string) => {
    if (!window.confirm(`Excluir o título "${label || id}"?`)) return
    try {
      await deleteDoc(doc(db, 'titulos_ministeriais', id))
    } catch (error) {
      console.error('Erro ao excluir título:', error)
    }
  }

  if (loading) return <p>Carregando títulos ministeriais...</p>

  return (
    <div>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>
            <Crown size={24} color="#A94438" style={{ marginRight: 8 }} />
            Títulos Ministeriais
          </h1>
          <p style={styles.subtitle}>
            Gerencie os títulos que os usuários podem ter no app
          </p>
        </div>
        <button onClick={openModalCreate} style={styles.btnPrimary}>
          <Plus size={18} />
          Novo Título
        </button>
      </div>

      {/* Status card */}
      <div style={styles.infoCard}>
        <div style={styles.infoIcon}>
          {usoFirestore ? <Database size={18} /> : <Bookmark size={18} />}
        </div>
        <div style={styles.infoContent}>
          <strong>{usoFirestore ? 'Modo: Firestore + Padrão' : 'Modo: Apenas Padrão'}</strong>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>
            {usoFirestore
              ? 'Títulos do Firestore aparecem primeiro. Os padrão são exibidos como fallback até serem cadastrados.'
              : 'Cadastre títulos no Firestore para gerenciar dinamicamente.'
            }
          </p>
        </div>
      </div>

      {/* Cards de títulos */}
      <div style={styles.grid}>
        {titulos.map((t, index) => {
          const isFirestore = usoFirestore && !DEFAULT_TITULOS.find(dt => dt.value === t.value && dt.id === t.id)
          const color = roleColors[t.value || ''] || roleColors.default

          return (
            <div
              key={t.value || t.id}
              style={{
                ...styles.card,
                borderLeft: `4px solid ${color}`,
              }}
            >
              <div style={styles.cardHeader}>
                <div
                  style={{
                    ...styles.cardBadge,
                    backgroundColor: color + '20',
                    color: color,
                  }}
                >
                  {t.label?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={styles.cardOrigem}>
                  <span
                    style={{
                      ...styles.origemTag,
                      backgroundColor: isFirestore ? '#FEF3C7' : '#F3F4F6',
                      color: isFirestore ? '#92400E' : '#6B7280',
                    }}
                  >
                    {isFirestore ? 'Firestore' : 'Padrão'}
                  </span>
                </div>
              </div>

              <h3 style={styles.cardTitle}>{t.label || '-'}</h3>
              <code style={styles.cardCode}>{t.value || '-'}</code>

              <div style={styles.cardFooter}>
                <span style={styles.cardOrdem}>Ordem: {index + 1}</span>
                <div style={styles.cardActions}>
                  <button onClick={() => openModalEdit(t)} style={styles.btnIcon} title="Editar">
                    <Edit2 size= {16} />
                  </button>
                  {isFirestore && (
                    <button onClick={() => handleExcluir(t.id, t.label)} style={styles.btnIconDanger} title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <Crown size={20} color="#A94438" />
              <h2 style={styles.modalTitle}>
                {editando ? 'Editar Título' : 'Novo Título Ministerial'}
              </h2>
            </div>

            <label style={styles.label}>Nome do Título *</label>
            <input
              type="text"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder="Ex: Apóstolo"
              style={styles.input}
            />

            <label style={styles.label}>Valor (código) *</label>
            <input
              type="text"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder="Ex: apostolo"
              style={styles.input}
            />
            <p style={styles.helperText}>
              Valor salvo no perfil como <code>titulo_ministerial</code>.
            </p>

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
    transition: 'all 0.2s',
  },
  infoCard: {
    display: 'flex',
    gap: 12,
    backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A',
    borderRadius: 10,
    padding: '14px 18px',
    color: '#92400E',
    marginBottom: 24,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoContent: {
    flex: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
    alignItems: 'center',
  },
  cardBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
  },
  cardOrigem: {},
  origemTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#1F2937',
  },
  cardCode: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    padding: '2px 8px',
    borderRadius: 4,
    alignSelf: 'flex-start' as const,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTop: '1px solid #F3F4F6',
  },
  cardOrdem: {
    fontSize: 12,
    color: '#9CA3AF',
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
    transition: 'border-color 0.2s',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    margin: '4px 0 0',
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