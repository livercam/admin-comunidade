import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../config/firebase'

interface MensagemSuporte {
  id: string
  nome?: string
  email?: string
  assunto?: string
  mensagem?: string
  user_uid?: string
  lida?: boolean
  criadoEm?: Timestamp
}

const ASSUNTOS_LABELS: Record<string, string> = {
  sugestao: '💡 Sugestão',
  problema_tecnico: '🐛 Problema Técnico',
  oracao: '🙏 Oração',
  denuncia: '📝 Denúncia',
  duvida: '❓ Dúvida',
  outro: '📬 Outro',
}

const ASSUNTOS_CORES: Record<string, string> = {
  sugestao: '#7C3AED',
  problema_tecnico: '#DC2626',
  oracao: '#059669',
  denuncia: '#EA580C',
  duvida: '#2563EB',
  outro: '#6B7280',
}

function formatDate(ts: Timestamp | undefined | null): string {
  if (!ts) return '-'
  return ts.toDate().toLocaleString('pt-BR')
}

export default function Suporte() {
  const [mensagens, setMensagens] = useState<MensagemSuporte[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas' | 'lidas'>('nao_lidas')
  const [expandida, setExpandida] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'suporte'),
      orderBy('criadoEm', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MensagemSuporte[]
      setMensagens(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleMarcarLida = async (id: string, lida: boolean) => {
    try {
      await updateDoc(doc(db, 'suporte', id), { lida })
    } catch (error) {
      console.error('Erro ao atualizar mensagem:', error)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta mensagem?')) return

    try {
      await deleteDoc(doc(db, 'suporte', id))
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error)
    }
  }

  const mensagensFiltradas = mensagens.filter((msg) => {
    if (filtro === 'nao_lidas') return !msg.lida
    if (filtro === 'lidas') return msg.lida
    return true
  })

  const naoLidas = mensagens.filter((m) => !m.lida).length

  if (loading) {
    return <p>Carregando mensagens de suporte...</p>
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0, marginBottom: 4 }}>🆘 Suporte</h1>
          <p style={{ color: '#6B7280', margin: 0 }}>
            {naoLidas > 0
              ? `${naoLidas} mensagen(s) não lida(s)`
              : 'Todas as mensagens lidas ✓'}
          </p>
        </div>
      </div>

      <div style={styles.filtros}>
        {(['nao_lidas', 'todas', 'lidas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              ...styles.filtroBtn,
              ...(filtro === f ? styles.filtroBtnAtivo : {}),
            }}
          >
            {f === 'nao_lidas' ? `📩 Não Lidas (${naoLidas})` : f === 'todas' ? '📋 Todas' : '✅ Lidas'}
          </button>
        ))}
      </div>

      <div style={styles.grid}>
        {mensagensFiltradas.length === 0 ? (
          <p style={{ color: '#9CA3AF', gridColumn: '1 / -1' }}>
            Nenhuma mensagem encontrada.
          </p>
        ) : (
          mensagensFiltradas.map((msg) => {
            const corAssunto = ASSUNTOS_CORES[msg.assunto || ''] || '#6B7280'
            const estaExpandida = expandida === msg.id

            return (
              <div
                key={msg.id}
                style={{
                  ...styles.card,
                  ...(!msg.lida ? styles.cardNaoLida : {}),
                }}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardHeaderLeft}>
                    <span
                      style={{
                        ...styles.assuntoBadge,
                        backgroundColor: corAssunto + '20',
                        color: corAssunto,
                      }}
                    >
                      {ASSUNTOS_LABELS[msg.assunto || ''] || msg.assunto || 'Sem assunto'}
                    </span>
                    {!msg.lida && <span style={styles.badgeNaoLida}>Nova</span>}
                  </div>
                  <span style={styles.data}>{formatDate(msg.criadoEm)}</span>
                </div>

                <div style={styles.remetenteInfo}>
                  <strong style={styles.nome}>{msg.nome || 'Anônimo'}</strong>
                  <span style={styles.email}>{msg.email || '-'}</span>
                </div>

                <p
                  style={{
                    ...styles.mensagemPreview,
                    ...(!estaExpandida ? styles.mensagemPreviewTruncado : {}),
                  }}
                >
                  {msg.mensagem}
                </p>

                {estaExpandida && msg.user_uid && (
                  <p style={styles.userUid}>
                    <strong>UID:</strong> {msg.user_uid}
                  </p>
                )}

                <div style={styles.acoes}>
                  <button
                    onClick={() => setExpandida(estaExpandida ? null : msg.id)}
                    style={styles.btnExpandir}
                  >
                    {estaExpandida ? '🔺 Recorrer' : '🔽 Ver mais'}
                  </button>
                  <button
                    onClick={() => handleMarcarLida(msg.id, !msg.lida)}
                    style={{
                      ...styles.btnLida,
                      backgroundColor: msg.lida ? '#FEF3C7' : '#D1FAE5',
                      color: msg.lida ? '#92400E' : '#065F46',
                    }}
                  >
                    {msg.lida ? '📩 Marcar como Não Lida' : '✅ Marcar como Lida'}
                  </button>
                  <button
                    onClick={() => handleExcluir(msg.id)}
                    style={styles.btnExcluir}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  filtros: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  },
  filtroBtn: {
    padding: '8px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#374151',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filtroBtnAtivo: {
    backgroundColor: '#A94438',
    color: '#FFFFFF',
    borderColor: '#A94438',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    transition: 'box-shadow 0.2s',
  },
  cardNaoLida: {
    borderLeft: '4px solid #A94438',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderLeft: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  assuntoBadge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  badgeNaoLida: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
  },
  data: {
    fontSize: 12,
    color: '#9CA3AF',
    whiteSpace: 'nowrap' as const,
  },
  remetenteInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  nome: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: 700,
  },
  email: {
    fontSize: 13,
    color: '#6B7280',
  },
  mensagemPreview: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 1.5,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  mensagemPreviewTruncado: {
    overflow: 'hidden' as const,
    display: '-webkit-box' as const,
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  },
  userUid: {
    fontSize: 12,
    color: '#9CA3AF',
    margin: 0,
    fontFamily: 'monospace',
  },
  acoes: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    marginTop: 4,
  },
  btnExpandir: {
    padding: '6px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    color: '#374151',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnLida: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnExcluir: {
    padding: '6px 10px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
}