import { useState } from 'react'
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  LayoutDashboard,
  Users,
  HeartHandshake,
  Church,
  Home,
  Tags,
  Crown,
  Megaphone,
  Shield,
  Settings,
  BookOpen,
} from 'lucide-react'

interface FaqItem {
  pergunta: string
  resposta: string
  icon?: React.ReactNode
}

interface FaqSection {
  titulo: string
  descricao: string
  cor: string
  icone: React.ReactNode
  itens: FaqItem[]
}

const faqData: FaqSection[] = [
  {
    titulo: '📊 Dashboard',
    descricao: 'Visão Geral e métricas da comunidade',
    cor: '#A94438',
    icone: <LayoutDashboard size={20} />,
    itens: [
      {
        pergunta: 'O que significam os números nos cards?',
        resposta: 'Os cards mostram o total de Usuários, Pedidos de Oração, Testemunhos e Células cadastrados no Firestore. Os valores são atualizados em tempo real sempre que alguém cria ou exclui um item no aplicativo.'
      },
      {
        pergunta: 'Como interpretar os gráficos de pizza?',
        resposta: 'O gráfico "Distribuição de Cargos" mostra quantos usuários têm cada título ministerial (Membro, Pastor, Diácono, etc.). O gráfico "Pedidos por Categoria" mostra a distribuição dos pedidos de oração por categoria (Saúde, Família, Finanças, etc.).'
      },
      {
        pergunta: 'O que é a tabela de "Últimos Usuários"?',
        resposta: 'Mostra os 5 usuários mais recentes que se cadastraram no app. Clique em "Ver todos" para ir até a página de Usuários com a lista completa.'
      }
    ]
  },
  {
    titulo: '👥 Usuários',
    descricao: 'Gerenciamento de perfis e cargos',
    cor: '#1D4ED8',
    icone: <Users size={20} />,
    itens: [
      {
        pergunta: 'Como alterar o cargo ministerial de um usuário?',
        resposta: 'Na página Usuários, encontre o usuário na lista. Na coluna "Ações", há um select (menu suspenso) com todos os títulos ministeriais cadastrados. Selecione o novo cargo e ele será salvo automaticamente no perfil do usuário no Firestore.'
      },
      {
        pergunta: 'Como ativar/desativar o Premium de um usuário?',
        resposta: 'Na coluna "Ações" de cada usuário, clique no botão 💎 para ativar ou ⬜ para desativar o Premium. Usuários Premium têm um selo 💎 ao lado do nome no app.'
      },
      {
        pergunta: 'Como excluir/banir um usuário?',
        resposta: 'Clique no botão 🗑️ (lixeira) na coluna "Ações". Confirme a exclusão. Isso remove o documento do usuário do Firestore, mas não exclui a conta de autenticação.'
      },
      {
        pergunta: 'Como usar a busca de usuários?',
        resposta: 'Digite nome, email ou WhatsApp no campo de busca acima da tabela. A lista filtra em tempo real enquanto você digita.'
      }
    ]
  },
  {
    titulo: '🙏 Pedidos de Oração',
    descricao: 'Gerenciamento dos pedidos da comunidade',
    cor: '#E07A5F',
    icone: <HeartHandshake size={20} />,
    itens: [
      {
        pergunta: 'O que significa cada status do pedido?',
        resposta: '🟢 Ativo: pedido visível no mural. 🔵 Respondido: o autor registrou um testemunho. 🟡 Moderação: foi denunciado e aguarda revisão.'
      },
      {
        pergunta: 'Como ver os detalhes de um pedido?',
        resposta: 'Clique no botão 👁️ "Ver Detalhes" no card do pedido. Um modal será aberto mostrando autor, data, categoria, status, privacidade e o texto completo.'
      },
      {
        pergunta: 'Como excluir um pedido?',
        resposta: 'Clique no botão 🗑️ no card do pedido ou no modal de detalhes. Confirme a exclusão. O pedido será removido permanentemente do Firestore.'
      }
    ]
  },
  {
    titulo: '🕊️ Testemunhos',
    descricao: 'Testemunhos de orações respondidas',
    cor: '#81B29A',
    icone: <Church size={20} />,
    itens: [
      {
        pergunta: 'Como funciona o contador de glórias?',
        resposta: 'O contador 🙌 mostra quantas vezes outros usuários reagiram ao testemunho. Isso aparece no app como uma forma de celebrar com o autor.'
      },
      {
        pergunta: 'Como excluir um testemunho impróprio?',
        resposta: 'Clique no botão 🗑️ "Excluir" no card ou no modal de detalhes. Confirme a exclusão. O testemunho será removido permanentemente.'
      }
    ]
  },
  {
    titulo: '🏠 Células',
    descricao: 'Grupos e células da comunidade',
    cor: '#3D405B',
    icone: <Home size={20} />,
    itens: [
      {
        pergunta: 'Como editar uma célula?',
        resposta: 'Clique no ícone ✏️ "Editar" no card da célula. Você pode alterar o nome, descrição e as configurações de destaque (📌 Padrão, 👑 Top 1, 🥈 Top 2, 🥉 Top 3).'
      },
      {
        pergunta: 'O que são os destaques de célula?',
        resposta: 'Destaques controlam a visibilidade da célula no app: 📌 Padrão = entra automaticamente, 👑 Top 1 = primeiro lugar no mural, 🥈 Top 2 / 🥉 Top 3 = posições seguintes. Você também pode definir uma data de validade para o destaque.'
      },
      {
        pergunta: 'Como ver quantos membros a célula tem?',
        resposta: 'No card da célula, o badge 👥 mostra o número de membros. O badge 🙏 mostra quantos pedidos de oração estão associados àquela célula.'
      }
    ]
  },
  {
    titulo: '🏷️ Categorias',
    descricao: 'Categorias de pedidos de oração',
    cor: '#D97706',
    icone: <Tags size={20} />,
    itens: [
      {
        pergunta: 'Como criar uma nova categoria?',
        resposta: 'Clique em "Nova Categoria", preencha o nome (ex: "Cura Interior") e um emoji/ícone (ex: 🙏). A categoria aparecerá automaticamente no app para os usuários selecionarem.'
      },
      {
        pergunta: 'Por que as categorias não aparecem no app?',
        resposta: 'As categorias só aparecem se estiverem cadastradas no Firestore. Se você acabou de ativar o dashboard, clique em "Popular Categorias Padrão no Firestore" no card de status para cadastrar as 6 categorias padrão (Saúde, Família, Finanças, etc.) de uma vez.'
      },
      {
        pergunta: 'Posso editar ou excluir uma categoria?',
        resposta: 'Sim. Use os botões ✏️ (editar) e 🗑️ (excluir) no card da categoria. Ao editar, você pode alterar o nome e o ícone.'
      }
    ]
  },
  {
    titulo: '👑 Títulos Ministeriais',
    descricao: 'Cargos e títulos dos usuários',
    cor: '#7C3AED',
    icone: <Crown size={20} />,
    itens: [
      {
        pergunta: 'Como criar um novo título ministerial?',
        resposta: 'Clique em "Novo Título", preencha o nome (ex: "Apóstolo") e o valor (ex: "apostolo"). O valor é salvo no perfil do usuário como titulo_ministerial.'
      },
      {
        pergunta: 'Qual a diferença entre título "Padrão" e "Firestore"?',
        resposta: 'Títulos Padrão (Membro, Diácono, Pastor, etc.) são fixos no código e servem como fallback. Títulos do Firestore são os que você cria no dashboard e podem ser editados/excluídos. Quando um título padrão é editado, ele é copiado para o Firestore automaticamente.'
      },
      {
        pergunta: 'Posso excluir um título que está em uso?',
        resposta: 'Sim. A exclusão remove o título da lista, mas não altera o cargo dos usuários que já o possuem. O usuário continuará com o valor salvo no perfil.'
      }
    ]
  },
  {
    titulo: '📢 Anúncios',
    descricao: 'Banners promocionais no app',
    cor: '#059669',
    icone: <Megaphone size={20} />,
    itens: [
      {
        pergunta: 'Como criar um anúncio?',
        resposta: 'Clique em "Novo Anúncio". Escolha o tipo (📷 Imagem ou 🎬 Vídeo), preencha o título, link de destino e selecione em quais telas o banner aparecerá (Home, Mural, Célula ou Global). Faça upload da mídia e salve.'
      },
      {
        pergunta: 'Como funciona a segmentação de público?',
        resposta: 'Na seção "Segmentação de Público" do formulário, você pode: 1) Filtrar por Cargo Ministerial - o anúncio só aparece para usuários com aquele cargo. 2) Filtrar por Usuário - busque e selecione usuários específicos. Deixe vazio para mostrar para todos.'
      },
      {
        pergunta: 'Como medir o desempenho de um anúncio?',
        resposta: 'Cada card de anúncio mostra 👁️ Visualizações (quantas vezes foi exibido) e 🖱️ Cliques (quantas pessoas clicaram no link). Esses números são atualizados em tempo real conforme os usuários interagem no app.'
      },
      {
        pergunta: 'Um mesmo usuário vê o anúncio mais de uma vez?',
        resposta: 'Não. O app salva no AsyncStorage que o usuário já viu aquele anúncio. Cada usuário vê cada anúncio no máximo UMA vez. Se você editar o anúncio (incrementando a versão), ele será exibido novamente.'
      },
      {
        pergunta: 'Como ativar/desativar um anúncio?',
        resposta: 'No card do anúncio, clique no botão "Ativo" (verde) para desativar ou "Inativo" (cinza) para ativar. Anúncios inativos não são exibidos no app.'
      }
    ]
  },
  {
    titulo: '🚨 Moderação',
    descricao: 'Revisão de conteúdo denunciado',
    cor: '#DC2626',
    icone: <Shield size={20} />,
    itens: [
      {
        pergunta: 'O que aparece na página de Moderação?',
        resposta: 'Apenas itens (pedidos ou testemunhos) que foram denunciados por usuários e estão com status "em_moderacao". Use as abas para alternar entre Pedidos e Testemunhos.'
      },
      {
        pergunta: 'Qual a diferença entre "Aprovar" e "Excluir"?',
        resposta: '✅ Aprovar: remove as denúncias e reativa o item como "ativo". 🗑️ Excluir: remove permanentemente o item do Firestore. Use Excluir apenas para conteúdo impróprio.'
      }
    ]
  },
  {
    titulo: '⚙️ Configurações',
    descricao: 'Chave PIX e transparência financeira',
    cor: '#6B7280',
    icone: <Settings size={20} />,
    itens: [
      {
        pergunta: 'Como configurar a chave PIX para contribuições?',
        resposta: 'Na aba "Geral", preencha a Chave PIX, Nome do Titular e Link de Doação. Essas informações são exibidas no app na tela de contribuição.'
      },
      {
        pergunta: 'Como atualizar os dados financeiros?',
        resposta: 'Na aba "Financeiro", preencha o custo do servidor e o total arrecadado no mês. Esses dados são exibidos no app para transparência com a comunidade.'
      }
    ]
  }
]

