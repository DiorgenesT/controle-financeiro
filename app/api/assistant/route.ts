import { openai } from '@ai-sdk/openai';
import { ToolLoopAgent, createAgentUIStreamResponse, tool } from 'ai';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { headers } from 'next/headers';
import { z } from 'zod';

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
};

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

        const [userDoc, accountsList, cardsList, catsList, goalsList, peopleList] = await Promise.all([
            db.collection('users').doc(userId).get().catch(() => null),
            fetchSafe('accounts'),
            fetchSafe('creditCards'),
            fetchSafe('categories'),
            fetchSafe('goals'),
            fetchSafe('people'),
        ]);

        const userName = (userDoc as any)?.data()?.displayName?.split(' ')[0] || 'Usuário';

        const now = new Date();
        const accountsStr = accountsList.map((a: any) => a.name + ' (' + (a.type === 'crypto' || a.name.toLowerCase().includes('btc') ? 'Digital/Crypto' : 'Bancária') + ') - R$ ' + a.balance).join(', ') || 'Nenhuma';
        const cardsStr = cardsList.map((c: any) => c.name).join(', ') || 'Nenhum';
        const catsStr = catsList.map((c: any) => c.name).join(', ');
        const goalsStr = goalsList.map((g: any) => g.description + ' (R$ ' + g.currentAmount + '/' + g.targetAmount + ')').join(', ') || 'Nenhuma';
        const peopleStr = peopleList.map((p: any) => p.name).join(', ') || 'Ninguém (Apenas Família)';

        const idMappingStr = [
            '- Contas: ' + accountsList.map((a: any) => a.name + ': ' + a.id).join(' | '),
            '- Cartões: ' + cardsList.map((c: any) => c.name + ': ' + c.id).join(' | '),
            '- Metas: ' + goalsList.map((g: any) => g.description + ': ' + g.id).join(' | '),
            '- Categorias: ' + catsList.map((c: any) => c.name + ': ' + c.id).join(' | '),
            '- Pessoas: ' + peopleList.map((p: any) => p.name + ': ' + p.id).join(' | ')
        ].join('\n');

        const systemPrompt = `DATA ATUAL: ${now.toLocaleDateString('pt-BR')} (Hoje é dia ${now.getDate()} de Março de 2026).

⚠️ REGRAS CRÍTICAS DE SEGURANÇA, INTELIGÊNCIA E VOZ (MANDATÓRIO):
1. **PROTOCOLO DE LANÇAMENTO EM DOIS TURNOS**:
   - **TURNO 1 (PREPARO)**: Use 'prepareTransaction' ou 'manageTransactions(action: "prepare")'. Responda com um resumo EXTREMAMENTE conciso e PARE.
   - **TURNO 2 (EXECUÇÃO)**: Após "Sim/Ok", chame 'executeSave' ou 'manageTransactions(action: "execute")' e finalize com "✅ Lançamento realizado!". **PROIBIDO** perguntar de novo ou pedir mais dados se já preparou.

2. **INTELIGÊNCIA TOTAL E ALMA BRASILEIRA (PREMIUM NARRATIVE)**:
   - **Sua Essência**: Você é um **Assistente** brasileiro nato. NUNCA soe como um tradutor automático ou robótico.
   - **Linguagem Natural BR**: Converse de forma fluida e variada. Use inícios naturais (ex: "Claro,", "Com certeza,", "Entendi,", "No momento,").
   - **NARRATIVA EXPLICATIVA**: Ao apresentar números, seja claro e direto. O sistema cuidará da velocidade de fala para os valores financeiros.
   - **BANIMENTO DE INGLÊS**: Traduza todos os termos técnicos (ex: "ajuda", "resumo").
   - **REGRA DO ABSOLUTO EGO**: Sua prioridade é o contexto financeiro do usuário.
   - **PONTUAÇÃO**: Use pontuação padrão e fluida (.) e (,). Evite o uso de exclamações (!).
   - **TEXTO NO CHAT**: Use sempre o formato de moeda (**R$ 10.452,22**).

3. **SUCESSO ÚNICO (ZERO DUPLICIDADE)**:
   - As ferramentas são silenciosas. **VOCÊ É A ÚNICA VOZ** que confirma o sucesso.
   - Responda apenas: "✅ Lançamento realizado!" (ou similar) após ações de ferramenta. 
   - Seja executivo e não adicione frases de "Se precisar de algo mais" em confirmações simples.

CONTEXTO ATUAL:
- Contas: ${accountsStr}
- Cartões: ${cardsStr}
- Categorias: ${catsStr}
- Metas: ${goalsStr}
- Pessoas: ${peopleStr}

INTERNAL ID MAPPING (NUNCA MOSTRAR IDs):
${idMappingStr}

INSTRUÇÕES DE FERRAMENTAS:
- 'prepareTransaction': PREPARA um lançamento único. Use sempre como 1º passo.
- 'executeSave': PERSISTE um lançamento único. Use APENAS após confirmação do usuário.
- 'manageTransactions': Multi-ferramenta. Use 'prepare' para lote inicial e 'execute' para o 'Sim' do usuário.
- 'payInvoice': Para pagar faturas de cartão.
- 'manageRecurring': Para regras de gastos fixos mestre.
`;

        const body = await req.json().catch(e => {
            console.error('[Assistant] Failed to parse request body:', e);
            return null;
        });
        if (!body) return new Response('Invalid request body', { status: 400 });

        const { messages } = body;
        console.log(`[Assistant] User: ${userId}, Messages: ${messages?.length}`);

        const { streamText, convertToModelMessages, tool, stepCountIs } = await import('ai');
        const modelMessages = await convertToModelMessages(messages);

        const executeTransactionSave = async (params: any) => {
            const now = new Date();
            // ZERO-TRUST SANITIZATION: Derive isRecurring solely from installments
            const isFixed = params.installments === 'fixed';

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
                isRecurring: isFixed, // FORCED logic
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

                if (params.installments === 'fixed') {
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
            } else if (params.paymentMethod === 'boleto') {
                const tx: any = { ...baseTx, date: admin.firestore.Timestamp.fromDate(now), boletoStatus: 'pending' };
                if (params.dueDate) {
                    const [y, m, d] = params.dueDate.split('-').map(Number);
                    tx.date = admin.firestore.Timestamp.fromDate(new Date(y, m - 1, d, 12, 0, 0));
                    tx.boletoDueDate = tx.date;
                }
                if (params.installments === 'fixed') {
                    tx.isRecurring = true;
                    await db.collection('recurring_transactions').add({
                        userId, type: params.type, description: params.description, amount: params.amount,
                        category: params.category, day: now.getDate(), active: true,
                        paymentMethod: 'boleto', lastProcessedDate: admin.firestore.Timestamp.fromDate(now),
                        createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
                await db.collection('transactions').add(tx);
            } else if (params.paymentMethod === 'debit' || params.paymentMethod === 'pix') {
                if (!params.accountId) {
                    throw new Error("⚠️ Conta bancária não especificada para Débito/Pix.");
                }
                const acc: any = accountsList.find((a: any) => a.id === params.accountId);
                if (!acc) throw new Error(`⚠️ Conta '${params.accountId}' não encontrada.`);

                const inc = params.type === 'receita' ? params.amount : -params.amount;
                await db.collection('accounts').doc(params.accountId).update({
                    balance: admin.firestore.FieldValue.increment(inc),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                const tx: any = { ...baseTx, date: admin.firestore.Timestamp.fromDate(now) };
                if (params.installments === 'fixed') {
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
            } else {
                throw new Error(`⚠️ Meio de pagamento '${params.paymentMethod}' não suportado ou incompleto.`);
            }
        };

        const result = await streamText({
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
                                const fs = await import('fs');
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
                        paymentMethod: z.enum(['debit', 'pix', 'credit_card', 'boleto']),
                        accountId: z.string().optional().describe('Conta bancária.'),
                        creditCardId: z.string().optional().describe('Cartão de crédito.'),
                        installments: z.union([z.number(), z.string()]).default(1).describe('Parcelas ou "fixed".'),
                        isRecurring: z.boolean().default(false),
                        personId: z.string().optional().describe('ID da pessoa. Use sempre "family" se não houver um nome no pedido.'),
                        dueDate: z.string().optional().describe('Data de vencimento (YYYY-MM-DD) para boletos'),
                    }),
                    execute: async (params) => {
                        console.log(`[Assistant] Tool: addTransaction`);
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
                                await db.collection('transactions').doc(transactionId).delete();
                                return { message: '🗑️ Transação removida.' };
                            }
                            if (action === 'create' && data) {
                                await executeTransactionSave(data);
                                return { message: '✅ Lançamento realizado!' };
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
                            paymentMethod: z.enum(['debit', 'pix', 'credit_card', 'boleto']),
                            accountId: z.string().optional(),
                            creditCardId: z.string().optional(),
                            installments: z.union([z.number(), z.string()]).default(1),
                            isRecurring: z.boolean().default(false),
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
                                return {
                                    message: `✅ ${successCount > 1 ? 'Lançamentos realizados' : 'Lançamento realizado'} com sucesso!`
                                };
                            }
                            return { error: 'Ação não suportada.' };
                        } catch (e: any) {
                            console.error('[Assistant] manageTransactions error:', e);
                            return { error: e.message || 'Erro ao processar lote.' };
                        }
                    }
                }),
                manageAccount: tool({
                    description: 'Cria, edita ou exclui contas bancárias.',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete']),
                        accountId: z.string().optional(),
                        data: z.object({
                            bankCode: z.string().optional().describe('Código do banco (ex: nubank, itau, inter)'),
                            name: z.string().optional(),
                            type: z.string().optional().describe('Default: checking'),
                            balance: z.number().optional(),
                            color: z.string().optional(),
                            icon: z.string().optional(),
                            isDefault: z.boolean().optional(),
                        }).optional(),
                    }),
                    execute: async ({ action, accountId, data }) => {
                        console.log(`[Assistant] Tool: manageAccount, action: ${action}`);
                        try {
                            if (action === 'create' && data) {
                                // Apply bank defaults if applicable
                                let finalData = { ...data, type: data.type || 'checking' };
                                if (data.bankCode && BANK_DEFAULTS[data.bankCode]) {
                                    const defaults = BANK_DEFAULTS[data.bankCode];
                                    finalData.name = data.name || defaults.name;
                                    finalData.color = data.color || defaults.color;
                                    finalData.icon = data.icon || defaults.icon;
                                }

                                const res = await db.collection('accounts').add({
                                    ...finalData, userId,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { message: `✅ Conta '${finalData.name}' criada com sucesso!` };
                            }
                            if (action === 'update' && accountId && data) {
                                await db.collection('accounts').doc(accountId).update({
                                    ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { message: `✅ Conta atualizada!` };
                            }
                            if (action === 'delete' && accountId) {
                                await db.collection('accounts').doc(accountId).delete();
                                return { message: '🗑️ Conta excluída.' };
                            }
                            return { error: 'Parâmetros inválidos.' };
                        } catch (e) { return { error: 'Erro ao gerenciar conta.' }; }
                    }
                }),
                manageCategory: tool({
                    description: 'Cria, edita ou exclui categorias.',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete']),
                        categoryId: z.string().optional(),
                        data: z.object({
                            name: z.string().optional(),
                            type: z.enum(['receita', 'despesa']).optional(),
                            color: z.string().optional(),
                            icon: z.string().optional(),
                        }).optional()
                    }),
                    execute: async ({ action, categoryId, data }) => {
                        console.log(`[Assistant] Tool: manageCategory, action: ${action}`);
                        try {
                            if (action === 'create' && data) {
                                // Check if exists
                                const existing = catsList.find((c: any) => c.name.toLowerCase() === data.name?.toLowerCase());
                                if (existing) return { error: `A categoria '${data.name}' já existe.` };

                                const res = await db.collection('categories').add({
                                    ...data, userId,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { status: 'success', message: 'OK', id: res.id };
                            }
                            if (action === 'update' && categoryId && data) {
                                await db.collection('categories').doc(categoryId).update({
                                    ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { status: 'updated', message: 'OK' };
                            }
                            if (action === 'delete' && categoryId) {
                                await db.collection('categories').doc(categoryId).delete();
                                return { status: 'deleted', message: 'OK' };
                            }
                            return { error: 'Falha.' };
                        } catch (e) { return { error: 'Erro ao gerenciar categoria.' }; }
                    }
                }),
                manageCreditCard: tool({
                    description: 'Cria, edita ou exclui cartões de crédito.',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete']),
                        cardId: z.string().optional(),
                        data: z.object({
                            name: z.string().optional(),
                            limit: z.number().optional(),
                            closingDay: z.number().optional(),
                            dueDay: z.number().optional(),
                            color: z.string().optional(),
                            icon: z.string().optional(),
                        }).optional(),
                    }),
                    execute: async ({ action, cardId, data }) => {
                        console.log(`[Assistant] Tool: manageCreditCard, action: ${action}`);
                        try {
                            if (action === 'create' && data) {
                                const res = await db.collection('creditCards').add({ ...data, userId, createdAt: admin.firestore.FieldValue.serverTimestamp() });
                                return { status: 'success', message: 'OK', id: res.id };
                            }
                            if (action === 'update' && cardId && data) {
                                await db.collection('creditCards').doc(cardId).update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                                return { status: 'updated', message: 'OK' };
                            }
                            if (action === 'delete' && cardId) {
                                await db.collection('creditCards').doc(cardId).delete();
                                return { status: 'deleted', message: 'OK' };
                            }
                            return { error: 'Falha.' };
                        } catch (e) { return { error: 'Erro ao gerenciar cartão.' }; }
                    }
                }),
                manageGoal: tool({
                    description: 'Cria, edita ou exclui metas financeiras.',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete']),
                        goalId: z.string().optional(),
                        data: z.object({
                            title: z.string().optional().describe('Título curto da meta (ex: Viagem para Guarapari)'),
                            description: z.string().optional().describe('Descrição longa ou observações'),
                            targetAmount: z.number().optional(),
                            currentAmount: z.number().optional(),
                            deadline: z.string().optional().describe('Formato YYYY-MM-DD'),
                            category: z.string().optional(),
                            color: z.string().optional(),
                            icon: z.string().optional(),
                            linkedAccountId: z.string().optional().describe('ID da conta vinculada a esta meta'),
                        }).optional(),
                    }),
                    execute: async ({ action, goalId, data }) => {
                        console.log(`[Assistant] Tool: manageGoal, action: ${action}`);
                        try {
                            if (action === 'create' && data) {
                                const cleanData: any = { ...data, userId, createdAt: admin.firestore.FieldValue.serverTimestamp(), status: 'em_progresso' };
                                if (data.deadline) cleanData.deadline = admin.firestore.Timestamp.fromDate(new Date(data.deadline));
                                const res = await db.collection('goals').add(cleanData);
                                return { status: 'success', message: 'OK', id: res.id };
                            }
                            if (action === 'delete' && goalId) {
                                await db.collection('goals').doc(goalId).delete();
                                return { status: 'deleted', message: 'OK' };
                            }
                            if (action === 'update' && goalId && data) {
                                const updateData: any = { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
                                if (data.deadline) updateData.deadline = admin.firestore.Timestamp.fromDate(new Date(data.deadline));
                                await db.collection('goals').doc(goalId).update(updateData);
                                return { status: 'updated', message: 'OK' };
                            }
                            return { error: 'Falha.' };
                        } catch (e) { return { error: 'Erro ao gerenciar meta.' }; }
                    }
                }),
                managePerson: tool({
                    description: 'Cria, edita ou exclui pessoas (membros da família).',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete']),
                        personId: z.string().optional(),
                        data: z.object({
                            name: z.string().optional(),
                        }).optional(),
                    }),
                    execute: async ({ action, personId, data }) => {
                        console.log(`[Assistant] Tool: managePerson, action: ${action}`);
                        try {
                            if (action === 'create' && data) {
                                const res = await db.collection('people').add({ ...data, userId, createdAt: admin.firestore.FieldValue.serverTimestamp() });
                                return { message: `👤 Pessoa "${data.name}" cadastrada!` };
                            }
                            if (action === 'delete' && personId) {
                                await db.collection('people').doc(personId).delete();
                                return { message: '🗑️ Pessoa removida.' };
                            }
                            if (action === 'update' && personId && data) {
                                await db.collection('people').doc(personId).update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                                return { message: '👤 Dados atualizados.' };
                            }
                            return { error: 'Falha.' };
                        } catch (e) { return { error: 'Erro ao gerenciar pessoa.' }; }
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

                            return { message: `💳 Fatura de ${card.name} (${month}/${year}) paga com sucesso usando a conta ${acc.name}!` };
                        } catch (e) { return { error: 'Erro ao processar pagamento de fatura.' }; }
                    }
                }),
                manageRecurring: tool({
                    description: 'Gerencia regras de gastos fixos/recorrentes.',
                    inputSchema: z.object({
                        action: z.enum(['create', 'update', 'delete', 'list']),
                        recurringId: z.string().optional(),
                        data: z.object({
                            description: z.string().optional(),
                            amount: z.number().optional(),
                            type: z.enum(['receita', 'despesa']).optional(),
                            category: z.string().optional(),
                            day: z.number().optional(),
                            paymentMethod: z.enum(['debit', 'pix', 'credit', 'boleto']).optional(),
                            accountId: z.string().optional(),
                            creditCardId: z.string().optional(),
                            personId: z.string().optional(),
                            active: z.boolean().optional(),
                        }).optional()
                    }),
                    execute: async ({ action, recurringId, data }) => {
                        console.log(`[Assistant] Tool: manageRecurring, action: ${action}`);
                        try {
                            if (action === 'list') {
                                const snap = await db.collection('recurring_transactions').where('userId', '==', userId).get();
                                return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                            }
                            if (action === 'create' && data) {
                                const res = await db.collection('recurring_transactions').add({
                                    ...data, userId,
                                    active: true,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { message: `🔄 Regra fixa "${data.description}" criada!` };
                            }
                            if (action === 'update' && recurringId && data) {
                                await db.collection('recurring_transactions').doc(recurringId).update({
                                    ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { message: `🔄 Regra fixa atualizada.` };
                            }
                            if (action === 'delete' && recurringId) {
                                await db.collection('recurring_transactions').doc(recurringId).delete();
                                return { message: '🗑️ Regra fixa removida.' };
                            }
                            return { error: 'Ação inválida.' };
                        } catch (e) { return { error: 'Erro ao gerenciar recorrência.' }; }
                    }
                })
            }
        });

        return result.toUIMessageStreamResponse();
    } catch (error: any) {
        console.error('[Assistant] CRITICAL ERROR:', error);

        try {
            const fs = await import('fs');
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
