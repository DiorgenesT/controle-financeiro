import { openai } from '@ai-sdk/openai';
import { ToolLoopAgent, createAgentUIStreamResponse, tool } from 'ai';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { headers } from 'next/headers';
import { z } from 'zod';
import fs from 'fs';

// Bank codes for defaults
const BANK_DEFAULTS: Record<string, { name: string, color: string, icon: string }> = {
    nubank: { name: 'Nubank', color: '#8B5CF6', icon: 'creditcard' },
    itau: { name: 'Itaú', color: '#FF6B00', icon: 'landmark' },
    bradesco: { name: 'Bradesco', color: '#CC092F', icon: 'landmark' },
    bb: { name: 'Banco do Brasil', color: '#FFCC00', icon: 'landmark' },
    santander: { name: 'Santander', color: '#EC0000', icon: 'landmark' },
    inter: { name: 'Inter', color: '#FF7A00', icon: 'creditcard' },
    c6: { name: 'C6 Bank', color: '#1A1A1A', icon: 'creditcard' },
    picpay: { name: 'PicPay', color: '#21C25E', icon: 'wallet' },
    caixa: { name: 'Caixa Econômica Federal', color: '#0066B3', icon: 'landmark' },
    mercadopago: { name: 'Mercado Pago', color: '#009EE3', icon: 'wallet' },
    neon: { name: 'Neon', color: '#00D4AA', icon: 'creditcard' },
    next: { name: 'Next', color: '#00FF5F', icon: 'creditcard' },
    digio: { name: 'Digio', color: '#0066FF', icon: 'creditcard' },
    baninter: { name: 'Inter', color: '#FF7A00', icon: 'creditcard' },
    sicoob: { name: 'Sicoob', color: '#007A33', icon: 'landmark' },
    sicredi: { name: 'Sicredi', color: '#009A3E', icon: 'landmark' },
    original: { name: 'Banco Original', color: '#00A859', icon: 'creditcard' },
    will: { name: 'Will Bank', color: '#FFD700', icon: 'creditcard' },
    pagbank: { name: 'PagBank', color: '#F5A623', icon: 'wallet' },
    ame: { name: 'Ame Digital', color: '#FF0000', icon: 'wallet' },
};

// Alias map: normalized string → canonical key in BANK_DEFAULTS
const BANK_ALIASES: Record<string, string> = {
    'caixaeconomica': 'caixa',
    'caixaeconomicafederal': 'caixa',
    'cef': 'caixa',
    'bancodobrasil': 'bb',
    'bradescobanco': 'bradesco',
    'itauunibanco': 'itau',
    'bancoitau': 'itau',
    'c6bank': 'c6',
    'bancointer': 'inter',
    'mercadopago': 'mercadopago',
    'pag': 'pagbank',
    'picpay': 'picpay',
    'willbank': 'will',
    'bancoriginal': 'original',
};

function normalizeBankCode(code: string): string {
    const normalized = code
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[\s\-_]+/g, '');       // remove spaces, hyphens, underscores
    return BANK_ALIASES[normalized] ?? normalized;
}

// =========================================================================
// HELPER FUNCTIONS (SERVER-SIDE)
// =========================================================================

