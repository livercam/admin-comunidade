# 🌐 Interceder - Admin Dashboard

Painel administrativo para gerenciamento da comunidade Interceder. Permite moderar conteúdo, gerenciar usuários, títulos ministeriais, categorias, células e anúncios.

## 🖥️ Tecnologias

- **React** + **TypeScript**
- **Vite** (build tool)
- **Firebase** (Auth, Firestore, Storage)
- **React Router** (navegação)
- **Recharts** (gráficos)
- **Lucide React** (ícones)

## 🚀 Como Executar

```bash
npm install --legacy-peer-deps
npx vite --host 0.0.0.0
```

Acesse: http://localhost:5173

## 🔐 Autenticação

Apenas emails autorizados. Configurado em `src/config/firebase.ts`:
```typescript
export const ADMIN_EMAILS = ['peterdonie@gmail.com']
```

## 📋 Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard com gráficos |
| `/moderacao` | Revisão de conteúdo |
| `/usuarios` | CRUD de usuários |
| `/pedidos` | Pedidos de oração |
| `/testemunhos` | Testemunhos |
| `/celulas` | Células/grupos |
| `/categorias` | Categorias de pedidos |
| `/titulos` | Títulos/cargos |
| `/denuncias` | Denúncias |
| `/suporte` | Chamados de suporte |
| `/anuncios` | Banners promocionais |
| `/configuracoes` | Chave PIX, financeiro |

## 📢 Anúncios

- Tipo: Imagem ou Vídeo
- Segmentação por cargo ou usuário
- Métricas: visualizações e cliques
- Upload para Firebase Storage

## 📦 Build

```bash
npx vite build