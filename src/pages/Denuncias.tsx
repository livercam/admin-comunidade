import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Flag, CheckCircle, Trash2, Loader, AlertTriangle } from 'lucide-react'

interface Denuncia {
  id: string
  item_id?: string
  item_tipo?: string
  motivo_categoria?: string
  descricao_detalhada?: string
  denunciante_id?: string
  data_criacao?: Timestamp
}

const ITEM_TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  pedido: { label: '🙏 Pedido', color: '#A94438' },
  testemunho: { label: '🕊️ Testemunho', color: '#7C3AED' },
  celula: { label: '🏠 Célula', color: '#0891B2' },
}

function formatDate(ts: Timestamp | undefined | null): string {
  if (!ts) return '-'
  return ts.toDate().toLocaleString('pt-BR')
}

export default function Denuncias() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const q = query(
      collection(db, 'denuncias'),
      orderBy('data_criacao', 'desc')
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (timeoutId) clearTimeout(timeoutId)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Denuncia[]
        setDenuncias(data)
        setLoading(false)
      },
      () => {
        setDenuncias([])
        setLoading(false)
      }
    )

    timeoutId = setTimeout(() => {
      setDenuncias([])
      setLoading(false)
    }, 5000)

    return () => {
      unsubscribe()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Excluir esta denúncia?')) return
    try {
      await deleteDoc(doc(db, 'denuncias', id))
    } catch (error) {
      console.error('Erro ao excluir denúncia:', error)
    }
  }

  const handleMarcarResolvida = async (denuncia: Denuncia) => {
    try {
      await updateDoc(doc(db, 'denuncias', denuncia.id), {
        resolvida: true,
        resolvidaEm: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erro ao resolver denúncia:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <Loader size={24} color="#A94438" />
        <p style={{ color: '#6B7280', marginLeft: 12 }}>Carregando denúncias...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>
            <Flag size={24} color="#A94438" style={{ marginRight: 8 }} />
            Denúncias
          </h1>
          <p style={styles.subtitle}>
            Gerencie as denúncias registradas ({denuncias.length} denúncia(s))
          </p>
        </div>
      </div>

      {/* Lista */}
      {denuncias.length === 0 ? (
        <div style={styles.emptyState}>
          <Flag size={48} color="#D1D5DB" />
          <p style={{ color: '#9CA3AF', marginTop: 12 }}>Nenhuma denúncia registrada.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {denuncias.map((den) => {
            const config = ITEM_TIPO_CONFIG[den.item_tipo || ''] || { label: '❓ Desconhecido', color: '#6B7280' }
            return (
              <div key={den.id} style={styles.card}>
                {/* Header */}
                <div style={styles.cardHeader}>
                  <div style={styles.cardHeaderLeft}>
                    <AlertTriangle size={16} color="#EF4444" />
                    <span
                      style={{
                        ...styles.tipoBadge,
                        backgroundColor: config.color + '20',
                        color: config.color,
                      }}
                    >
                      {config.label}
                    </span>
                  </div>
                  <span style={styles.data}>{formatDate(den.data_criacao)}</span>
                </div>

                {/* Info */}
                <div style={styles.infoGrid}>
                  <div style={styles.infoRow}>
                    <strong>Item ID:</strong>
                    <code style={styles.mono}>{den.item_id ? den.item_id.slice(0, 16) + '...' : '-'}</code>
                  </div>
                  <div style={styles.infoRow}>
                    <strong>Denunciante:</strong>
                    <code style={styles.mono}>{den.denunciante_id ? den.denunciante_id.slice(0, 12) + '...' : 'Anônimo'}</code>
                  </div>
                  <div style={styles.infoRow}>
                    <strong>Motivo:</strong>
                    <span>{den.motivo_categoria || 'Não especificado'}</span>
                  </div>
                </div>

                {/* Descrição */}
                {den.descricao_detalhada && (
                  <div style={styles.descBox}>
                    <p style={styles.descricao}>{den.descricao_detalhada}</p>
                  </div>
                )}

                {/* Ações */}
                <div style={styles.acoes}>
                  <button onClick={() => handleMarcarResolvida(den)} style={styles.btnResolvida}>
                    <CheckCircle size={15} />
                    Resolver
                  </button>
                  <button onClick={() => handleExcluir(den.id)} style={styles.btnExcluir}>
                    <Trash2 size={15} />
                    Excluir
                  </button>
                </div>
              </div>
            )
          })}
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
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: '18px 20px',
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  tipoBadge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  data: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  infoRow: {
    display: 'flex',
    gap: 8,
    fontSize: 14,
    color: '#1F2937',
    alignItems: 'center',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    padding: '2px 6px',
    borderRadius: 4,
  },
  descBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 12,
    border: '1px solid #FFEDD5',
  },
  descricao: {
    margin: 0,
    fontSize: 14,
    color: '#9A3412',
    lineHeight: 1.5,
  },
  acoes: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
  btnResolvida: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnExcluir: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
}