const coresBadge: Record<string, string> = {
  '#A94438': '#FEF2F2',
  '#1D4ED8': '#EFF6FF',
  '#E07A5F': '#FFF7ED',
  '#81B29A': '#F0FDF4',
  '#3D405B': '#F8FAFC',
  '#D97706': '#FFFBEB',
  '#7C3AED': '#F5F3FF',
  '#059669': '#ECFDF5',
  '#DC2626': '#FEF2F2',
  '#6B7280': '#F9FAFB',
}

export default function Faq() {
  const [search, setSearch] = useState('')
  const [secaoAberta, setSecaoAberta] = useState<number | null>(null)
  const [itemAberto, setItemAberto] = useState<string | null>(null)

  const filteredFaq = faqData
    .map((secao) => ({
      ...secao,
      itens: secao.itens.filter(
        (item) =>
          item.pergunta.toLowerCase().includes(search.toLowerCase()) ||
          item.resposta.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((secao) => secao.itens.length > 0)

  const toggleSecao = (index: number) => {
    setSecaoAberta(secaoAberta === index ? null : index)
    setItemAberto(null)
  }

  const toggleItem = (id: string) => {
    setItemAberto(itemAberto === id ? null : id)
  }

  return (
    <div>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>
            <HelpCircle size={24} color="#A94438" style={{ marginRight: 8 }} />
            Ajuda / FAQ
          </h1>
          <p style={styles.subtitle}>
            Tire suas dúvidas sobre o funcionamento do Dashboard Administrativo
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchBox}>
        <Search size={18} color="#9CA3AF" />
        <input
          type="text"
          placeholder="Buscar por palavra-chave..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Seções */}
      <div style={styles.sectionsList}>
        {filteredFaq.map((secao, index) => (
          <div key={index} style={styles.sectionCard}>
            {/* Header da seção */}
            <button
              onClick={() => toggleSecao(index)}
              style={{
                ...styles.sectionHeader,
                borderLeft: `4px solid ${secao.cor}`,
                backgroundColor: (coresBadge[secao.cor] || '#F9FAFB'),
              }}
            >
              <div style={styles.sectionHeaderLeft}>
                <span style={{ color: secao.cor }}>{secao.icone}</span>
                <div>
                  <h2 style={styles.sectionTitle}>{secao.titulo}</h2>
                  <p style={styles.sectionDesc}>{secao.descricao}</p>
                </div>
              </div>
              {secaoAberta === index ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </button>

            {/* Itens da seção */}
            {secaoAberta === index && (
              <div style={styles.sectionBody}>
                {secao.itens.map((item, i) => {
                  const itemId = `${index}-${i}`
                  const isOpen = itemAberto === itemId
                  return (
                    <div key={i} style={styles.faqItem}>
                      <button
                        onClick={() => toggleItem(itemId)}
                        style={styles.faqQuestion}
                      >
                        <span style={styles.questionText}>{item.pergunta}</span>
                        {isOpen ? (
                          <ChevronUp size={16} color="#A94438" />
                        ) : (
                          <ChevronDown size={16} color="#9CA3AF" />
                        )}
                      </button>
                      {isOpen && (
                        <div style={styles.faqAnswer}>
                          <p style={styles.answerText}>{item.resposta}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
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
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: 10,
    padding: '12px 16px',
    marginBottom: 24,
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    color: '#1F2937',
    fontSize: 15,
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
  },
  sectionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    fontFamily: 'inherit',
    fontSize: 14,
    textAlign: 'left' as const,
    transition: 'background 0.2s',
  },
  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#1F2937',
  },
  sectionDesc: {
    margin: '2px 0 0 0',
    fontSize: 13,
    color: '#6B7280',
  },
  sectionBody: {
    padding: '0 20px 16px',
    borderTop: '1px solid #F3F4F6',
  },
  faqItem: {
    borderBottom: '1px solid #F3F4F6',
  },
  faqQuestion: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    fontFamily: 'inherit',
    fontSize: 14,
    textAlign: 'left' as const,
    gap: 12,
  },
  questionText: {
    flex: 1,
    color: '#374151',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  faqAnswer: {
    paddingBottom: 14,
  },
  answerText: {
    margin: 0,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 1.7,
  },
}