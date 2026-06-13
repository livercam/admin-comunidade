import { useState, useEffect, useRef } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
} from 'firebase/firestore'
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { db, storage } from '../config/firebase'
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Link,
  Image,
  Upload,
  X,
  Loader,
  Copy,
  Users,
  Crown,
  BarChart3,
  MousePointerClick,
  Video,
  Film,
} from 'lucide-react'

interface Anuncio {
  id: string
  titulo?: string
  tipo?: 'imagem' | 'video'
  imagemUrl?: string
  videoUrl?: string
  linkDestino?: string
  telasAlvo?: string[]
  prioridade?: number
  ativo?: boolean
  criadoEm?: { seconds?: number }
  inicioEm?: { seconds?: number } | null
  fimEm?: { seconds?: number } | null
  versao?: number
  filtroCargos?: string[]
  filtroUids?: string[]
  visualizacoes?: number
  cliques?: number
  ultimoVisualizadoEm?: string
  ultimoCliqueEm?: string
}

interface Titulo {
  id?: string
  label?: string
  value?: string
}

interface UserItem {
  id: string
  nome?: string
  email?: string
}

const TELAS_OPCOES = [
  { value: 'home', label: '🏠 Home' },
  { value: 'mural', label: '📋 Mural' },
  { value: 'celula', label: '🏠 Célula' },
  { value: 'global', label: '🌍 Global (todas)' },
]

const DEFAULT_CARGOS = [
  { value: 'membro', label: 'Membro' },
  { value: 'diacono', label: 'Diácono' },
  { value: 'missionario', label: 'Missionário' },
  { value: 'evangelista', label: 'Evangelista' },
  { value: 'presbitero', label: 'Presbítero' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'lider', label: 'Líder' },
  { value: 'administrador', label: 'Administrador' },
]

const TIPOS_MIDIA = [
  { value: 'imagem', label: '📷 Imagem', icon: Image },
  { value: 'video', label: '🎬 Vídeo', icon: Film },
]

function formatDate(ts: { seconds?: number } | null | undefined): string {
  if (!ts?.seconds) return '-'
  return new Date(ts.seconds * 1000).toLocaleDateString('pt-BR')
}

