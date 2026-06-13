import { useState, type FormEvent } from 'react'
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail, type AuthError } from 'firebase/auth'
import { auth, isAdminEmail } from '../config/firebase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Digite seu e-mail primeiro para recuperar a senha.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setError('')
      alert(`📩 E-mail de redefinição enviado para ${email.trim()}. Verifique sua caixa de entrada.`)
    } catch (err) {
      const authErr = err as AuthError
      if (authErr.code === 'auth/user-not-found') {
        setError('Nenhum usuário encontrado com este e-mail.')
      } else {
        setError('Erro ao enviar e-mail de recuperação. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userEmail = userCredential.user.email

      // Verifica se o e-mail é de um administrador autorizado
      if (!isAdminEmail(userEmail)) {
        // Faz logout imediatamente para expulsar o utilizador não autorizado
        await signOut(auth)
        setError('Acesso negado. Este painel é restrito a administradores.')
        setLoading(false)
        return
      }

      // Login autorizado — redireciona para o painel
      navigate('/')
    } catch (err) {
      const authErr = err as AuthError
      if (authErr.code === 'auth/user-not-found') {
        setError('Usuário não encontrado.')
      } else if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
        setError('E-mail ou senha inválidos.')
      } else if (authErr.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.')
      } else {
        setError('Erro ao fazer login. Verifique os dados.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin</h1>
          <span style={styles.subtitle}>Comunidade</span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@exemplo.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            style={styles.forgotBtn}
          >
            Esqueci minha senha
          </button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBF5',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #E5E7EB',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: '#A94438',
  },
  subtitle: {
    fontSize: 14,
    color: '#A94438',
    opacity: 0.7,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
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
  error: {
    color: '#EF4444',
    fontSize: 14,
    margin: 0,
    textAlign: 'center' as const,
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: '#A94438',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center' as const,
    padding: 0,
    textDecoration: 'underline',
  },
  button: {
    padding: '12px 16px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#A94438',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
}
