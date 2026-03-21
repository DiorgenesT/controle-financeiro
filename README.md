# Tudo Em Dia — Controle Financeiro Inteligente

> SaaS de gestão financeira pessoal para o mercado brasileiro.

**Acesse:** [tatudoemdia.com.br](https://tatudoemdia.com.br/)

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-orange)
![Version](https://img.shields.io/badge/Versão-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Sobre

O **Tudo Em Dia** é uma aplicação web completa para organização financeira pessoal. Controle de contas bancárias, cartões de crédito, transações, metas, despesas recorrentes e relatórios — tudo em uma interface responsiva com dark mode e um assistente de IA com voz integrado.

## Funcionalidades

- **Dashboard:** Saldo total, receitas/despesas do mês, insights automáticos, score de saúde financeira, previsão de saldo e "Seguro Gastar Hoje"
- **Contas bancárias:** Múltiplas contas com saldo em tempo real
- **Cartões de crédito:** Controle de faturas, limites, datas de fechamento e vencimento
- **Transações:** Lançamentos avulsos, parcelados, boletos e PIX
- **Despesas fixas:** Automação de receitas e despesas recorrentes mensais
- **Metas financeiras:** Objetivos com prazo, progresso e conta vinculada
- **Relatórios:** Análise por categoria, evolução mensal e comparativos
- **Score de saúde financeira:** 4 pilares — poupança, reserva de emergência, disciplina e tendência (0–1000)
- **Seguro Gastar Hoje:** Orçamento diário com acúmulo natural, disponível a partir do 2º mês de uso
- **Assistente IA com voz:** CRUD completo por linguagem natural, especialista financeiro com alertas proativos
- **Assinaturas:** Planos Free e Premium via Stripe (cartão, boleto, PIX)

## Stack

### Frontend
| Tecnologia | Uso |
|---|---|
| Next.js 16 (App Router) | Framework principal |
| React 19 + TypeScript 5 | UI e tipagem |
| Tailwind CSS 4 | Estilização |
| Radix UI + shadcn/ui | Componentes acessíveis |
| Framer Motion + GSAP | Animações |
| Recharts | Gráficos |
| Lucide React | Ícones |

### Backend / Serviços
| Tecnologia | Uso |
|---|---|
| Firebase Firestore | Banco de dados NoSQL em tempo real |
| Firebase Auth | Autenticação |
| Firebase Admin SDK | Operações server-side |
| Vercel AI SDK + OpenAI (gpt-4o-mini) | Assistente IA com streaming |
| Google Cloud TTS | Síntese de voz do assistente |
| Web Speech API | Reconhecimento de voz no browser |
| Stripe | Assinaturas, boleto, parcelamento e PIX |
| Resend | E-mails transacionais |

### Infraestrutura
- **Vercel** — deploy, CI/CD, edge network
- **Domínio:** Registro.br + ImprovMX (e-mail)

## Estrutura de pastas

```
app/
├── (auth)/           # Login, cadastro, recuperação de senha
├── (dashboard)/      # Área protegida — dashboard, contas, cartões, metas...
└── api/              # Rotas serverless: assistente IA, webhooks, checkout
components/           # Componentes React reutilizáveis e de domínio
hooks/                # Custom React Hooks
lib/                  # Firebase, Stripe, Resend, utilitários
types/                # Tipos TypeScript centralizados
public/               # Arquivos estáticos
```

**Coleções Firestore:** `users` · `accounts` · `transactions` · `credit_cards` · `invoices` · `goals` · `categories` · `recurring_transactions` · `people`

## Rodando localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
git clone https://github.com/DiorgenesT/controle-financeiro.git
cd controle-financeiro
npm install
```

### Variáveis de ambiente

Crie `.env.local` na raiz:

```env
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side only)
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=

# OpenAI (server-side only)
OPENAI_API_KEY=

# Google Cloud TTS (server-side only)
GOOGLE_APPLICATION_CREDENTIALS=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend (server-side only)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Executar

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run lint       # ESLint
npm run type-check # TypeScript sem emitir
```

Acesse [http://localhost:3000](http://localhost:3000).

## Segurança

- Firebase Admin SDK nunca exposto no client — apenas em `app/api/`
- Stripe e OpenAI secret keys apenas server-side
- Webhooks validados com assinatura antes de processar
- Dados protegidos por Firestore Security Rules (`request.auth.uid === resource.data.userId`)
- Variáveis `NEXT_PUBLIC_` apenas para o que precisa estar no browser

---

Desenvolvido por **Diorgenes**.