export default function Anuncios() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Anuncio | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  // Form fields
  const [formTitulo, setFormTitulo] = useState('')
  const [formLink, setFormLink] = useState('')
  const [formTelas, setFormTelas] = useState<string[]>([])
  const [formAtivo, setFormAtivo] = useState(true)
  const [formPrioridade, setFormPrioridade] = useState(0)
  const [formTipo, setFormTipo] = useState<'imagem' | 'video'>('imagem')
  const [formImagemUrl, setFormImagemUrl] = useState('')
  const [formImagemFile, setFormImagemFile] = useState<File | null>(null)
  const [formImagemPreview, setFormImagemPreview] = useState('')
  const [formVideoUrl, setFormVideoUrl] = useState('')
  const [formVideoFile, setFormVideoFile] = useState<File | null>(null)
  const [formVideoPreview, setFormVideoPreview] = useState('')

  // Segmentação
  const [formFiltroCargos, setFormFiltroCargos] = useState<string[]>([])
  const [formFiltroUids, setFormFiltroUids] = useState('')
  const [formFiltroNomes, setFormFiltroNomes] = useState<string[]>([])

  // Dados auxiliares
  const [cargos, setCargos] = useState<Titulo[]>(DEFAULT_CARGOS)
  const [users, setUsers] = useState<UserItem[]>([])
  const [searchUser, setSearchUser] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const q = query(collection(db, 'anuncios'))
    const unsubAnuncios = onSnapshot(
      q,
      (snapshot) => {
        if (timeoutId) clearTimeout(timeoutId)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Anuncio[]
        data.sort((a, b) => (a.prioridade ?? 999) - (b.prioridade ?? 999))
        setAnuncios(data)
        setLoading(false)
      },
      () => {
        setAnuncios([])
        setLoading(false)
      }
    )

    const unsubTitulos = onSnapshot(
      query(collection(db, 'titulos_ministeriais')),
      (snapshot) => {
        const titulos = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Titulo[]
        if (titulos.length > 0) {
          setCargos(titulos.map((t) => ({ value: t.value || t.id || '', label: t.label || t.value || '' })))
        }
      }
    )

    const unsubUsers = onSnapshot(
      query(collection(db, 'users')),
      (snapshot) => {
        const userList = snapshot.docs.map((doc) => ({
          id: doc.id,
          nome: doc.data().nome || doc.data().email || 'Sem nome',
          email: doc.data().email,
        })) as UserItem[]
        setUsers(userList)
      }
    )

    timeoutId = setTimeout(() => {
      setAnuncios([])
      setLoading(false)
    }, 5000)

    return () => {
      unsubAnuncios()
      unsubTitulos()
      unsubUsers()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const openModalCreate = () => {
    setEditando(null)
    setFormTitulo('')
    setFormLink('')
    setFormTelas([])
    setFormAtivo(true)
    setFormPrioridade(0)
    setFormTipo('imagem')
    setFormImagemUrl('')
    setFormImagemFile(null)
    setFormImagemPreview('')
    setFormVideoUrl('')
    setFormVideoFile(null)
    setFormVideoPreview('')
    setFormFiltroCargos([])
    setFormFiltroUids('')
    setFormFiltroNomes([])
    setSearchUser('')
    setUploadProgress(0)
    setModalOpen(true)
  }

  const openModalEdit = (anuncio: Anuncio) => {
    setEditando(anuncio)
    setFormTitulo(anuncio.titulo || '')
    setFormLink(anuncio.linkDestino || '')
    setFormTelas(anuncio.telasAlvo || [])
    setFormAtivo(anuncio.ativo ?? true)
    setFormPrioridade(anuncio.prioridade ?? 0)
    setFormTipo(anuncio.tipo || 'imagem')
    setFormImagemUrl(anuncio.imagemUrl || '')
    setFormImagemFile(null)
    setFormImagemPreview(anuncio.imagemUrl || '')
    setFormVideoUrl(anuncio.videoUrl || '')
    setFormVideoFile(null)
    setFormVideoPreview(anuncio.videoUrl || '')
    setFormFiltroCargos(anuncio.filtroCargos || [])
    setFormFiltroUids((anuncio.filtroUids || []).join(', '))
    setFormFiltroNomes([])
    setSearchUser('')
    setUploadProgress(0)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditando(null)
    setUploadProgress(0)
    setUploading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (formTipo === 'imagem') {
      setFormImagemFile(file)
      const reader = new FileReader()
      reader.onload = () => setFormImagemPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setFormVideoFile(file)
      const url = URL.createObjectURL(file)
      setFormVideoPreview(url)
    }
  }

  const uploadMidia = async (): Promise<{ imagemUrl?: string; videoUrl?: string }> => {
    const result: { imagemUrl?: string; videoUrl?: string } = {}

    if (formTipo === 'imagem') {
      if (formImagemFile) {
        const uuid = crypto.randomUUID?.() || Date.now().toString(36)
        const ext = formImagemFile.name.split('.').pop()
        const nomeArquivo = `anuncios/img_${uuid}_${Date.now()}.${ext}`
        const storageRef = ref(storage, nomeArquivo)
        const uploadTask = uploadBytesResumable(storageRef, formImagemFile)
        result.imagemUrl = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => { uploadTask.cancel(); reject(new Error('TIMEOUT_UPLOAD')) }, 30000)
          uploadTask.on('state_changed',
            (s) => { setUploadProgress((s.bytesTransferred / s.totalBytes) * 100) },
            (e) => { clearTimeout(timeoutId); reject(e) },
            async () => { clearTimeout(timeoutId); resolve(await getDownloadURL(uploadTask.snapshot.ref)) }
          )
        })
      } else {
        result.imagemUrl = formImagemUrl || ''
      }
    } else {
      if (formVideoFile) {
        const uuid = crypto.randomUUID?.() || Date.now().toString(36)
        const ext = formVideoFile.name.split('.').pop()
        const nomeArquivo = `anuncios/vid_${uuid}_${Date.now()}.${ext}`
        const storageRef = ref(storage, nomeArquivo)
        const uploadTask = uploadBytesResumable(storageRef, formVideoFile)
        result.videoUrl = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => { uploadTask.cancel(); reject(new Error('TIMEOUT_UPLOAD')) }, 60000)
          uploadTask.on('state_changed',
            (s) => { setUploadProgress((s.bytesTransferred / s.totalBytes) * 100) },
            (e) => { clearTimeout(timeoutId); reject(e) },
            async () => { clearTimeout(timeoutId); resolve(await getDownloadURL(uploadTask.snapshot.ref)) }
          )
        })
      } else {
        result.videoUrl = formVideoUrl || ''
      }
    }
    return result
  }

  const handleToggleAtivo = async (anuncio: Anuncio) => {
    try {
      await updateDoc(doc(db, 'anuncios', anuncio.id), {
        ativo: !anuncio.ativo,
        versao: (anuncio.versao || 0) + 1,
      })
    } catch (error) {
      console.error('Erro ao toggle:', error)
    }
  }

  const handleSave = async () => {
    if (!formTitulo.trim()) { alert('O título é obrigatório.'); return }
    if (formTelas.length === 0) { alert('Selecione pelo menos uma tela alvo.'); return }
    if (formTipo === 'imagem' && !formImagemFile && !formImagemUrl) { alert('Selecione uma imagem.'); return }
    if (formTipo === 'video' && !formVideoFile && !formVideoUrl) {
      const confirma = window.confirm('Sem arquivo de vídeo. Deseja continuar mesmo assim?')
      if (!confirma) return
    }

    setUploading(true)

    try {
      const urls = await uploadMidia()
      const dados: Record<string, unknown> = {
        titulo: formTitulo.trim(),
        tipo: formTipo,
        linkDestino: formLink.trim(),
        telasAlvo: formTelas,
        ativo: formAtivo,
        prioridade: formPrioridade,
        versao: (editando?.versao || 0) + 1,
        filtroCargos: formFiltroCargos,
        filtroUids: formFiltroUids.split(',').map((u) => u.trim()).filter(Boolean),
      }
      if (formTipo === 'imagem') {
        dados.imagemUrl = urls.imagemUrl || ''
        dados.videoUrl = null
      } else {
        dados.videoUrl = urls.videoUrl || ''
        dados.imagemUrl = null
      }

      if (editando) {
        // Se trocou a mídia, apagar a antiga
        if (formTipo === 'imagem' && formImagemFile && editando.imagemUrl) {
          try { await deleteObject(ref(storage, editando.imagemUrl)) } catch { /* ok */ }
        }
        if (formTipo === 'video' && formVideoFile && editando.videoUrl) {
          try { await deleteObject(ref(storage, editando.videoUrl)) } catch { /* ok */ }
        }
        await updateDoc(doc(db, 'anuncios', editando.id), dados)
      } else {
        await addDoc(collection(db, 'anuncios'), { ...dados, criadoEm: serverTimestamp(), visualizacoes: 0, cliques: 0 })
      }

      closeModal()
    } catch (error) {
      const errMsg = (error as Error).message
      if (errMsg === 'TIMEOUT_UPLOAD') alert('⏱️ Upload excedeu o tempo limite.')
      else if (errMsg?.includes('permission') || errMsg?.includes('denied')) alert('⚠️ Permissão negada.')
      else alert('Erro: ' + errMsg)
    } finally {
      setUploading(false)
    }
  }

  const handleDuplicar = async (anuncio: Anuncio) => {
    try {
      await addDoc(collection(db, 'anuncios'), {
        titulo: anuncio.titulo + ' (cópia)',
        tipo: anuncio.tipo || 'imagem',
        imagemUrl: anuncio.imagemUrl,
        videoUrl: anuncio.videoUrl,
        linkDestino: anuncio.linkDestino,
        telasAlvo: anuncio.telasAlvo,
        ativo: false,
        prioridade: anuncios.length,
        versao: 1,
        filtroCargos: anuncio.filtroCargos || [],
        filtroUids: anuncio.filtroUids || [],
        visualizacoes: 0, cliques: 0,
        criadoEm: serverTimestamp(),
      })
    } catch (error) { console.error('Erro ao duplicar:', error) }
  }

  const handleExcluir = async (anuncio: Anuncio) => {
    if (!window.confirm(`Excluir o anúncio "${anuncio.titulo}"?`)) return
    try {
      const urlMidia = anuncio.videoUrl || anuncio.imagemUrl
      if (urlMidia && anuncios.filter((a) => a.id !== anuncio.id && (a.imagemUrl === urlMidia || a.videoUrl === urlMidia)).length === 0) {
        try { await deleteObject(ref(storage, urlMidia)) } catch { /* ok */ }
      }
      await deleteDoc(doc(db, 'anuncios', anuncio.id))
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir anúncio.')
    }
  }

  const getUserName = (uid: string): string => {
    const user = users.find((u) => u.id === uid)
    return user?.nome || uid.slice(0, 8) + '...'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <Loader size={24} color="#A94438" />
        <p style={{ color: '#6B7280', marginLeft: 12 }}>Carregando anúncios...</p>
      </div>
    )
  }

  const filteredUsers = users.filter(
    (u) => searchUser && (u.nome?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase()))
  )

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>
            <Megaphone size={24} color="#A94438" style={{ marginRight: 8 }} />
            Anúncios / Banners
          </h1>
          <p style={styles.subtitle}>
            Gerencie os banners promocionais do app ({anuncios.length} anúncio(s))
          </p>
        </div>
        <button onClick={openModalCreate} style={styles.btnPrimary}>
          <Plus size={18} />
          Novo Anúncio
        </button>
      </div>

      {anuncios.length === 0 ? (
        <div style={styles.emptyState}>
          <Megaphone size={48} color="#D1D5DB" />
          <p style={{ color: '#9CA3AF', marginTop: 12 }}>Nenhum anúncio cadastrado</p>
          <button onClick={openModalCreate} style={styles.btnOutline}>
            <Plus size={16} />
            Criar primeiro anúncio
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {anuncios.map((anuncio) => (
            <div key={anuncio.id} style={{ ...styles.card, borderLeft: `4px solid ${anuncio.ativo ? '#059669' : '#D1D5DB'}` }}>
              <div style={styles.cardImageWrapper}>
                {anuncio.tipo === 'video' ? (
                  <div style={styles.cardVideoPlaceholder}>
                    <Film size={32} color={anuncio.videoUrl ? '#A94438' : '#D1D5DB'} />
                    {anuncio.videoUrl && <span style={{ fontSize: 11, color: '#A94438', marginTop: 4 }}>🎬 Vídeo</span>}
                  </div>
                ) : anuncio.imagemUrl ? (
                  <img src={anuncio.imagemUrl} alt={anuncio.titulo} style={styles.cardImage} />
                ) : (
                  <div style={styles.cardImagePlaceholder}>
                    <Image size={32} color="#D1D5DB" />
                  </div>
                )}
                <div style={styles.cardImageBadge}>
                  {anuncio.tipo === 'video' ? '🎬' : '📷'} #{anuncio.prioridade ?? 0}
                </div>
                <div style={styles.metricsOverlay}>
                  <span style={styles.metricBadge}><Eye size={11} /> {anuncio.visualizacoes ?? 0}</span>
                  <span style={styles.metricBadge}><MousePointerClick size={11} /> {anuncio.cliques ?? 0}</span>
                </div>
              </div>

              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{anuncio.titulo || 'Sem título'}</h3>
                {anuncio.linkDestino && (
                  <div style={styles.cardLink}>
                    <Link size={12} />
                    <span style={{ fontSize: 11 }}>{anuncio.linkDestino.slice(0, 30)}...</span>
                  </div>
                )}
                <div style={styles.cardTelas}>
                  {anuncio.telasAlvo?.map((tela) => (
                    <span key={tela} style={styles.telaTag}>
                      {TELAS_OPCOES.find((o) => o.value === tela)?.label || tela}
                    </span>
                  ))}
                </div>
                {(anuncio.filtroCargos?.length ?? 0) > 0 && (
                  <div style={styles.cardSegmentacao}>
                    <Crown size={12} color="#A94438" />
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{anuncio.filtroCargos?.join(', ')}</span>
                  </div>
                )}
              </div>

              <div style={styles.cardFooter}>
                <button onClick={() => handleToggleAtivo(anuncio)} style={{
                  ...styles.btnToggle,
                  backgroundColor: anuncio.ativo ? '#D1FAE5' : '#F3F4F6',
                  color: anuncio.ativo ? '#065F46' : '#9CA3AF',
                }} title={anuncio.ativo ? 'Desativar' : 'Ativar'}>
                  {anuncio.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                  {anuncio.ativo ? 'Ativo' : 'Inativo'}
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => handleDuplicar(anuncio)} style={styles.btnIcon} title="Duplicar"><Copy size={14} /></button>
                  <button onClick={() => openModalEdit(anuncio)} style={styles.btnIcon} title="Editar"><Edit2 size={14} /></button>
                  <button onClick={() => handleExcluir(anuncio)} style={styles.btnIconDanger} title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <Megaphone size={20} color="#A94438" />
              <h2 style={styles.modalTitle}>{editando ? 'Editar Anúncio' : 'Novo Anúncio'}</h2>
            </div>

            <label style={styles.label}>Título do Anúncio *</label>
            <input type="text" value={formTitulo} onChange={(e) => setFormTitulo(e.target.value)} placeholder="Ex: Campanha de jejum 2026" style={styles.input} />

            <label style={styles.label}>Link de Destino</label>
            <input type="url" value={formLink} onChange={(e) => setFormLink(e.target.value)} placeholder="Ex: https://exemplo.com" style={styles.input} />

            {/* Tipo de Mídia */}
            <label style={styles.label}>Tipo de Mídia</label>
            <div style={styles.telasGrid}>
              {TIPOS_MIDIA.map((tipo) => {
                const selected = formTipo === tipo.value
                const Icon = tipo.icon
                return (
                  <button key={tipo.value} type="button" onClick={() => setFormTipo(tipo.value as 'imagem' | 'video')} style={{
                    ...styles.telaBtn,
                    backgroundColor: selected ? '#A94438' : '#F3F4F6',
                    color: selected ? '#FFFFFF' : '#374151',
                    borderColor: selected ? '#A94438' : '#D1D5DB',
                  }}>
                    <Icon size={16} style={{ marginRight: 6 }} />
                    {tipo.label}
                  </button>
                )
              })}
            </div>

            <label style={styles.label}>Telas onde aparece *</label>
            <div style={styles.telasGrid}>
              {TELAS_OPCOES.map((tela) => {
                const selected = formTelas.includes(tela.value)
                return (
                  <button key={tela.value} type="button" onClick={() => {
                    if (tela.value === 'global') { setFormTelas(['global']) }
                    else {
                      const newTelas = formTelas.filter((t) => t !== 'global')
                      setFormTelas(selected ? newTelas.filter((t) => t !== tela.value) : [...newTelas, tela.value])
                    }
                  }} style={{
                    ...styles.telaBtn,
                    backgroundColor: selected ? '#A94438' : '#F3F4F6',
                    color: selected ? '#FFFFFF' : '#374151',
                    borderColor: selected ? '#A94438' : '#D1D5DB',
                  }}>
                    {tela.label}
                  </button>
                )
              })}
            </div>

            <label style={styles.label}>Prioridade (0 = mais alta)</label>
            <input type="number" min={0} value={formPrioridade} onChange={(e) => setFormPrioridade(Number(e.target.value))} style={styles.input} />

            <label style={styles.labelCheckbox}>
              <input type="checkbox" checked={formAtivo} onChange={(e) => setFormAtivo(e.target.checked)} style={{ marginRight: 8 }} />
              Anúncio ativo
            </label>

            {editando && (
              <div style={styles.metricsInfo}>
                <BarChart3 size={16} color="#6B7280" />
                <span>👁️ {editando.visualizacoes ?? 0} visualizações &nbsp;|&nbsp; 🖱️ {editando.cliques ?? 0} cliques</span>
              </div>
            )}

            {/* Upload conforme o tipo */}
            {formTipo === 'imagem' ? (
              <>
                <label style={styles.label}>Imagem do Banner *</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                <div style={styles.imageUploadArea}>
                  {formImagemPreview ? (
                    <div style={styles.imagePreviewWrapper}>
                      <img src={formImagemPreview} alt="Preview" style={styles.imagePreview} />
                      <button onClick={() => { setFormImagemFile(null); setFormImagemPreview(''); setFormImagemUrl('') }} style={styles.btnRemoveImage}><X size={16} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.btnUpload}>
                      <Upload size={24} />
                      <span>Clique para selecionar imagem</span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>Recomendado: 1200x400px</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <label style={styles.label}>Vídeo do Banner</label>
                <input ref={videoFileInputRef} type="file" accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                <div style={styles.imageUploadArea}>
                  {formVideoPreview ? (
                    <div style={styles.videoPreviewWrapper}>
                      <video src={formVideoPreview} style={styles.videoPreview} controls muted />
                      <button onClick={() => { setFormVideoFile(null); setFormVideoPreview(''); setFormVideoUrl('') }} style={styles.btnRemoveImage}><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <button type="button" onClick={() => videoFileInputRef.current?.click()} style={styles.btnUpload}>
                        <Upload size={24} />
                        <span>Fazer upload de vídeo</span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>MP4 recomendado, máx 15MB</span>
                      </button>
                      <label style={{ ...styles.label, marginTop: 12 }}>Ou cole uma URL externa</label>
                      <input type="url" value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} placeholder="https://exemplo.com/video.mp4" style={styles.input} />
                    </>
                  )}
                </div>
              </>
            )}

            {uploading && (
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
                <span style={styles.progressText}>{Math.round(uploadProgress)}%</span>
              </div>
            )}

            {/* Segmentação */}
            <div style={styles.segmentacaoSection}>
              <h3 style={styles.segmentacaoTitle}>
                <Users size={16} color="#A94438" style={{ marginRight: 6 }} />
                Segmentação de Público
              </h3>
              <p style={styles.segmentacaoDesc}>Deixe vazio para mostrar para todos.</p>

              <label style={styles.label}>Filtrar por Cargo Ministerial</label>
              <div style={styles.cargosGrid}>
                {cargos.map((cargo) => {
                  const selected = formFiltroCargos.includes(cargo.value)
                  return (
                    <button key={cargo.value} type="button" onClick={() => {
                      setFormFiltroCargos(selected ? formFiltroCargos.filter((c) => c !== cargo.value) : [...formFiltroCargos, cargo.value])
                    }} style={{
                      ...styles.cargoBtn,
                      backgroundColor: selected ? '#A94438' : '#F3F4F6',
                      color: selected ? '#FFFFFF' : '#374151',
                      borderColor: selected ? '#A94438' : '#D1D5DB',
                    }}>
                      {cargo.label}
                    </button>
                  )
                })}
              </div>

              <label style={styles.label}>Filtrar por Usuário</label>
              <input type="text" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder="Digite nome ou email..." style={styles.input} />
              {searchUser && (
                <div style={styles.userSearchResults}>
                  {filteredUsers.length === 0 ? <p style={{ color: '#9CA3AF', fontSize: 13, padding: 8 }}>Nenhum usuário encontrado</p> :
                    filteredUsers.slice(0, 10).map((user) => (
                      <button key={user.id} type="button" style={styles.userResultItem} onClick={() => {
                        if (!formFiltroNomes.includes(user.id)) {
                          setFormFiltroNomes([...formFiltroNomes, user.id])
                          const uids = formFiltroUids.split(',').map((u) => u.trim()).filter(Boolean)
                          if (!uids.includes(user.id)) { uids.push(user.id); setFormFiltroUids(uids.join(', ')) }
                        }
                        setSearchUser('')
                      }}>
                        <div style={styles.userAvatar}>{(user.nome || '?').charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{user.nome || 'Sem nome'}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{user.email || '-'}</div>
                        </div>
                      </button>
                    ))
                  }
                </div>
              )}
              {formFiltroNomes.length > 0 && (
                <div style={styles.selectedUsersArea}>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0' }}>Selecionados:</p>
                  <div style={styles.selectedUsersList}>
                    {formFiltroNomes.map((uid) => (
                      <span key={uid} style={styles.selectedUserTag}>
                        {getUserName(uid)}
                        <button type="button" onClick={() => {
                          setFormFiltroNomes(formFiltroNomes.filter((id) => id !== uid))
                          setFormFiltroUids(formFiltroUids.split(',').map((u) => u.trim()).filter((u) => u !== uid).join(', '))
                        }} style={styles.removeUserBtn}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <textarea value={formFiltroUids} onChange={(e) => setFormFiltroUids(e.target.value)} placeholder="UIDs manuais, separados por vírgula" style={{ ...styles.input, marginTop: 8, minHeight: 40, fontFamily: 'monospace', fontSize: 12 }} />
            </div>

            <div style={styles.modalActions}>
              <button onClick={closeModal} style={styles.btnCancel}>Cancelar</button>
              <button onClick={handleSave} disabled={uploading} style={styles.btnSave}>
                {uploading ? <><Loader size={16} /> Enviando...</> : editando ? 'Atualizar' : 'Criar Anúncio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: '#1F2937', display: 'flex', alignItems: 'center' },
  subtitle: { margin: '4px 0 0 0', color: '#6B7280', fontSize: 14 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: 'none', borderRadius: 8, backgroundColor: '#A94438', color: '#FFFFFF', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnOutline: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '1px solid #D1D5DB', borderRadius: 8, backgroundColor: '#FFFFFF', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 12 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #F3F4F6' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column' },
  cardImageWrapper: { position: 'relative', width: '100%', height: 140, backgroundColor: '#F9FAFB', overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%', objectFit: 'cover' as const },
  cardImagePlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardVideoPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF3C7' },
  cardImageBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFFFFF', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 },
  metricsOverlay: { position: 'absolute', bottom: 6, left: 6, display: 'flex', gap: 6 },
  metricBadge: { display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFFFFF', fontSize: 11, fontWeight: 600 },
  cardBody: { padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1F2937' },
  cardLink: { display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280' },
  cardTelas: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  telaTag: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: '#F3F4F6', color: '#6B7280' },
  cardSegmentacao: { display: 'flex', alignItems: 'center', gap: 6 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #F3F4F6' },
  btnToggle: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnIcon: { width: 32, height: 32, borderRadius: 6, border: 'none', backgroundColor: '#F3F4F6', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  btnIconDanger: { width: 32, height: 32, borderRadius: 6, border: 'none', backgroundColor: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  overlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 32, width: '90%', maxWidth: 560, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' as const },
  modalHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 },
  modalTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: '#1F2937' },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6, marginTop: 16 },
  labelCheckbox: { display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 600, color: '#374151', marginTop: 16, cursor: 'pointer' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
  telasGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  telaBtn: { padding: '8px 16px', border: '1px solid', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' },
  metricsInfo: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: 8, fontSize: 13, color: '#6B7280', marginTop: 12 },
  segmentacaoSection: { marginTop: 20, padding: 16, backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10 },
  segmentacaoTitle: { margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center' },
  segmentacaoDesc: { margin: '0 0 8px 0', fontSize: 12, color: '#A16207' },
  cargosGrid: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  cargoBtn: { padding: '6px 14px', border: '1px solid', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  userSearchResults: { marginTop: 4, border: '1px solid #D1D5DB', borderRadius: 8, backgroundColor: '#FFFFFF', maxHeight: 200, overflowY: 'auto' as const },
  userResultItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: 'none', borderBottom: '1px solid #F3F4F6', backgroundColor: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left' as const, fontFamily: 'inherit', fontSize: 14 },
  userAvatar: { width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #A94438, #E07A5F)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  selectedUsersArea: { marginTop: 8 },
  selectedUsersList: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  selectedUserTag: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, backgroundColor: '#A9443820', color: '#A94438', fontSize: 12, fontWeight: 600 },
  removeUserBtn: { background: 'none', border: 'none', color: '#A94438', cursor: 'pointer', fontSize: 12, padding: 0, marginLeft: 4 },
  imageUploadArea: { marginTop: 8 },
  imagePreviewWrapper: { position: 'relative', display: 'inline-block' },
  imagePreview: { maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #D1D5DB' },
  videoPreviewWrapper: { position: 'relative', display: 'inline-block', width: '100%' },
  videoPreview: { width: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid #D1D5DB' },
  btnRemoveImage: { position: 'absolute', top: 4, right: 4, width: 28, height: 28, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  btnUpload: { width: '100%', padding: 24, border: '2px dashed #D1D5DB', borderRadius: 8, backgroundColor: '#F9FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#6B7280', fontSize: 14 },
  progressBar: { marginTop: 12, height: 20, backgroundColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden', position: 'relative' as const },
  progressFill: { height: '100%', backgroundColor: '#A94438', borderRadius: 10, transition: 'width 0.3s ease' },
  progressText: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 11, fontWeight: 700, color: '#1F2937' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  btnCancel: { padding: '10px 20px', border: '1px solid #D1D5DB', borderRadius: 8, backgroundColor: '#FFFFFF', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnSave: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: 'none', borderRadius: 8, backgroundColor: '#A94438', color: '#FFFFFF', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
}