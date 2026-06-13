import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

interface Mensagem {
  id: string
  autor_nome?: string
  texto?: string
  criado_em?: Timestamp
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ItemBase = Record<string, any> & {
  id: string
  autor_nome?: string
  autor_uid?: string
  texto?: string
  criado_em?: Timestamp
}

interface Props {
  item: ItemBase
  colecao: string
  onClose: () => void
}

export default function ModalDetalhes({ item, colecao, onClose }: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, colecao, item.id, 'mensagens_apoio'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Mensagem[]
        setMensagens(data)
      }
    )

    return () => unsubscribe()
  }, [colecao, item.id])

  const handleExcluirMensagem = async (mensagemId: string) => {
    if (!window.confirm('Excluir esta mensagem de apoio?')) return

    try {
      await deleteDoc(doc(db, colecao, item.id, 'mensagens_apoio', mensagemId))
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error)
      alert('Erro ao excluir mensagem.')
    }
  }

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return '-'
    return timestamp.toDate().toLocaleString('pt-BR')
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>📄 Detalhes</h2>
          <button onClick={onClose} style={styles.btnFechar}>✕</button>
        </div>

        <div style={styles.body}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Conteúdo</h3>
            <p style={styles.autor}>
              <strong>Autor:</strong> {item.autor_nome || item.autor_uid?.slice(0, 8) + '...' || 'Desconhecido'}
            </p>
            <p style={styles.textoCompleto}>{item.texto || '(sem conteúdo)'}</p>
            {item.criado_em && (
              <p style={styles.data}>
                <strong>Criado em:</strong> {formatDate(item.criado_em as Timestamp)}
              </p>
            )}
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              💬 Mensagens de Apoio ({mensagens.length})
            </h3>

            {mensagens.length === 0 ? (
              <p style={styles.semMensagens}>Nenhuma mensagem de apoio.</p>
            ) : (
              <div style={styles.mensagensList}>
                {mensagens.map((msg) => (
                  <div key={msg.id} style={styles.mensagemCard}>
                    <div style={styles.mensagemHeader}>
                      <strong>{msg.autor_nome || 'Anônimo'}</strong>
                      <span style={styles.mensagemData}>
                        {formatDate(msg.criado_em)}
                      </span>
                    </div>
                    <p style={styles.mensagemTexto}>{msg.texto}</p>
                    <button
                      onClick={() => handleExcluirMensagem(msg.id)}
                      style={styles.btnExcluirMsg}
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
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
    padding: 16,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E5E7EB',
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#1F2937',
  },
  btnFechar: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: '#6B7280',
    padding: '4px 8px',
    borderRadius: 4,
  },
  body: {
    padding: 24,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 24,
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#374151',
    borderBottom: '1px solid #F3F4F6',
    paddingBottom: 8,
  },
  autor: {
    fontSize: 14,
    color: '#6B7280',
    margin: 0,
  },
  textoCompleto: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 1.6,
    margin: 0,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    whiteSpace: 'pre-wrap' as const,
  },
  data: {
    fontSize: 13,
    color: '#9CA3AF',
    margin: 0,
  },
  semMensagens: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  mensagensList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  mensagemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    border: '1px solid #E5E7EB',
  },
  mensagemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mensagemData: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  mensagemTexto: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 1.5,
    margin: 0,
    marginBottom: 8,
  },
  btnExcluirMsg: {
    padding: '4px 10px',
    border: 'none',
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  },
}
