import { useState, useEffect, type FormEvent } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { Settings, Globe, DollarSign, Save, CheckCircle, Loader } from 'lucide-react'

interface ConfigGeral {
  pix_chave?: string
  pix_nome?: string
  link_doacao?: string
  mensagem_apoio?: string
}

interface ConfigFinanceiro {
  custo_servidor?: number
  total_arrecadado_mes?: number
  chave_pix?: string
  nome_beneficiario?: string
  ultima_atualizacao?: string
}

interface FormData {
  pix_chave: string
  pix_nome: string
  link_doacao: string
  mensagem_apoio: string
  custo_servidor: string
  total_arrecadado_mes: string
  chave_pix_financeiro: string
  nome_beneficiario: string
}

const FIREBASE_API_KEY = 'AIzaSyBygqdqXmJRTrkdKcISdkR4l8Jql7nXD6o'

export default function Configuracoes() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [aba, setAba] = useState<'geral' | 'financeiro'>('geral')
  const [form, setForm] = useState<FormData>({
    pix_chave: '',
    pix_nome: '',
    link_doacao: '',
    mensagem_apoio: '',
    custo_servidor: '0',
    total_arrecadado_mes: '0',
    chave_pix_financeiro: '',
    nome_beneficiario: '',
  })

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const geralRef = doc(db, 'configuracoes', 'geral')
        const geralSnap = await getDoc(geralRef)
        if (geralSnap.exists()) {
          const data = geralSnap.data() as ConfigGeral
          setForm((prev) => ({
            ...prev,
            pix_chave: data.pix_chave || '',
            pix_nome: data.pix_nome || '',
            link_doacao: data.link_doacao || '',
            mensagem_apoio: data.mensagem_apoio || '',
          }))
        }

        const financeiroRef = doc(db, 'configuracoes', 'financeiro')
        const financeiroSnap = await getDoc(financeiroRef)
        if (financeiroSnap.exists()) {
          const data = financeiroSnap.data() as ConfigFinanceiro
          setForm((prev) => ({
            ...prev,
            custo_servidor: String(data.custo_servidor || 0),
            total_arrecadado_mes: String(data.total_arrecadado_mes || 0),
            chave_pix_financeiro: data.chave_pix || '',
            nome_beneficiario: data.nome_beneficiario || '',
          }))
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const salvarViaRest = async (colecao: string, docId: string, dados: Record<string, unknown>) => {
    const url = `https://firestore.googleapis.com/v1/projects/interceder-ef0cd/databases/(default)/documents/${colecao}/${docId}?key=${FIREBASE_API_KEY}`

    const fields: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(dados)) {
      if (typeof value === 'number') {
        fields[key] = { integerValue: Math.round(value as number) }
      } else if (typeof value === 'string') {
        fields[key] = { stringValue: value }
      } else if (typeof value === 'boolean') {
        fields[key] = { booleanValue: value }
      }
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'Erro ao salvar')
    }
    return response.json()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (aba === 'geral') {
        await setDoc(doc(db, 'configuracoes', 'geral'), {
          pix_chave: form.pix_chave,
          pix_nome: form.pix_nome,
          link_doacao: form.link_doacao,
          mensagem_apoio: form.mensagem_apoio,
        }, { merge: true })
      } else {
        try {
          await setDoc(doc(db, 'configuracoes', 'financeiro'), {
            custo_servidor: Number(form.custo_servidor) || 0,
            total_arrecadado_mes: Number(form.total_arrecadado_mes) || 0,
            chave_pix: form.chave_pix_financeiro,
            nome_beneficiario: form.nome_beneficiario,
            ultima_atualizacao: new Date().toISOString(),
          }, { merge: true })
        } catch (sdkError) {
          console.warn('[Config] SDK falhou, tentando via REST API...', sdkError)
          await salvarViaRest('configuracoes', 'financeiro', {
            custo_servidor: Number(form.custo_servidor) || 0,
            total_arrecadado_mes: Number(form.total_arrecadado_mes) || 0,
            chave_pix: form.chave_pix_financeiro,
            nome_beneficiario: form.nome_beneficiario,
            ultima_atualizacao: new Date().toISOString(),
          })
        }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações. Verifique as regras de segurança do Firestore.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <Loader size={24} color="#A94438" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280', marginLeft: 12 }}>Carregando configurações...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>
            <Settings size={24} color="#A94438" style={{ marginRight: 8 }} />
            Configurações
          </h1>
          <p style={styles.subtitle}>
            Gerencie as configurações da comunidade
          </p>
        </div>
      </div>

      {/* Abas */}
      <div style={styles.abas}>
        <button
          onClick={() => setAba('geral')}
          style={{
            ...styles.abaBtn,
            ...(aba === 'geral' ? styles.abaBtnAtivo : {}),
          }}
        >
          <Globe size={16} />
          Geral
        </button>
        <button
          onClick={() => setAba('financeiro')}
          style={{
            ...styles.abaBtn,
            ...(aba === 'financeiro' ? styles.abaBtnAtivo : {}),
          }}
        >
          <DollarSign size={16} />
          Financeiro
        </button>
      </div>

      {aba === 'geral' ? (
        <div style={styles.card}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.sectionHeader}>
              <Globe size={20} color="#A94438" />
              <h2 style={styles.sectionTitle}>Configurações Gerais</h2>
            </div>
            <p style={styles.sectionDesc}>Informações de doações e contribuições exibidas no app</p>

            <div style={styles.field}>
              <label style={styles.label}>Chave PIX (para contribuições)</label>
              <input
                type="text"
                value={form.pix_chave}
                onChange={(e) => handleChange('pix_chave', e.target.value)}
                placeholder="Ex: email@exemplo.com ou CPF/CNPJ"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Nome do Titular (PIX)</label>
              <input
                type="text"
                value={form.pix_nome}
                onChange={(e) => handleChange('pix_nome', e.target.value)}
                placeholder="Ex: Igreja Interceder"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Link de Doação (PagSeguro, etc)</label>
              <input
                type="url"
                value={form.link_doacao}
                onChange={(e) => handleChange('link_doacao', e.target.value)}
                placeholder="Ex: https://pagseguro.com/doacao"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Mensagem de Apoio Financeiro</label>
              <textarea
                value={form.mensagem_apoio}
                onChange={(e) => handleChange('mensagem_apoio', e.target.value)}
                placeholder="Mensagem exibida na tela de contribuição..."
                rows={4}
                style={styles.textarea}
              />
            </div>

            <div style={styles.actions}>
              <button type="submit" disabled={saving} style={styles.btnSave}>
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
              {saved && (
                <span style={styles.savedMsg}>
                  <CheckCircle size={16} />
                  Salvo com sucesso!
                </span>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div style={styles.card}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.sectionHeader}>
              <DollarSign size={20} color="#A94438" />
              <h2 style={styles.sectionTitle}>Transparência Financeira</h2>
            </div>
            <p style={styles.sectionDesc}>
              Estes dados são exibidos no app para a comunidade
            </p>

            <div style={styles.field}>
              <label style={styles.label}>Custo do Servidor (R$ / mês)</label>
              <input
                type="number"
                step="0.01"
                value={form.custo_servidor}
                onChange={(e) => handleChange('custo_servidor', e.target.value)}
                placeholder="Ex: 250.00"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Total Arrecadado no Mês (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.total_arrecadado_mes}
                onChange={(e) => handleChange('total_arrecadado_mes', e.target.value)}
                placeholder="Ex: 150.00"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Chave PIX (Financeiro)</label>
              <input
                type="text"
                value={form.chave_pix_financeiro}
                onChange={(e) => handleChange('chave_pix_financeiro', e.target.value)}
                placeholder="Ex: interceder@oficinaoracao.com.br"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Nome do Beneficiário</label>
              <input
                type="text"
                value={form.nome_beneficiario}
                onChange={(e) => handleChange('nome_beneficiario', e.target.value)}
                placeholder="Ex: Rede Interceder"
                style={styles.input}
              />
            </div>

            <div style={styles.actions}>
              <button type="submit" disabled={saving} style={styles.btnSave}>
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar Financeiro'}
              </button>
              {saved && (
                <span style={styles.savedMsg}>
                  <CheckCircle size={16} />
                  Salvo com sucesso!
                </span>
              )}
            </div>
          </form>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #E5E7EB',
    padding: 32,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    maxWidth: 640,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 14,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#1F2937',
  },
  sectionDesc: {
    margin: 0,
    fontSize: 13,
    color: '#6B7280',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    fontSize: 15,
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  btnSave: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#A94438',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  savedMsg: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#065F46',
    fontWeight: 600,
    fontSize: 14,
  },
}