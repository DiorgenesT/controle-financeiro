# 💰 Tudo Em Dia - Controle Financeiro Inteligente

> Uma plataforma moderna e intuitiva para gestão de finanças pessoais, construída com as tecnologias mais recentes do mercado.

**Acesse agora:** [https://tatudoemdia.com.br/](https://tatudoemdia.com.br/)

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-emerald)
![Version](https://img.shields.io/badge/Versão-0.1.0-blue)

## 📋 Sobre o Projeto

O **Tudo Em Dia** é uma aplicação web completa (SaaS) projetada para ajudar usuários a organizarem sua vida financeira. Com foco em UX/UI premium, o sistema oferece controle de despesas, receitas, cartões de crédito, metas financeiras e relatórios detalhados, tudo em uma interface responsiva e elegante (Dark Mode).

## ✨ Funcionalidades Principais

- **📊 Dashboard Interativo:** Visão geral de saldo, despesas e receitas com gráficos dinâmicos.
- **💳 Gestão de Cartões:** Controle de faturas, limites e datas de fechamento/vencimento.
- **🔄 Transações Recorrentes:** Automação de despesas e receitas fixas.
- **🎯 Metas Financeiras:** Definição e acompanhamento de objetivos de economia.
- **📈 Relatórios Detalhados:** Análises visuais de gastos por categoria e evolução mensal.
- **🤖 Assistente IA:** Chat integrado com inteligência artificial para insights financeiros.
- **🔐 Autenticação Segura:** Login, cadastro e recuperação de senha personalizados.
- **💳 Assinaturas:** Integração completa com Stripe para planos Premium.

## 🛠️ Tecnologias Utilizadas

O projeto foi desenvolvido utilizando uma stack moderna e robusta, focada em performance, escalabilidade e experiência do desenvolvedor.

### Frontend & Interface
- **[Next.js 16](https://nextjs.org/)** (App Router) - Framework React de última geração.
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática para código mais seguro.
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Estilização utilitária e responsiva.
- **[Radix UI](https://www.radix-ui.com/)** - Componentes acessíveis e sem estilo (Headless).
- **[Lucide React](https://lucide.dev/)** - Ícones vetoriais leves e consistentes.
- **[Recharts](https://recharts.org/)** - Biblioteca de gráficos composta e declarativa.
- **[GSAP](https://gsap.com/)** - Animações de alta performance.
- **[Sonner](https://sonner.emilkowal.ski/)** - Notificações toast elegantes.

### Backend & Serviços (Serverless)
- **[Firebase](https://firebase.google.com/)**
    - **Firestore:** Banco de dados NoSQL em tempo real.
    - **Authentication:** Gestão de identidade e segurança.
- **[Stripe](https://stripe.com/)** - Processamento de pagamentos e gestão de assinaturas.
- **[Resend](https://resend.com/)** - API moderna para envio de e-mails transacionais.

### Infraestrutura & DevOps
- **[Vercel](https://vercel.com/)** - Hospedagem, CI/CD e Edge Network.
- **[ImprovMX](https://improvmx.com/)** - Redirecionamento de e-mails corporativos.
- **[Registro.br](https://registro.br/)** - Gestão de domínio.

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js 18+
- Gerenciador de pacotes (npm, yarn, pnpm ou bun)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/controle-financeiro.git
   cd controle-financeiro
   ```

2. **Instale as dependências**
   ```bash
   yarn install
   # ou
   npm install
   ```

3. **Configure as Variáveis de Ambiente**
   Crie um arquivo `.env.local` na raiz do projeto e preencha as chaves necessárias (veja `.env.example` se disponível):
   ```env
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   
   # Stripe
   STRIPE_SECRET_KEY=...
   NEXT_PUBLIC_STRIPE_KEY=...
   STRIPE_WEBHOOK_SECRET=...
   
   # Resend
   RESEND_API_KEY=...
   
   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Execute o servidor de desenvolvimento**
   ```bash
   yarn dev
   ```

5. **Acesse a aplicação**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📂 Estrutura de Pastas

```
/app              # Rotas e páginas (Next.js App Router)
  /(auth)         # Rotas de autenticação (login, cadastro, senha)
  /(dashboard)    # Rotas protegidas do sistema principal
  /api            # API Routes (Serverless functions)
/components       # Componentes React reutilizáveis
  /ui             # Componentes base (botões, inputs, cards)
/lib              # Configurações de serviços (Firebase, Stripe, Utils)
/hooks            # Custom React Hooks
/types            # Definições de tipos TypeScript
/public           # Arquivos estáticos (imagens, ícones)
```

---

Desenvolvido com 💚 por **Diorgenes**.