async function getOrCreateInvoiceAdmin(
    db: admin.firestore.Firestore,
    cardId: string,
    userId: string,
    month: number,
    year: number,
    closingDay: number,
    dueDay: number
) {
    const invoicesRef = db.collection('invoices');
    const snapshot = await invoicesRef
        .where('userId', '==', userId)
        .where('creditCardId', '==', cardId)
        .where('month', '==', month)
        .where('year', '==', year)
        .get();

    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    const closingDate = new Date(year, month - 1, closingDay);
    const dueDate = new Date(year, month - 1, dueDay);
    if (dueDay < closingDay) dueDate.setMonth(dueDate.getMonth() + 1);

    const docRef = await invoicesRef.add({
        creditCardId: cardId,
        userId,
        month,
        year,
        totalAmount: 0,
        status: 'open',
        closingDate: admin.firestore.Timestamp.fromDate(closingDate),
        dueDate: admin.firestore.Timestamp.fromDate(dueDate),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { id: docRef.id };
}

function getInvoiceMonthYear(purchaseDate: Date, closingDay: number, installmentOffset: number = 0) {
    const date = new Date(purchaseDate);
    const day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    if (day > closingDay) {
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
    }

    month += installmentOffset;
    while (month > 12) {
        month -= 12;
        year += 1;
    }
    return { month, year };
}

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const headerList = await headers();
        const authHeader = headerList.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 });

        const idToken = authHeader.split('Bearer ')[1];
        let userId: string;
        try {
            const decodedToken = await adminAuth().verifyIdToken(idToken);
            userId = decodedToken.uid;
        } catch (error) {
            return new Response('Unauthorized', { status: 401 });
        }

        const db = adminFirestore();

        // -------------------------------------------------------------------------
        // FETCH CONTEXT (Safely)
        // -------------------------------------------------------------------------
        const fetchSafe = async (coll: string) => {
            try {
                const snap = await db.collection(coll).where('userId', '==', userId).get();
                return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                console.error(`Error fetching ${coll}:`, e);
                return [];
            }
        };

        const [userDoc, accountsList, cardsList, catsList, goalsList, peopleList, recurringList] = await Promise.all([
            db.collection('users').doc(userId).get().catch(() => null),
            fetchSafe('accounts'),
            fetchSafe('creditCards'),
            fetchSafe('categories'),
            fetchSafe('goals'),
            fetchSafe('people'),
            fetchSafe('recurring_transactions'),
        ]);

        const userName = (userDoc as any)?.data()?.displayName?.split(' ')[0] || 'Usuário';

        const now = new Date();
        const accountsStr = accountsList.map((a: any) => {
            const isDef = a.isDefault ? ' [PADRÃO]' : '';
            return `${a.name}${isDef} (${(a.type === 'crypto' || a.name.toLowerCase().includes('btc')) ? 'Digital/Crypto' : 'Bancária'}) - R$ ${a.balance}`;
        }).join(', ') || 'Nenhuma';
        const cardsStr = cardsList.map((c: any) => c.name).join(', ') || 'Nenhum';
        const catsStr = catsList.map((c: any) => c.name).join(', ');
        const goalsStr = goalsList.map((g: any) => {
            const acc = accountsList.find((a: any) => a.id === g.linkedAccountId) as any;
            const accName = acc ? ` (Vinculada à conta: ${acc.name})` : '';
            return `${g.description}${accName}: R$ ${g.currentAmount}/${g.targetAmount}`;
        }).join(', ') || 'Nenhuma';
        const peopleStr = peopleList.map((p: any) => p.name).join(', ') || 'Ninguém (Apenas Família)';
        const recurringStr = recurringList.map((r: any) => `${r.description} (R$ ${r.amount})`).join(', ') || 'Nenhuma regra recorrente';

        const idMappingStr = [
            '- Contas: ' + accountsList.map((a: any) => a.name + ': ' + a.id).join(' | '),
            '- Cartões: ' + cardsList.map((c: any) => c.name + ': ' + c.id).join(' | '),
            '- Metas: ' + goalsList.map((g: any) => g.description + ': ' + g.id).join(' | '),
            '- Categorias: ' + catsList.map((c: any) => c.name + ': ' + c.id).join(' | '),
            '- Pessoas: ' + peopleList.map((p: any) => p.name + ': ' + p.id).join(' | '),
            '- Regras Recorrentes: ' + recurringList.map((r: any) => r.description + ': ' + r.id).join(' | ')
        ].join('\n');

        // -------------------------------------------------------------------------
        // COMPUTE FINANCIAL ALERTS FROM PRE-FETCHED DATA
        // -------------------------------------------------------------------------
        const alertsList: string[] = [];

        // Low balance accounts (below R$100)
        accountsList.forEach((a: any) => {
            if (typeof a.balance === 'number' && a.balance >= 0 && a.balance < 100) {
                alertsList.push(`⚠️ Saldo baixo: ${a.name} (R$ ${a.balance.toFixed(2)})`);
            }
        });

        // Overdue or upcoming recurring transactions
        recurringList.forEach((r: any) => {
            if (!r.active) return;
            let alreadyProcessed = false;
            if (r.lastProcessedDate) {
                const lastDate = r.lastProcessedDate.toDate ? r.lastProcessedDate.toDate() : new Date(r.lastProcessedDate);
                if (lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear()) {
                    alreadyProcessed = true;
                }
            }
            if (!alreadyProcessed) {
                const daysLeft = r.day - now.getDate();
                if (daysLeft < 0) {
                    alertsList.push(`🔴 Fixa VENCIDA: ${r.description} (R$ ${r.amount}) — deveria ter sido paga no dia ${r.day}`);
                } else if (daysLeft <= 5) {
                    alertsList.push(`🟡 Fixa próxima: ${r.description} (R$ ${r.amount}) — vence dia ${r.day} (em ${daysLeft} dias)`);
                }
            }
        });

        // Goals nearing completion (>= 90%)
        goalsList.forEach((g: any) => {
            if (g.targetAmount > 0) {
                const pct = ((g.currentAmount || 0) / g.targetAmount) * 100;
                if (pct >= 90 && pct < 100) {
                    alertsList.push(`🎯 Meta quase lá: "${g.description}" — ${pct.toFixed(0)}% concluída!`);
                }
            }
        });

        const alertsStr = alertsList.length > 0 ? alertsList.join('\n') : 'Nenhum alerta no momento.';

        const monthName = now.toLocaleDateString('pt-BR', { month: 'long' });
        const monthCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        const systemPrompt = `DATA ATUAL: ${now.toLocaleDateString('pt-BR')} (Hoje é dia ${now.getDate()} de ${monthCapitalized} de ${now.getFullYear()}).

════════════════════════════════════════════════════════════
🚨 PRINCÍPIO FUNDAMENTAL — LEIA ANTES DE TUDO:
   AGE PRIMEIRO. PERGUNTA NUNCA (ou quase nunca).
════════════════════════════════════════════════════════════

Você é um assistente financeiro expert. Usuários falam de forma natural e esperam AÇÃO IMEDIATA, não um formulário de 5 perguntas. Sua missão é inferir tudo que puder com o que o usuário disse e executar — pedindo confirmação apenas de informações verdadeiramente essenciais e que não podem ser deduzidas.

REGRA DE OURO: Se você tem um padrão/default razoável para um campo, USE-O SILENCIOSAMENTE. Só pergunte se a informação for ambígua E não tiver jeito de inferir.

EXEMPLOS CONCRETOS DE COMPORTAMENTO CORRETO:

❌ ERRADO — "crie uma conta Nubank":
   Assistente: "Preciso de: 1. Nome da conta 2. Tipo 3. Saldo inicial 4. Cor 5. Ícone 6. Padrão?"
   → ISSO É INACEITÁVEL. O usuário vai embora.

✅ CERTO — "crie uma conta Nubank":
   Assistente chama manageAccount com bankCode="nubank", type="checking", balance=0, isDefault=(se for a primeira conta).
   Resposta: "✅ Conta Nubank criada! Saldo inicial R$ 0,00."
   → Pronto. Uma linha. Zero perguntas.

❌ ERRADO — "gastei 50 reais no almoço":
   Assistente: "Em qual conta? Qual método de pagamento? É fixo? Qual categoria?"
   → INACEITÁVEL.

✅ CERTO — "gastei 50 reais no almoço":
   Assistente infere: despesa, R$ 50, categoria "Alimentação", conta padrão, método pix/débito.
   Resposta: "Confirmado: Almoço de R$ 50,00 no débito da [conta padrão]. Posso lançar?"
   → Uma confirmação. Executa no próximo "sim".

❌ ERRADO — "adicione meu cartão Itaú":
   Assistente: "Qual o limite? Dia de fechamento? Dia de vencimento? Cor? Ícone?"
   → INACEITÁVEL para campos com defaults.

✅ CERTO — "adicione meu cartão Itaú com limite 5000, fecha dia 10, vence dia 15":
   Assistente chama manageCreditCard com todos os dados inferidos.
   Resposta: "✅ Cartão Itaú adicionado! Limite R$ 5.000,00, fecha dia 10, vence dia 15."
   → Zero perguntas desnecessárias.

TABELA DE DEFAULTS (aplique sempre que o campo não for informado):
- Saldo de conta nova: R$ 0,00
- Tipo de conta: "checking" (corrente)
- Conta padrão: true APENAS se for a primeira conta do usuário
- Banco conhecido → passe o bankCode CORRETO e o sistema preenche nome/cor/ícone:
  nubank=Nubank | bb=Banco do Brasil | itau=Itaú | bradesco=Bradesco | caixa=Caixa | santander=Santander | inter=Inter | c6=C6 Bank | picpay=PicPay | mercadopago=Mercado Pago | neon=Neon | next=Next | digio=Digio | sicoob=Sicoob | sicredi=Sicredi | original=Banco Original | will=Will Bank | pagbank=PagBank
- Método de pagamento para despesa sem contexto: débito ou pix (prefira a conta padrão)
- Método de pagamento para receita: "transfer" ou "deposit"
- isRecurring: false (SEMPRE, a menos que o usuário diga explicitamente "é fixo" ou "recorrente")
- personId: "family" se não informado
- Categoria não informada: deduza pelo contexto ("almoço" → Alimentação, "uber" → Transporte, etc.)

QUANDO É PERMITIDO PERGUNTAR:
Apenas quando a informação é ESSENCIAL e genuinamente ambígua:
- Valor de uma transação (se não foi dito)
- Qual cartão usar (se o usuário tem mais de um e não ficou claro)
- Qual conta (se o usuário tem múltiplas e a despesa for alta — acima de R$ 500)
- Data de vencimento de boleto (se não informada)
- Mês/ano de fatura a pagar (se ambíguo)
Nesses casos, faça UMA única pergunta objetiva, não uma lista.

════════════════════════════════════════════════════════════

PROTOCOLO DE LANÇAMENTO EM DOIS TURNOS (para transações financeiras):
- TURNO 1: Use 'prepareTransaction' ou 'manageTransactions(action:"prepare")'. Confirme em UMA frase curta e peça OK.
- TURNO 2: Após "Sim/Ok/pode/confirmo", chame 'executeSave' ou 'manageTransactions(action:"execute")'. Responda: "✅ Prontinho!"
EXCEÇÃO: Criação de contas, cartões, categorias, metas e pessoas NÃO precisam de dois turnos — execute direto e confirme com ✅.

REGRAS DE NEGÓCIO:
- TRANSFERÊNCIAS: Use SEMPRE 'transferBalance'. Nunca use executeSave para isso.
- METAS: Nunca vincule à conta Padrão. Use conta de reserva/poupança/investimento.
- AVISO DE META: Se lançamento sair de conta com meta vinculada, avise naturalmente.
- EDITAR transação: Use 'editTransaction'. Confirme antes de executar.
- EXCLUIR transação: Use 'deleteTransaction'. Peça confirmação antes. Reverte saldo automaticamente.
- EXCLUIR conta: Use 'manageAccount' com action='delete' e o accountId do INTERNAL ID MAPPING. Peça confirmação antes.
- EXCLUIR cartão: Use 'manageCreditCard' com action='delete' e o cardId do INTERNAL ID MAPPING. Peça confirmação antes.
- EXCLUIR categoria: Use 'manageCategory' com action='delete' e o categoryId do INTERNAL ID MAPPING.
- EXCLUIR meta: Use 'manageGoal' com action='delete' e o goalId do INTERNAL ID MAPPING. Peça confirmação antes.
- CONFIRMAR FIXA: Use 'confirmRecurring'. Pergunte APENAS se o valor mudou.
- NUNCA confirme sucesso sem verificar o retorno da ferramenta. Se retornar { error: ... }, informe o usuário do erro.

ESPECIALISTA FINANCEIRO:
- Você é um assistente financeiro pessoal brasileiro, amigável, direto e genuinamente preocupado com a saúde financeira do usuário.
- Quando notar alertas (saldo baixo, fixa vencida, meta quase atingida), mencione de forma natural.
- Ao registrar gastos altos ou receber receita relevante, ofereça perspectiva financeira com leveza.
- Linguagem Natural BR: "Claro!", "Tudo certo,", "Entendido,".

BANIMENTO DE LISTAS E ENUMERAÇÕES (VOZ LIMPA):
- PROIBIDO: "1.", "2.", "3.", "-", "•", ou qualquer marcador.
- Use parágrafos fluidos e conectivos naturais. Fale como humano.

CONFIRMAÇÃO DE SUCESSO:
- As ferramentas são silenciosas. Você é a única voz que confirma.
- Use: "✅ Prontinho! Já registrei aqui para você." — curto, humano, amigável.
- NUNCA liste os campos técnicos após salvar ("Conta: Nubank, Método: débito..."). Só o essencial.

CONTEXTO ATUAL:
- Contas: ${accountsStr}
- Cartões: ${cardsStr}
- Categorias: ${catsStr}
- Metas: ${goalsStr}
- Pessoas: ${peopleStr}
- Regras Recorrentes Ativas: ${recurringStr}

ALERTAS FINANCEIROS ATIVOS:
${alertsStr}

INTERNAL ID MAPPING (NUNCA MOSTRAR IDs):
${idMappingStr}

INSTRUÇÕES DE FERRAMENTAS:
- 'prepareTransaction': PASSO 1 para lançamentos únicos.
- 'executeSave': PASSO 2 para lançamentos únicos (após SIM). Também aceita action='delete' para excluir com reversão de saldo.
- 'manageTransactions': Gerencia múltiplos lançamentos (prepare/execute).
- 'transferBalance': Realiza transferência entre duas contas bancárias.
- 'payInvoice': Registra pagamento de fatura de cartão.
- 'manageRecurring': Cria, edita ou exclui regras de gastos fixos/recorrentes.
- 'confirmRecurring': Confirma o pagamento/recebimento de uma fixa no mês atual.
- 'searchTransactions': Busca transações por descrição, categoria, tipo ou período.
- 'editTransaction': Edita um lançamento existente (descrição, valor, categoria, data).
- 'deleteTransaction': Exclui um lançamento e reverte o saldo automaticamente.
- 'manageAccount': Cria, edita ou exclui contas. Use 'savings' para poupança e 'checking' para corrente.
- 'manageCreditCard': Gerencia cartões de crédito.
- 'manageCategory': Gerencia categorias de gastos/receitas.
- 'manageGoal': Gerencia metas financeiras.
- 'managePerson': Gerencia pessoas (família).
- 'getEconomicIndicators' / 'getMarketData': Indicadores e cotações reais.
- 'getFinancialAnalysis': Analisa receitas e despesas de um período.
`;

        const body = await req.json().catch(e => {
            console.error('[Assistant] Failed to parse request body:', e);
            return null;
        });
        if (!body) return new Response('Invalid request body', { status: 400 });

        const { messages } = body;
        console.log(`[Assistant] User: ${userId}, Messages: ${messages?.length}`);

        const syncGoalCurrentAmount = async (accountId: string, amount: number, batch?: admin.firestore.WriteBatch) => {
            const linkedGoals = (goalsList as any[]).filter((g: any) => g.linkedAccountId === accountId);
            for (const goal of linkedGoals) {
                // Ensure we don't go below 0 for currentAmount
                const newAmount = Math.max(0, (goal.currentAmount || 0) + amount);
                const newStatus = newAmount >= (goal.targetAmount || 0) ? 'concluida' : 'em_progresso';
                const updateData = {
                    currentAmount: newAmount,
                    status: newStatus,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };
                if (batch) {
                    batch.update(db.collection('goals').doc(goal.id), updateData);
                } else {
                    await db.collection('goals').doc(goal.id).update(updateData);
                }
            }
        };

        const { streamText, convertToModelMessages, tool, stepCountIs } = await import('ai');
        const modelMessages = await convertToModelMessages(messages);

        const executeTransactionSave = async (params: any) => {
            console.error(`[Assistant] DEBUG executeTransactionSave PARAMS:`, JSON.stringify(params));
            try {
                fs.appendFileSync('assistant_actions.log', `[${now.toISOString()}] executeTransactionSave: ${JSON.stringify(params)}\n`);
            } catch (e) { }
            // ZERO-TRUST SANITIZATION: Derive isRecurring from both boolean and installments string (English and Portuguese)
            const isFixed = params.installments === 'fixed' || params.installments === 'fixa' || params.isRecurring === true;
            if (isFixed) console.error(`[Assistant] ALERT: Registering as FIXED/RECURRING!`);

            // Reconstruct clean object to avoid LLM hallucination leakage
            const baseTx: any = {
                userId,
                description: params.description,
                amount: params.amount,
                type: params.type,
                category: params.category,
                paymentMethod: params.paymentMethod,
                accountId: params.accountId,
                creditCardId: params.creditCardId,
                personId: params.personId || 'family',
                isRecurring: isFixed,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (params.paymentMethod === 'credit_card') {
                if (params.type === 'receita') {
                    throw new Error("⚠️ Receitas não podem ser lançadas em cartões de crédito.");
                }
                if (!params.creditCardId) {
                    throw new Error("⚠️ Cartão de crédito não especificado.");
                }
                const card: any = cardsList.find((c: any) => c.id === params.creditCardId);
                if (!card) throw new Error(`⚠️ Cartão '${params.creditCardId}' não encontrado.`);

                if (isFixed) {
                    const { month, year } = getInvoiceMonthYear(now, card.closingDay, 0);
                    const inv = await getOrCreateInvoiceAdmin(db, card.id, userId, month, year, card.closingDay, card.dueDay);
                    await db.collection('transactions').add({
                        ...baseTx,
                        date: admin.firestore.Timestamp.fromDate(new Date(year, month - 1, card.dueDay, 12, 0, 0)),
                        invoiceId: inv.id, isRecurring: true
                    });
                    await db.collection('invoices').doc(inv.id).update({ totalAmount: admin.firestore.FieldValue.increment(params.amount) });
                    await db.collection('recurring_transactions').add({
                        userId, type: params.type, description: params.description, amount: params.amount,
                        category: params.category, day: now.getDate(), active: true,
                        paymentMethod: 'credit', creditCardId: card.id, lastProcessedDate: admin.firestore.Timestamp.fromDate(now),
                        createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    const num = typeof params.installments === 'string' ? parseInt(params.installments) : params.installments;
                    if (num && num > 1) {
                        const instAmt = Number((params.amount / num).toFixed(2));
                        let firstId = '';
                        for (let i = 0; i < num; i++) {
                            const { month, year } = getInvoiceMonthYear(now, card.closingDay, i);
                            const inv = await getOrCreateInvoiceAdmin(db, card.id, userId, month, year, card.closingDay, card.dueDay);
                            const tx: any = {
                                ...baseTx, amount: instAmt, description: `${params.description} (${i + 1}/${num})`,
                                date: admin.firestore.Timestamp.fromDate(new Date(year, month - 1, card.dueDay, 12, 0, 0)),
                                invoiceId: inv.id, installments: num, installmentNumber: i + 1, totalAmount: params.amount
                            };
                            if (i > 0 && firstId) tx.parentTransactionId = firstId;
                            const res = await db.collection('transactions').add(tx);
                            if (i === 0) firstId = res.id;
                            await db.collection('invoices').doc(inv.id).update({ totalAmount: admin.firestore.FieldValue.increment(instAmt) });
                        }
                    } else {
                        const { month, year } = getInvoiceMonthYear(now, card.closingDay, 0);
                        const inv = await getOrCreateInvoiceAdmin(db, card.id, userId, month, year, card.closingDay, card.dueDay);
                        await db.collection('transactions').add({
                            ...baseTx, date: admin.firestore.Timestamp.fromDate(new Date(year, month - 1, card.dueDay, 12, 0, 0)),
                            invoiceId: inv.id
                        });
                        await db.collection('invoices').doc(inv.id).update({ totalAmount: admin.firestore.FieldValue.increment(params.amount) });
                    }
                }
            } else {
                // Non-Credit-Card Installments (Boleto, Pix, Debit)
                const num = typeof params.installments === 'string' ? parseInt(params.installments) : params.installments;

                if (num && num > 1) {
                    const instAmt = Number((params.amount / num).toFixed(2));
                    let firstId = '';

                    for (let i = 0; i < num; i++) {
                        const installmentDate = new Date(now);
                        installmentDate.setMonth(now.getMonth() + i);

                        // Handle custom due date for boletos
                        if (params.paymentMethod === 'boleto' && params.dueDate) {
                            const [y, m, d] = params.dueDate.split('-').map(Number);
                            const baseDueDate = new Date(y, m - 1, d, 12, 0, 0);
                            baseDueDate.setMonth(baseDueDate.getMonth() + i);
                            installmentDate.setTime(baseDueDate.getTime());
                        }

                        const tx: any = {
                            ...baseTx,
                            amount: instAmt,
                            description: `${params.description} (${i + 1}/${num})`,
                            date: admin.firestore.Timestamp.fromDate(installmentDate),
                            installments: num,
                            installmentNumber: i + 1,
                            totalAmount: params.amount
                        };

                        if (params.paymentMethod === 'boleto') {
                            tx.boletoStatus = 'pending';
                            tx.boletoDueDate = tx.date;
                        } else if (params.paymentMethod === 'debit' || params.paymentMethod === 'pix' || params.paymentMethod === 'transfer' || params.paymentMethod === 'deposit') {
                            if (!params.accountId) throw new Error("⚠️ Conta bancária não especificada.");

                            // Only decrement balance for the FIRST installment if it's debit/pix? 
                            // Actually, for future installments, we shouldn't decrement NOW.
                            // But usually, "parcelado no boleto" implies future entries.
                            // For simplicity and correctness in financial tracking:
                            if (i === 0) {
                                const inc = params.type === 'receita' ? instAmt : -instAmt;
                                await db.collection('accounts').doc(params.accountId).update({
                                    balance: admin.firestore.FieldValue.increment(inc),
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                if (params.type === 'receita') {
                                    await syncGoalCurrentAmount(params.accountId, instAmt);
                                } else {
                                    await syncGoalCurrentAmount(params.accountId, -instAmt);
                                }
                            }
                        }

                        if (i > 0 && firstId) tx.parentTransactionId = firstId;
                        const res = await db.collection('transactions').add(tx);
                        if (i === 0) firstId = res.id;
                    }
                } else {
                    // Single transaction (Normal flow)
                    const tx: any = { ...baseTx, date: admin.firestore.Timestamp.fromDate(now) };

                    if (params.paymentMethod === 'boleto') {
                        tx.boletoStatus = 'pending';
                        if (params.dueDate) {
                            const [y, m, d] = params.dueDate.split('-').map(Number);
                            tx.date = admin.firestore.Timestamp.fromDate(new Date(y, m - 1, d, 12, 0, 0));
                            tx.boletoDueDate = tx.date;
                        }
                    } else if (params.paymentMethod === 'debit' || params.paymentMethod === 'pix' || params.paymentMethod === 'transfer' || params.paymentMethod === 'deposit') {
                        if (!params.accountId) throw new Error("⚠️ Conta bancária não especificada.");
                        const inc = params.type === 'receita' ? params.amount : -params.amount;
                        await db.collection('accounts').doc(params.accountId).update({
                            balance: admin.firestore.FieldValue.increment(inc),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        // Sync goal for both income and expense
                        await syncGoalCurrentAmount(params.accountId, inc);
                    }

                    if (isFixed) {
                        tx.isRecurring = true;
                        await db.collection('recurring_transactions').add({
                            userId, type: params.type, description: params.description, amount: params.amount,
                            category: params.category, day: now.getDate(), active: true,
                            paymentMethod: params.paymentMethod, accountId: params.accountId,
                            lastProcessedDate: admin.firestore.Timestamp.fromDate(now),
                            createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                    }
                    await db.collection('transactions').add(tx);
                }
            }
        };

        const result = streamText({
            model: openai('gpt-4o-mini'),
            system: systemPrompt,
            messages: modelMessages,
            stopWhen: stepCountIs(10),
            tools: {
                getEconomicIndicators: tool({
                    description: 'Busca indicadores econômicos REAIS do Brasil diretamente do Banco Central (Selic, IPCA, CDI).',
                    inputSchema: z.object({}),
                    execute: async () => {
                        console.log(`[Assistant] Tool: getEconomicIndicators (Real-time)`);
                        try {
                            const fetchInd = async (code: number) => {
                                const resp = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/1?formato=json`);
                                const data = await resp.json();
                                return data?.[0]?.valor ? parseFloat(data[0].valor) : null;
                            };
                            const [selic, ipca, cdi] = await Promise.all([
                                fetchInd(432), // Selic Meta
                                fetchInd(433), // IPCA Mensal
                                fetchInd(4389) // CDI Mensal
                            ]);
                            return {
                                success: true,
                                indicators: { selic, ipca, cdi, date: new Date().toISOString() }
                            };
                        } catch (e) {
                            console.error('[Assistant] Indicator error:', e);
                            return { error: 'Falha ao buscar indicadores do BCB.' };
                        }
                    }
                }),
                getMarketData: tool({
                    description: 'Busca cotações REAIS de Dólar, Euro, Bitcoin e Ethereum.',
                    inputSchema: z.object({}),
                    execute: async () => {
                        console.log(`[Assistant] Tool: getMarketData`);
                        try {
                            const resp = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL');
                            const data = await resp.json();
                            return { success: true, market: data };
                        } catch (e) {
                            return { error: 'Falha ao buscar cotações do mercado.' };
                        }
                    }
                }),
                getFinancialAnalysis: tool({
                    description: 'Analisa finanças de um período, calculando totais e categorias.',
                    inputSchema: z.object({
                        month: z.number().describe('Mês (1-12)'),
                        year: z.number().describe('Ano (ex: 2024)')
                    }),
                    execute: async ({ month, year }) => {
                        console.log(`[Assistant] Tool: getFinancialAnalysis, period: ${month}/${year}`);
                        try {
                            const start = new Date(year, month - 1, 1);
                            const end = new Date(year, month, 0, 23, 59, 59);

                            console.log(`[Assistant] Querying: ${start.toISOString()} to ${end.toISOString()}`);

                            const txSnap = await db.collection('transactions')
                                .where('userId', '==', userId)
                                .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
                                .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
                                .get();

                            console.log(`[Assistant] Found ${txSnap.size} transactions`);

                            const transactions = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

                            let totalRevenue = 0;
                            let totalExpenses = 0;
                            const categorySpending: Record<string, number> = {};

                            transactions.forEach(tx => {
                                const amount = Number(tx.amount) || 0;
                                if (tx.type === 'receita') {
                                    totalRevenue += amount;
                                } else {
                                    totalExpenses += amount;
                                    const cat = tx.category || 'Outros';
                                    categorySpending[cat] = (categorySpending[cat] || 0) + amount;
                                }
                            });

                            return {
                                success: true,
                                period: `${month}/${year}`,
                                totals: {
                                    revenue: totalRevenue,
                                    expenses: totalExpenses,
                                    balance: totalRevenue - totalExpenses
                                },
                                topCategories: Object.entries(categorySpending)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([name, value]) => ({ name, value })),
                                txCount: transactions.length
                            };
                        } catch (e: any) {
                            console.error(`[Assistant] getFinancialAnalysis failure:`, e);
                            // Log to file for deep inspection
                            try {
                                fs.appendFileSync('assistant_error.log', `[${new Date().toISOString()}] getFinancialAnalysis FAILED: ${e.message}\nStack: ${e.stack}\nDetails: ${JSON.stringify(e.details || {})}\n\n`);
                            } catch (logErr) { }
                            return { error: `Erro técnico na análise: ${e.message}` };
                        }
                    }
                }),
                searchEntities: tool({
                    description: 'Busca transações ou outras entidades no histórico.',
                    inputSchema: z.object({
                        type: z.enum(['transaction', 'goal', 'account']),
                        limit: z.number().optional().default(10),
                    }),
                    execute: async ({ type, limit }) => {
                        console.log(`[Assistant] Tool: searchEntities, type: ${type}`);
                        try {
                            const collection = type === 'transaction' ? 'transactions' : type === 'goal' ? 'goals' : 'accounts';
                            const snap = await db.collection(collection)
                                .where('userId', '==', userId)
                                .limit(limit)
                                .get();

                            return snap.docs.map((doc: any) => {
                                const data = doc.data();
                                const clean: any = { id: doc.id, ...data };
                                if (clean.date?.toDate) clean.date = clean.date.toDate().toISOString();
                                if (clean.deadline?.toDate) clean.deadline = clean.deadline.toDate().toISOString();
                                if (clean.createdAt?.toDate) clean.createdAt = clean.createdAt.toDate().toISOString();
                                return clean;
                            });
                        } catch (e) {
                            console.error(`[Assistant] searchEntities error:`, e);
                            return { error: 'Falha ao buscar dados.' };
                        }
                    }
                }),
                prepareTransaction: tool({
                    description: 'PASSO 1: Prepara uma transação única para conferência. Chame esta ANTES de salvar.',
                    inputSchema: z.object({
                        description: z.string().describe('O que foi comprado ou recebido'),
                        amount: z.number().describe('Valor em reais'),
                        type: z.enum(['receita', 'despesa']),
                        category: z.string().describe('Categorize automaticamente se o usuário não disser (Ex: "Calça" -> "Vestuário"). Nunca deixe "Não especificada".'),
                        paymentMethod: z.enum(['debit', 'pix', 'credit_card', 'boleto', 'transfer', 'deposit']),
                        accountId: z.string().optional().describe('Conta bancária.'),
                        creditCardId: z.string().optional().describe('Cartão de crédito.'),
                        installments: z.union([z.number(), z.string()]).default(1).describe('Parcelas ou "fixed" para transações recorrentes.'),
                        isRecurring: z.boolean().default(false).describe('Defina como true para transações fixas ou recorrentes quando solicitado.'),
                        personId: z.string().optional().describe('ID da pessoa. Use sempre "family" se não houver um nome no pedido.'),
                        dueDate: z.string().optional().describe('Data de vencimento (YYYY-MM-DD) para boletos'),
                    }),
                    execute: async (params) => {
                        console.error(`[Assistant] DEBUG prepareTransaction INPUT:`, JSON.stringify(params));
                        return {
                            success: true,
                            action: 'prepared',
                            data: params
                        };
                    }
                }),
                executeSave: tool({
                    description: 'PASSO 2: Salva após SIM. Após chamar, responda APENAS "✅ Lançamento realizado!" e encerre.',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete']),
                        transactionId: z.string().optional(),
                        data: z.any().optional(),
                    }),
                    execute: async ({ action, transactionId, data }) => {
                        console.log(`[Assistant] Tool: saveTransaction, action: ${action}`);
                        try {
                            if (action === 'delete' && transactionId) {
                                const txRef = db.collection('transactions').doc(transactionId);
                                await db.runTransaction(async (txn) => {
                                    const txSnap = await txn.get(txRef);
                                    if (!txSnap.exists) throw new Error('Transação não encontrada.');
                                    const txData = txSnap.data() as any;
                                    if (txData.accountId) {
                                        const accRef = db.collection('accounts').doc(txData.accountId);
                                        const accSnap = await txn.get(accRef);
                                        if (accSnap.exists) {
                                            let balanceChange = 0;
                                            if (txData.type === 'receita') balanceChange = -txData.amount;
                                            else if (txData.type === 'despesa') {
                                                const isDebit = txData.paymentMethod === 'debit' || txData.paymentMethod === 'pix';
                                                const isPaidBoleto = txData.paymentMethod === 'boleto' && txData.boletoStatus === 'paid';
                                                if (isDebit || isPaidBoleto) balanceChange = txData.amount;
                                            }
                                            if (balanceChange !== 0) {
                                                txn.update(accRef, { balance: admin.firestore.FieldValue.increment(balanceChange), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                                            }
                                        }
                                    }
                                    txn.update(txRef, { deleted: true, deletedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                                });
                                return { success: true };
                            }
                            if (action === 'create' && data) {
                                await executeTransactionSave(data);
                                return { success: true };
                            }
                            return { error: 'Ação não suportada.' };
                        } catch (e: any) {
                            console.error('[Assistant] saveTransaction error:', e);
                            return { error: e.message || 'Erro ao processar lançamento.' };
                        }
                    }
                }),
                manageTransactions: tool({
                    description: 'Gerencia múltiplos. Turno 1: action="prepare". Turno 2: action="execute" (após SIM). Responda APENAS "✅ Lançamentos realizados!" no Turno 2.',
                    inputSchema: z.object({
                        action: z.enum(['prepare', 'execute']),
                        transactions: z.array(z.object({
                            description: z.string(),
                            amount: z.number(),
                            type: z.enum(['receita', 'despesa']),
                            category: z.string().describe('Categorize automaticamente se o usuário não disser.'),
                            paymentMethod: z.enum(['debit', 'pix', 'credit_card', 'boleto', 'transfer', 'deposit']),
                            accountId: z.string().optional(),
                            creditCardId: z.string().optional(),
                            installments: z.union([z.number(), z.string()]).default(1).describe('Parcelas ou "fixed" para recorrentes.'),
                            isRecurring: z.boolean().default(false).describe('Defina como true para fixas/recorrentes quando solicitado.'),
                            personId: z.string().optional().describe('Use "family" por padrão.'),
                            dueDate: z.string().optional(),
                        }))
                    }),
                    execute: async ({ action, transactions }) => {
                        console.log(`[Assistant] Tool: manageTransactions, action: ${action}, count: ${transactions.length}`);
                        try {
                            if (action === 'prepare') {
                                // Enrich with names for UI
                                const enriched = transactions.map(tx => {
                                    const acc = accountsList.find((a: any) => a.id === tx.accountId) as any;
                                    const card = cardsList.find((c: any) => c.id === tx.creditCardId) as any;
                                    const cat = catsList.find((c: any) => c.id === tx.category || c.name === tx.category) as any;
                                    const p = peopleList.find((p: any) => p.id === tx.personId) as any;
                                    return {
                                        ...tx,
                                        accountName: acc?.name,
                                        creditCardName: card?.name,
                                        categoryName: cat?.name || tx.category,
                                        personName: p?.name || 'Família'
                                    };
                                });

                                return {
                                    success: true,
                                    action: 'prepared',
                                    transactions: enriched
                                };
                            }
                            if (action === 'execute') {
                                let successCount = 0;
                                let errors: string[] = [];
                                for (const tx of transactions) {
                                    try {
                                        await executeTransactionSave(tx);
                                        successCount++;
                                    } catch (err: any) {
                                        errors.push(`${tx.description}: ${err.message}`);
                                    }
                                }
                                if (errors.length > 0 && successCount === 0) {
                                    return { error: `Falha total: ${errors.join(', ')}` };
                                }
                                return { success: true, count: successCount };
                            }
                            return { error: 'Ação não suportada.' };
                        } catch (e: any) {
                            console.error('[Assistant] manageTransactions error:', e);
                            return { error: e.message || 'Erro ao processar lote.' };
                        }
                    }
                }),
                manageAccount: tool({
                    description: 'Cria, edita ou exclui contas bancárias. Ao criar: se o banco for conhecido (nubank, itau, bradesco, inter, etc.), passe apenas bankCode e o sistema preenche nome/cor/ícone automaticamente. Defaults: balance=0, type="checking", isDefault=true somente se for a primeira conta.',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete']).describe('Ação a ser realizada.'),
                        accountId: z.string().optional().describe('ID da conta (obrigatório para update e delete).'),
                        data: z.object({
                            bankCode: z.string().optional().describe('Código do banco. Mapeamento OBRIGATÓRIO: "nubank"=Nubank, "bb"=Banco do Brasil, "itau"=Itaú, "bradesco"=Bradesco, "caixa"=Caixa Econômica Federal, "santander"=Santander, "inter"=Inter, "c6"=C6 Bank, "picpay"=PicPay, "mercadopago"=Mercado Pago, "neon"=Neon, "next"=Next, "digio"=Digio, "sicoob"=Sicoob, "sicredi"=Sicredi, "original"=Banco Original, "will"=Will Bank, "pagbank"=PagBank. Use EXATAMENTE esses códigos.'),
                            name: z.string().optional().describe('Nome da conta.'),
                            type: z.enum(['checking', 'savings', 'wallet', 'investment', 'emergency']).optional().describe('Tipo da conta: checking (corrente), savings (poupança), wallet (carteira), investment (investimento), emergency (reserva).'),
                            balance: z.number().optional().describe('Saldo inicial ou atual.'),
                            color: z.string().optional().describe('Cor em hexadecimal.'),
                            icon: z.string().optional().describe('Nome do ícone Lucide.'),
                            isDefault: z.boolean().optional().describe('Se é a conta padrão.'),
                        }).optional(),
                    }),
                    execute: async ({ action, accountId, data }) => {
                        console.log(`[Assistant] Tool: manageAccount, action: ${action}`);
                        try {
                            if (action === 'create' && data) {
                                let finalData = {
                                    ...data,
                                    type: data.type || 'checking',
                                    balance: data.balance ?? 0,
                                    isDefault: data.isDefault ?? (accountsList.length === 0)
                                };
                                if (data.bankCode) {
                                    const resolvedCode = normalizeBankCode(data.bankCode);
                                    const defaults = BANK_DEFAULTS[resolvedCode];
                                    if (defaults) {
                                        finalData.name = data.name || defaults.name;
                                        finalData.color = data.color || defaults.color;
                                        finalData.icon = data.icon || defaults.icon;
                                    }
                                }

                                await db.collection('accounts').add({
                                    ...finalData, userId,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { success: true };
                            }
                            if (action === 'update' && accountId && data) {
                                await db.collection('accounts').doc(accountId).update({
                                    ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { success: true };
                            }
                            if (action === 'delete') {
                                if (!accountId) return { error: 'FALHA: accountId é obrigatório para excluir uma conta. Busque o ID no INTERNAL ID MAPPING.' };
                                await db.collection('accounts').doc(accountId).delete();
                                return { success: true, message: 'Conta excluída com sucesso.' };
                            }
                            return { error: 'Ação inválida ou dados ausentes.' };
                        } catch (e: any) { return { error: `Erro ao gerenciar conta: ${e.message}` }; }
                    }
                }),
                manageCategory: tool({
                    description: 'Cria, edita ou exclui categorias.',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete']).describe('Ação a ser realizada.'),
                        categoryId: z.string().optional().describe('ID da categoria (obrigatório para update e delete).'),
                        data: z.object({
                            name: z.string().optional().describe('Nome da categoria.'),
                            type: z.enum(['receita', 'despesa']).optional().describe('Tipo da categoria (receita ou despesa).'),
                            color: z.string().optional().describe('Cor em hexadecimal.'),
                            icon: z.string().optional().describe('Nome do ícone Lucide.'),
                        }).optional()
                    }),
                    execute: async ({ action, categoryId, data }) => {
                        console.log(`[Assistant] Tool: manageCategory, action: ${action}`);
                        try {
                            if (action === 'create' && data) {
                                // Check if exists
                                const existing = catsList.find((c: any) => c.name.toLowerCase() === data.name?.toLowerCase());
                                if (existing) return { error: `A categoria '${data.name}' já existe.` };

                                await db.collection('categories').add({
                                    ...data, userId,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { success: true };
                            }
                            if (action === 'update' && categoryId && data) {
                                await db.collection('categories').doc(categoryId).update({
                                    ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { success: true };
                            }
                            if (action === 'delete') {
                                if (!categoryId) return { error: 'FALHA: categoryId é obrigatório para excluir. Busque o ID no INTERNAL ID MAPPING.' };
                                await db.collection('categories').doc(categoryId).delete();
                                return { success: true, message: 'Categoria excluída com sucesso.' };
                            }
                            return { error: 'Ação inválida ou dados ausentes.' };
                        } catch (e: any) { return { error: `Erro ao gerenciar categoria: ${e.message}` }; }
                    }
                }),
                manageCreditCard: tool({
                    description: 'Cria, edita ou exclui cartões de crédito. Ao criar: se banco for conhecido, passe bankCode e o sistema preenche nome/cor/ícone automaticamente. O usuário DEVE informar limit, closingDay e dueDay — esses três são obrigatórios e não têm default razoável.',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete']).describe('Ação a ser realizada.'),
                        cardId: z.string().optional().describe('ID do cartão (obrigatório para update e delete).'),
                        data: z.object({
                            bankCode: z.string().optional().describe('Código do banco. Mapeamento OBRIGATÓRIO: "nubank"=Nubank, "bb"=Banco do Brasil, "itau"=Itaú, "bradesco"=Bradesco, "caixa"=Caixa Econômica Federal, "santander"=Santander, "inter"=Inter, "c6"=C6 Bank, "picpay"=PicPay, "mercadopago"=Mercado Pago, "neon"=Neon, "next"=Next, "digio"=Digio, "sicoob"=Sicoob, "sicredi"=Sicredi, "original"=Banco Original, "will"=Will Bank, "pagbank"=PagBank. Use EXATAMENTE esses códigos.'),
                            name: z.string().optional().describe('Nome do cartão.'),
                            limit: z.number().optional().describe('Limite total.'),
                            closingDay: z.number().optional().describe('Dia de fechamento (1-31).'),
                            dueDay: z.number().optional().describe('Dia de vencimento (1-31).'),
                            color: z.string().optional().describe('Cor em hexadecimal.'),
                            icon: z.string().optional().describe('Nome do ícone Lucide.'),
                        }).optional(),
                    }),
                    execute: async ({ action, cardId, data }) => {
                        console.log(`[Assistant] Tool: manageCreditCard, action: ${action}`);
                        try {
                            if (action === 'create' && data) {
                                let finalData = { ...data };
                                if (data.bankCode) {
                                    const resolvedCode = normalizeBankCode(data.bankCode);
                                    const defaults = BANK_DEFAULTS[resolvedCode];
                                    if (defaults) {
                                        finalData.name = data.name || defaults.name;
                                        finalData.color = data.color || defaults.color;
                                        finalData.icon = data.icon || defaults.icon;
                                    }
                                }

                                await db.collection('creditCards').add({
                                    ...finalData,
                                    userId,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { success: true };
                            }
                            if (action === 'update' && cardId && data) {
                                await db.collection('creditCards').doc(cardId).update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                                return { success: true };
                            }
                            if (action === 'delete') {
                                if (!cardId) return { error: 'FALHA: cardId é obrigatório para excluir um cartão. Busque o ID no INTERNAL ID MAPPING.' };
                                await db.collection('creditCards').doc(cardId).delete();
                                return { success: true, message: 'Cartão excluído com sucesso.' };
                            }
                            return { error: 'Ação inválida ou dados ausentes.' };
                        } catch (e: any) { return { error: `Erro ao gerenciar cartão: ${e.message}` }; }
                    }
                }),
                manageGoal: tool({
                    description: 'Cria, edita ou exclui metas financeiras.',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete']).describe('Ação a ser realizada.'),
                        goalId: z.string().optional().describe('ID da meta (obrigatório para update e delete).'),
                        data: z.object({
                            title: z.string().optional().describe('Título curto da meta (ex: Viagem para Guarapari).'),
                            description: z.string().optional().describe('Descrição longa ou observações.'),
                            targetAmount: z.number().optional().describe('Valor alvo para atingir.'),
                            currentAmount: z.number().optional().describe('Valor já poupado.'),
                            deadline: z.string().optional().describe('Data limite (YYYY-MM-DD).'),
                            category: z.string().optional().describe('Categoria da meta.'),
                            color: z.string().optional().describe('Cor em hexadecimal.'),
                            icon: z.string().optional().describe('Nome do ícone Lucide.'),
                            linkedAccountId: z.string().optional().describe('ID da conta vinculada.'),
                        }).optional(),
                    }),
                    execute: async ({ action, goalId, data }) => {
                        console.log(`[Assistant] Tool: manageGoal, action: ${action}`);
                        try {
                            if (action === 'create' || action === 'update') {
                                if (data?.linkedAccountId) {
                                    const acc = accountsList.find((a: any) => a.id === data.linkedAccountId) as any;
                                    if (acc && acc.isDefault) {
                                        throw new Error(`⚠️ Metas não podem ser vinculadas à conta padrão (${acc.name}). Por favor, use uma conta de reserva ou poupança.`);
                                    }
                                }
                            }

                            if (action === 'create' && data) {
                                let initialAmount = data.currentAmount || 0;
                                if (data.linkedAccountId) {
                                    const acc = accountsList.find((a: any) => a.id === data.linkedAccountId) as any;
                                    if (acc) initialAmount = acc.balance;
                                }
                                const cleanData: any = {
                                    ...data,
                                    currentAmount: initialAmount,
                                    userId,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                    status: 'em_progresso'
                                };
                                if (data.deadline) cleanData.deadline = admin.firestore.Timestamp.fromDate(new Date(data.deadline));
                                await db.collection('goals').add(cleanData);
                                return { success: true };
                            }
                            if (action === 'delete') {
                                if (!goalId) return { error: 'FALHA: goalId é obrigatório para excluir uma meta. Busque o ID no INTERNAL ID MAPPING.' };
                                await db.collection('goals').doc(goalId).delete();
                                return { success: true, message: 'Meta excluída com sucesso.' };
                            }
                            if (action === 'update' && goalId && data) {
                                let currentGoal = goalsList.find((g: any) => g.id === goalId) as any;
                                const updateData: any = { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() };

                                // Sync balance if link is new or changed
                                if (data.linkedAccountId && (!currentGoal || currentGoal.linkedAccountId !== data.linkedAccountId)) {
                                    const acc = accountsList.find((a: any) => a.id === data.linkedAccountId) as any;
                                    if (acc) updateData.currentAmount = acc.balance;
                                }

                                if (data.deadline) updateData.deadline = admin.firestore.Timestamp.fromDate(new Date(data.deadline));
                                await db.collection('goals').doc(goalId).update(updateData);
                                return { success: true };
                            }
                            return { error: 'Ação inválida ou ID ausente.' };
                        } catch (e: any) { return { error: `Erro ao gerenciar meta: ${e.message}` }; }
                    }
                }),
                transferBalance: tool({
                    description: 'Realiza uma transferência de valores entre duas contas bancárias.',
                    inputSchema: z.object({
                        sourceAccountId: z.string().describe('ID da conta de origem (onde sai o dinheiro).'),
                        targetAccountId: z.string().describe('ID da conta de destino (onde entra o dinheiro).'),
                        amount: z.number().describe('Valor da transferência.'),
                        description: z.string().optional().describe('Descrição da transferência.'),
                    }),
                    execute: async ({ sourceAccountId, targetAccountId, amount, description = 'Transferência entre contas' }) => {
                        console.log(`[Assistant] Tool: transferBalance, from: ${sourceAccountId}, to: ${targetAccountId}, val: ${amount}`);
                        try {
                            const sourceAcc = accountsList.find((a: any) => a.id === sourceAccountId) as any;
                            const targetAcc = accountsList.find((a: any) => a.id === targetAccountId) as any;

                            if (!sourceAcc || !targetAcc) throw new Error('Conta de origem ou destino não encontrada.');
                            if (sourceAccountId === targetAccountId) throw new Error('A conta de destino deve ser diferente da origem.');
                            if ((sourceAcc as any).balance < amount) throw new Error(`Saldo insuficiente na conta ${(sourceAcc as any).name}. Disponível: R$ ${((sourceAcc as any).balance || 0).toFixed(2)}.`);

                            const now = new Date();
                            const batch = db.batch();

                            // 1. Débito na origem
                            const sourceTxRef = db.collection('transactions').doc();
                            batch.set(sourceTxRef, {
                                userId,
                                type: 'despesa',
                                description: `Transferência para: ${targetAcc.name}${description ? ' - ' + description : ''}`,
                                amount,
                                category: 'Transferência',
                                date: admin.firestore.Timestamp.fromDate(now),
                                paymentMethod: 'debit',
                                accountId: sourceAccountId,
                                createdAt: admin.firestore.FieldValue.serverTimestamp()
                            });

                            // 2. Crédito no destino
                            const targetTxRef = db.collection('transactions').doc();
                            batch.set(targetTxRef, {
                                userId,
                                type: 'receita',
                                description: `Recebido de: ${sourceAcc.name}${description ? ' - ' + description : ''}`,
                                amount,
                                category: 'Transferência',
                                date: admin.firestore.Timestamp.fromDate(now),
                                paymentMethod: 'debit',
                                accountId: targetAccountId,
                                createdAt: admin.firestore.FieldValue.serverTimestamp()
                            });

                            // 3. Atualizar saldos
                            batch.update(db.collection('accounts').doc(sourceAccountId), {
                                balance: admin.firestore.FieldValue.increment(-amount),
                                updatedAt: admin.firestore.FieldValue.serverTimestamp()
                            });
                            batch.update(db.collection('accounts').doc(targetAccountId), {
                                balance: admin.firestore.FieldValue.increment(amount),
                                updatedAt: admin.firestore.FieldValue.serverTimestamp()
                            });

                            // 4. Sincronizar Metas em AMBAS as contas (débito na origem, crédito no destino)
                            await syncGoalCurrentAmount(sourceAccountId, -amount, batch);
                            await syncGoalCurrentAmount(targetAccountId, amount, batch);

                            await batch.commit();
                            return { success: true };
                        } catch (e: any) {
                            console.error('[Assistant] transferBalance error:', e);
                            return { error: e.message || 'Erro ao processar transferência.' };
                        }
                    }
                }),
                managePerson: tool({
                    description: 'Cria, edita ou exclui pessoas (membros da família).',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete']).describe('Ação a ser realizada.'),
                        personId: z.string().optional().describe('ID da pessoa (obrigatório para update e delete).'),
                        data: z.object({
                            name: z.string().optional().describe('Nome da pessoa.'),
                        }).optional(),
                    }),
                    execute: async ({ action, personId, data }) => {
                        console.log(`[Assistant] Tool: managePerson, action: ${action}`);
                        try {
                            if (action === 'create' && data) {
                                await db.collection('people').add({ ...data, userId, createdAt: admin.firestore.FieldValue.serverTimestamp() });
                                return { success: true, name: data.name };
                            }
                            if (action === 'delete') {
                                if (!personId) return { error: 'FALHA: personId é obrigatório para excluir. Busque o ID no INTERNAL ID MAPPING.' };
                                await db.collection('people').doc(personId).delete();
                                return { success: true, message: 'Pessoa excluída com sucesso.' };
                            }
                            if (action === 'update' && personId && data) {
                                await db.collection('people').doc(personId).update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                                return { success: true };
                            }
                            return { error: 'Ação inválida ou ID ausente.' };
                        } catch (e: any) { return { error: `Erro ao gerenciar pessoa: ${e.message}` }; }
                    }
                }),
                payInvoice: tool({
                    description: 'Registra o pagamento de uma fatura de cartão de crédito.',
                    inputSchema: z.object({
                        creditCardId: z.string(),
                        accountId: z.string(),
                        amount: z.number(),
                        month: z.number(),
                        year: z.number(),
                    }),
                    execute: async ({ creditCardId, accountId, amount, month, year }) => {
                        console.log(`[Assistant] Tool: payInvoice`);
                        try {
                            const card = cardsList.find((c: any) => c.id === creditCardId) as any;
                            const acc = accountsList.find((a: any) => a.id === accountId) as any;
                            if (!card || !acc) return { error: 'Conta ou Cartão não encontrados.' };

                            // 1. Encontrar a fatura
                            const invSnap = await db.collection('invoices')
                                .where('userId', '==', userId)
                                .where('creditCardId', '==', creditCardId)
                                .where('month', '==', month)
                                .where('year', '==', year)
                                .limit(1)
                                .get();

                            if (invSnap.empty) return { error: 'Fatura não encontrada.' };
                            const invoiceId = invSnap.docs[0].id;

                            // 2. Criar transação de pagamento
                            await db.collection('transactions').add({
                                userId,
                                type: 'despesa',
                                description: `Pagamento Fatura ${card.name} - ${month}/${year}`,
                                amount,
                                category: 'Cartão de Crédito',
                                date: admin.firestore.Timestamp.fromDate(new Date()),
                                paymentMethod: 'debit',
                                accountId: accountId,
                                createdAt: admin.firestore.FieldValue.serverTimestamp()
                            });

                            // 3. Atualizar saldo da conta
                            await db.collection('accounts').doc(accountId).update({
                                balance: admin.firestore.FieldValue.increment(-amount),
                                updatedAt: admin.firestore.FieldValue.serverTimestamp()
                            });

                            // 4. Marcar fatura como paga
                            await db.collection('invoices').doc(invoiceId).update({
                                status: 'paid',
                                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                                paidFromAccountId: accountId
                            });

                            return { success: true };
                        } catch (e) { return { error: 'Erro ao processar pagamento de fatura.' }; }
                    }
                }),
                searchTransactions: tool({
                    description: 'Busca transações no histórico com filtros por palavra-chave, categoria, tipo ou período. Use para responder perguntas como "quanto gastei em X?", "quais foram meus lançamentos em Y?", "encontre a transação Z".',
                    inputSchema: z.object({
                        keyword: z.string().optional().describe('Palavra-chave na descrição (busca parcial, case-insensitive).'),
                        category: z.string().optional().describe('Categoria específica.'),
                        type: z.enum(['receita', 'despesa']).optional().describe('Tipo de transação.'),
                        month: z.number().optional().describe('Mês (1-12).'),
                        year: z.number().optional().describe('Ano (ex: 2026).'),
                        limit: z.number().optional().default(10).describe('Máximo de resultados (padrão: 10).'),
                    }),
                    execute: async ({ keyword, category, type, month, year, limit = 10 }) => {
                        console.log(`[Assistant] Tool: searchTransactions`);
                        try {
                            let q: any = db.collection('transactions').where('userId', '==', userId).orderBy('date', 'desc').limit(300);
                            if (type) q = db.collection('transactions').where('userId', '==', userId).where('type', '==', type).orderBy('date', 'desc').limit(300);

                            const snap = await q.get();
                            let results = snap.docs
                                .filter((doc: any) => doc.data().deleted !== true)
                                .map((doc: any) => {
                                    const d = doc.data() as any;
                                    return {
                                        id: doc.id,
                                        description: d.description,
                                        amount: d.amount,
                                        type: d.type,
                                        category: d.category,
                                        paymentMethod: d.paymentMethod,
                                        date: d.date?.toDate?.()?.toLocaleDateString('pt-BR') || '',
                                        dateRaw: d.date?.toDate?.() || null,
                                        accountId: d.accountId,
                                    };
                                });

                            if (category) results = results.filter((r: any) => r.category?.toLowerCase() === category.toLowerCase());
                            if (month && year) results = results.filter((r: any) => {
                                if (!r.dateRaw) return false;
                                return r.dateRaw.getMonth() + 1 === month && r.dateRaw.getFullYear() === year;
                            });
                            if (keyword) {
                                const kw = keyword.toLowerCase();
                                results = results.filter((r: any) => r.description?.toLowerCase().includes(kw) || r.category?.toLowerCase().includes(kw));
                            }

                            const sliced = results.slice(0, limit).map((r: any) => { const { dateRaw, ...rest } = r; return rest; });
                            return { success: true, count: sliced.length, transactions: sliced };
                        } catch (e: any) {
                            return { error: `Erro ao buscar transações: ${e.message}` };
                        }
                    }
                }),
                editTransaction: tool({
                    description: 'Edita um lançamento existente. Ajusta o saldo da conta automaticamente se o valor mudar. Use para corrigir descrição, valor, categoria ou data.',
                    inputSchema: z.object({
                        transactionId: z.string().describe('ID da transação a editar. Use searchTransactions para encontrá-la.'),
                        data: z.object({
                            description: z.string().optional().describe('Nova descrição.'),
                            amount: z.number().optional().describe('Novo valor.'),
                            category: z.string().optional().describe('Nova categoria.'),
                            date: z.string().optional().describe('Nova data no formato YYYY-MM-DD.'),
                        })
                    }),
                    execute: async ({ transactionId, data }) => {
                        console.log(`[Assistant] Tool: editTransaction, id: ${transactionId}`);
                        try {
                            await db.runTransaction(async (txn) => {
                                const txRef = db.collection('transactions').doc(transactionId);
                                const txSnap = await txn.get(txRef);
                                if (!txSnap.exists) throw new Error('Transação não encontrada.');

                                const old = txSnap.data() as any;
                                const newAmount = data.amount ?? old.amount;

                                const balanceImpact = (type: string, paymentMethod: string, boletoStatus: string, amount: number): number => {
                                    if (type === 'receita') return amount;
                                    if (type === 'despesa') {
                                        const isDebit = paymentMethod === 'debit' || paymentMethod === 'pix';
                                        const isPaidBoleto = paymentMethod === 'boleto' && boletoStatus === 'paid';
                                        if (isDebit || isPaidBoleto) return -amount;
                                    }
                                    return 0;
                                };

                                if (data.amount !== undefined && old.accountId) {
                                    const oldImpact = balanceImpact(old.type, old.paymentMethod, old.boletoStatus, old.amount);
                                    const newImpact = balanceImpact(old.type, old.paymentMethod, old.boletoStatus, newAmount);
                                    const delta = newImpact - oldImpact;
                                    if (delta !== 0) {
                                        const accRef = db.collection('accounts').doc(old.accountId);
                                        txn.update(accRef, { balance: admin.firestore.FieldValue.increment(delta), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                                    }
                                }

                                const updateData: any = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
                                if (data.description) updateData.description = data.description;
                                if (data.amount !== undefined) updateData.amount = data.amount;
                                if (data.category) updateData.category = data.category;
                                if (data.date) {
                                    const [y, m, d] = data.date.split('-').map(Number);
                                    updateData.date = admin.firestore.Timestamp.fromDate(new Date(y, m - 1, d, 12, 0, 0));
                                }
                                txn.update(txRef, updateData);
                            });
                            return { success: true };
                        } catch (e: any) {
                            return { error: `Erro ao editar transação: ${e.message}` };
                        }
                    }
                }),
                deleteTransaction: tool({
                    description: 'Exclui (soft delete) um lançamento e reverte automaticamente o impacto no saldo da conta. Use apenas após confirmação explícita do usuário.',
                    inputSchema: z.object({
                        transactionId: z.string().describe('ID da transação a excluir. Use searchTransactions para encontrá-la.'),
                    }),
                    execute: async ({ transactionId }) => {
                        console.log(`[Assistant] Tool: deleteTransaction, id: ${transactionId}`);
                        try {
                            await db.runTransaction(async (txn) => {
                                const txRef = db.collection('transactions').doc(transactionId);
                                const txSnap = await txn.get(txRef);
                                if (!txSnap.exists) throw new Error('Transação não encontrada.');
                                const txData = txSnap.data() as any;
                                if (txData.deleted) throw new Error('Transação já foi excluída.');

                                if (txData.accountId) {
                                    const accRef = db.collection('accounts').doc(txData.accountId);
                                    const accSnap = await txn.get(accRef);
                                    if (accSnap.exists) {
                                        let balanceChange = 0;
                                        if (txData.type === 'receita') balanceChange = -txData.amount;
                                        else if (txData.type === 'despesa') {
                                            const isDebit = txData.paymentMethod === 'debit' || txData.paymentMethod === 'pix';
                                            const isPaidBoleto = txData.paymentMethod === 'boleto' && txData.boletoStatus === 'paid';
                                            if (isDebit || isPaidBoleto) balanceChange = txData.amount;
                                        }
                                        if (balanceChange !== 0) {
                                            txn.update(accRef, { balance: admin.firestore.FieldValue.increment(balanceChange), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                                        }
                                    }
                                }
                                txn.update(txRef, { deleted: true, deletedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                            });
                            return { success: true };
                        } catch (e: any) {
                            return { error: `Erro ao excluir transação: ${e.message}` };
                        }
                    }
                }),
                confirmRecurring: tool({
                    description: 'Confirma o pagamento ou recebimento de uma transação fixa/recorrente para o mês atual. Cria o lançamento e atualiza o saldo atomicamente.',
                    inputSchema: z.object({
                        recurringId: z.string().describe('ID da regra recorrente. Consulte "Regras Recorrentes" no contexto.'),
                        actualAmount: z.number().optional().describe('Valor real pago/recebido, se diferente do valor padrão da regra.'),
                        accountId: z.string().optional().describe('ID da conta a usar, se diferente da conta padrão da regra.'),
                    }),
                    execute: async ({ recurringId, actualAmount, accountId }) => {
                        console.log(`[Assistant] Tool: confirmRecurring, id: ${recurringId}`);
                        try {
                            const recRef = db.collection('recurring_transactions').doc(recurringId);

                            const result = await db.runTransaction(async (txn) => {
                                const recSnap = await txn.get(recRef);
                                if (!recSnap.exists) throw new Error('Regra recorrente não encontrada.');
                                const rec = recSnap.data() as any;

                                // Idempotency check
                                if (rec.lastProcessedDate) {
                                    const lastDate = rec.lastProcessedDate.toDate ? rec.lastProcessedDate.toDate() : new Date(rec.lastProcessedDate);
                                    if (lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear()) {
                                        throw new Error('Esta transação já foi confirmada este mês.');
                                    }
                                }

                                const amount = actualAmount ?? rec.amount;
                                const finalAccountId = accountId ?? rec.accountId;

                                const newTxRef = db.collection('transactions').doc();
                                const txData: any = {
                                    userId,
                                    type: rec.type,
                                    amount,
                                    category: rec.category,
                                    description: rec.description,
                                    date: admin.firestore.Timestamp.fromDate(now),
                                    paymentMethod: rec.paymentMethod || 'debit',
                                    isRecurring: true,
                                    recurringTransactionId: recurringId,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                };
                                if (finalAccountId) txData.accountId = finalAccountId;
                                if (rec.personId) txData.personId = rec.personId;

                                txn.set(newTxRef, txData);

                                if (finalAccountId) {
                                    const accRef = db.collection('accounts').doc(finalAccountId);
                                    const inc = rec.type === 'receita' ? amount : -amount;
                                    txn.update(accRef, { balance: admin.firestore.FieldValue.increment(inc), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                                }

                                txn.update(recRef, { lastProcessedDate: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });

                                return { description: rec.description, amount };
                            });

                            return { success: true, ...result };
                        } catch (e: any) {
                            return { error: `Erro ao confirmar recorrente: ${e.message}` };
                        }
                    }
                }),
                manageRecurring: tool({
                    description: 'Gerencia regras de gastos fixos/recorrentes. Use APENAS para criar/editar regras mensais automáticas. NUNCA use para registrar um salário recebido hoje (para isso, use prepareTransaction ou executeSave).',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete', 'list']).describe('Ação a ser realizada na regra recorrente.'),
                        recurringId: z.string().optional().describe('ID da regra recorrente (obrigatório para update e delete). Consulte o ID em "Regras Recorrentes" no contexto.'),
                        data: z.object({
                            description: z.string().optional(),
                            amount: z.number().optional(),
                            type: z.enum(['receita', 'despesa']).optional(),
                            category: z.string().optional(),
                            day: z.number().optional(),
                            paymentMethod: z.enum(['debit', 'pix', 'credit', 'boleto', 'transfer', 'deposit']).optional(),
                            accountId: z.string().optional(),
                            creditCardId: z.string().optional(),
                            personId: z.string().optional(),
                            active: z.boolean().optional(),
                        }).optional()
                    }),
                    execute: async ({ action, recurringId, data }) => {
                        console.error(`[Assistant] DEBUG manageRecurring: action=${action}, id=${recurringId}, data=${JSON.stringify(data)}`);
                        try {
                            fs.appendFileSync('assistant_actions.log', `[${new Date().toISOString()}] manageRecurring: action=${action}, id=${recurringId}, data=${JSON.stringify(data)}\n`);
                        } catch (e) { }
                        try {
                            if (action === 'list') {
                                const snap = await db.collection('recurring_transactions').where('userId', '==', userId).get();
                                return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                            }
                            if (action === 'create' && data) {
                                await db.collection('recurring_transactions').add({
                                    ...data, userId,
                                    active: true,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { success: true, description: data.description };
                            }
                            if (action === 'update' && recurringId && data) {
                                await db.collection('recurring_transactions').doc(recurringId).update({
                                    ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { success: true };
                            }
                            if (action === 'delete') {
                                if (!recurringId) return { error: 'FALHA: recurringId é obrigatório para excluir uma regra recorrente. Busque o ID no INTERNAL ID MAPPING.' };
                                await db.collection('recurring_transactions').doc(recurringId).delete();
                                return { success: true, message: 'Regra recorrente excluída com sucesso.' };
                            }
                            return { error: 'Ação inválida ou dados ausentes.' };
                        } catch (e) { return { error: 'Erro ao gerenciar recorrência.' }; }
                    }
                })
            }
        });

        return result.toUIMessageStreamResponse();
    } catch (error: any) {
        console.error('[Assistant] CRITICAL ERROR:', error);

        try {
            fs.appendFileSync('assistant_error.log', `[${new Date().toISOString()}] ${error.message}\n${error.stack}\n\n`);
        } catch (e) { }

        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
