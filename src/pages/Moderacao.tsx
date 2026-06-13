import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Shield, CheckCircle, Trash2, AlertTriangle, Loader } from 'lucide-react'

interface ItemModeracao {
  id: string
  autor_id?: string
  autor_nome?: string
  texto?: string
  status?: string
  denuncias_uids?: string[]
  motivo_denuncia?: string
  criado_em?: Timestamp
  createdAt?: Timestamp
}

type Aba = 'pedidos' | 'testemunhos'

export default function Moderacao() {
  const [aba, setAba] = useState<Aba>('pedidos')
  const [pedidos, setPedidos] = useState<ItemModeracao[]>([])
  const [testemunhos, setTestemunhos] = useState<ItemModeracao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const qPedidos = query(
      collection(db, 'pedidos_oracao'),
      where('status', '==', 'em_moderacao')
    )
    const qTestemunhos = query(
      collection(db, 'testemunhos'),
      where('status', '==', 'em_moderacao')
    )

    const unsubPedidos = onSnapshot(
      qPedidos,
      (snapshot) => {
        if (timeoutId) clearTimeout(timeoutId)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ItemModeracao[]
        setPedidos(data)
        setLoading(false)
      },
      () => {
        setPedidos([])
        setLoading(false)
      }
    )

    const unsubTestemunhos = onSnapshot(
      qTestemunhos,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ItemModeracao[]
        setTestemunhos(data)
      },
      () => setTestemunhos([])
    )

    timeoutId = setTimeout(() => {
      setPedidos([])
      setTestemunhos([])
      setLoading(false)
    }, 5000)

    return () => {
      unsubPedidos()
      unsubTestemunhos()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const handleAprovar = async (colecao: string, id: string) => {
    try {
      await updateDoc(doc(db, colecao, id), {
        status: 'ativo',
        denuncias_uids: [],
      })
    } catch (error) {
      console.error('Erro ao aprovar:', error)
    }
  }

  const handleExcluir = async (colecao: string, id: string, tipo: string) => {
    if (!window.confirm(`Excluir este ${tipo} permanentemente?`)) return
    try {
      await deleteDoc(doc(db, colecao, id))
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }

  const getAutorNome = (item: ItemModeracao) => {
    if (item.autor_nome) return item.autor_nome
    if (item.autor_id) return item.autor_id.slice(0, 8) + '...'
    return 'Desconhecido'
  }

  const itens = aba === 'pedidos' ? pedidos : testemunhos
  const colecao = aba === 'pedidos' ? 'pedidos_oracao' : 'testemunhos'
  const tipoLabel = aba === 'pedidos' ? 'pedido' : 'testemunho'

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <Loader size={24} color="#A94438" />
        <p style={{ color: '#6B7280', marginLeft: 12 }}>Carregando moderação...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>
            <Shield size={24} color="#A94438" style={{ marginRight: 8 }} />
            Moderação
          </h1>
          <p style={styles.subtitle}>
            Revise itens denunciados pela comunidade
          </p>
        </div>
      </div>

      {/* Abas */}
      <div style={styles.abas}>
        <button
          onClick={() => setAba('pedidos')}
          style={{
            ...styles.abaBtn,
            ...(aba === 'pedidos' ? styles.abaBtnAtivo : {}),
          }}
        >
          🙏 Pedidos
          {pedidos.length > 0 && <span style={styles.countBadge}>{pedidos.length}</span>}
        </button>
        <button
          onClick={() => setAba('testemunhos')}
          style={{
            ...styles.abaBtn,
            ...(aba === 'testemunhos' ? styles.abaBtnAtivo : {}),
          }}
        >
          🕊️ Testemunhos
          {testemunhos.length > 0 && <span style={styles.countBadge}>{testemunhos.length}</span>}
        </button>
      </div>

      {/* Lista */}
      {itens.length === 0 ? (
        <div style={styles.emptyState}>
          <Shield size={48} color="#D1D5DB" />
          <p style={{ color: '#9CA3AF', marginTop: 12 }}>
            Nenhum {tipoLabel} em moderação. Tudo limpo! 🎉
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {itens.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.badgeModeracao}>
                  <AlertTriangle size={14} />
                  Em Moderação
                </span>
                <span style={styles.denunciasCount}>
                  {item.denuncias_uids?.length || 0} denúncia(s)
                </span>
              </div>

              <p style={styles.texto}>{item.texto || '(sem texto)'}</p>
              
              <div style={styles.autorRow}>
                <div style={styles.avatarPlaceholder}>
                  {getAutorNome(item).charAt(0).toUpperCase()}
                </div>
                <span style={styles.autorNome}>{getAutorNome(item)}</span>
              </div>

              <div style={styles.actions}>
                <button
                  onClick={() => handleAprovar(colecao, item.id)}
                  style={styles.btnAprovar}
                >
                  <CheckCircle size={16} />
                  Aprovar
                </button>
                <button
                  onClick={() => handleExcluir(colecao, item.id, tipoLabel)}
                  style={styles.btnExcluir}
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>
          ))}
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
  abas: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
  },
  abaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#374151',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  abaBtnAtivo: {
    backgroundColor: '#A94438',
    color: '#FFFFFF',
    borderColor: '#A94438',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    padding: '2px 8px',
    fontSize: 12,
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #F3F4F6',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeModeracao: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 6,
  },
  denunciasCount: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: 600,
  },
  texto: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 1.5,
    margin: 0,
  },
  autorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: 'linear-gradient(135deg, #A94438, #E07A5F)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 12,
    flexShrink: 0,
  },
  autorNome: {
    fontSize: 13,
    color: '#6B7280',
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
  btnAprovar: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 16px',
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnExcluir: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 16px',
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
}