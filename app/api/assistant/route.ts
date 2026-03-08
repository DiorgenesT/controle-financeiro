import { openai } from '@ai-sdk/openai';
import { ToolLoopAgent, createAgentUIStreamResponse, tool } from 'ai';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { headers } from 'next/headers';
import { z } from 'zod';

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

        const [userDoc, accountsList, cardsList, catsList, goalsList] = await Promise.all([
            db.collection('users').doc(userId).get().catch(() => null),
            fetchSafe('accounts'),
            fetchSafe('creditCards'),
            fetchSafe('categories'),
            fetchSafe('goals'),
        ]);

        const userName = (userDoc as any)?.data()?.displayName?.split(' ')[0] || 'Usuário';

        const systemPrompt = `CONTEÚDO E PERSONA:
1. PERSONA: Você é um **Expert Financeiro de Alto Nível**. Não apenas registra dados, mas ANALISA e dá CONSELHOS inteligentes.
2. RESUMOS: Ao fazer um resumo (financeiro ou mensal), use o tool 'getFinancialAnalysis'. Organize a resposta em:
   - **Balanço Geral**: (Receitas - Despesas).
   - **Maiores Gastos**: Destaque as 3 principais categorias.
   - **Saúde Financeira**: Dê uma nota de 0 a 10 e um conselho prático.
   - **Ativos Digitais**: Se houver Crypto/BTC nas contas, mencione a performance/estado.
3. INDICADORES: Use 'getEconomicIndicators' para comparar os rendimentos ou gastos do usuário com a realidade do Brasil (Selic, Inflação).
4. DICAS: Toda interação de resumo DEVE terminar com uma "Dica de Expert" (ex: "Sua reserva renderia mais se estivesse em CDI").

CONTEXTO ATUAL:
- Contas: ${accountsList.map((a: any) => `${a.name} (${a.type === 'crypto' ? 'Digital/Crypto' : 'Bancária'}) - R$ ${a.balance}`).join(', ') || 'Nenhuma'}
- Cartões: ${cardsList.map((c: any) => c.name).join(', ') || 'Nenhum'}
- Categorias: ${catsList.map((c: any) => c.name).join(', ')}
- Metas: ${goalsList.map((g: any) => `${g.description} (R$ ${g.currentAmount}/${g.targetAmount})`).join(', ') || 'Nenhuma'}

INTERNAL ID MAPPING (NUNCA MOSTRAR - USE ESTES IDS NOS TOOLS):
- Contas: ${accountsList.map((a: any) => `${a.name}: ${a.id}`).join(' | ')}
- Cartões: ${cardsList.map((c: any) => `${c.name}: ${c.id}`).join(' | ')}
- Metas: ${goalsList.map((g: any) => `${g.description}: ${g.id}`).join(' | ')}
- Categorias: ${catsList.map((c: any) => `${c.name}: ${c.id}`).join(' | ')}

INSTRUÇÕES:
1. GASTOS/GANHOS: Use 'manageTransactions' para um ou mais itens. GARANTA que accountId ou creditCardId estejam corretos.
2. ENTIDADES: Você pode CRIAR, EDITAR ou EXCLUIR Contas, Cartões, Metas e Categorias usando os respectios tools.
3. PESQUISA: Se o usuário perguntar sobre algo antigo, use 'searchEntities'.
4. ANÁLISE: Para resumos e relatórios profundos, use 'getFinancialAnalysis'.
5. ECONOMIA: Para Selic/IPCA, use 'getEconomicIndicators'.
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
            const baseTx: any = { ...params, userId, createdAt: admin.firestore.FieldValue.serverTimestamp() };

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
            // AI SDK 6.0 uses stopWhen instead of maxSteps
            stopWhen: stepCountIs(10),
            tools: {
                getEconomicIndicators: tool({
                    description: 'Busca indicadores econômicos atuais do Brasil (Selic, IPCA, CDI).',
                    inputSchema: z.object({}),
                    execute: async () => {
                        console.log(`[Assistant] Tool: getEconomicIndicators`);
                        // Mock/Source data for Brazilian Indicators
                        return {
                            success: true,
                            indicators: {
                                selic: '11.25%',
                                cdi: '11.15%',
                                ipca_acumulado_12m: '4.51%',
                                igpm_acumulado_12m: '0.89%',
                                data_referencia: new Date().toLocaleDateString('pt-BR'),
                                fonte: 'Banco Central / IBGE'
                            }
                        };
                    }
                }),
                getFinancialAnalysis: tool({
                    description: 'Analisa finanças de um mês específico, calculando totais, categorias e saldos.',
                    inputSchema: z.object({
                        month: z.number().describe('Mês (1-12)'),
                        year: z.number().describe('Ano (ex: 2024)')
                    }),
                    execute: async ({ month, year }) => {
                        console.log(`[Assistant] Tool: getFinancialAnalysis, period: ${month}/${year}`);
                        try {
                            const start = new Date(year, month - 1, 1);
                            const end = new Date(year, month, 0, 23, 59, 59);

                            const txSnap = await db.collection('transactions')
                                .where('userId', '==', userId)
                                .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
                                .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
                                .get();

                            const transactions = txSnap.docs.map(doc => doc.data());

                            let totalRevenue = 0;
                            let totalExpenses = 0;
                            const categorySpending: Record<string, number> = {};

                            transactions.forEach(tx => {
                                const amount = tx.amount || 0;
                                if (tx.type === 'receita') {
                                    totalRevenue += amount;
                                } else {
                                    totalExpenses += amount;
                                    const cat = tx.category || 'Outros';
                                    categorySpending[cat] = (categorySpending[cat] || 0) + amount;
                                }
                            });

                            // Identify Crypto Assets if any
                            const cryptoAccounts = accountsList.filter((a: any) =>
                                a.type === 'crypto' || a.name.toLowerCase().includes('btc') || a.name.toLowerCase().includes('crypto')
                            );

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
                                digitalAssets: cryptoAccounts.map((a: any) => ({ name: a.name, balance: a.balance })),
                                transactionCount: transactions.length
                            };
                        } catch (e: any) {
                            console.error(`[Assistant] getFinancialAnalysis error:`, e);
                            return { error: 'Falha ao processar análise financeira.' };
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
                addTransaction: tool({
                    description: 'Prepara uma transação para confirmação.',
                    inputSchema: z.object({
                        description: z.string(),
                        amount: z.number(),
                        type: z.enum(['receita', 'despesa']),
                        category: z.string(),
                        paymentMethod: z.enum(['debit', 'pix', 'credit_card', 'boleto']),
                        accountId: z.string().optional(),
                        creditCardId: z.string().optional(),
                        installments: z.union([z.number(), z.string()]).optional(),
                        dueDate: z.string().optional(),
                    }),
                    execute: async (params) => {
                        console.log(`[Assistant] Tool: addTransaction`);
                        const msg = `Preparei o lançamento de ${params.type === 'receita' ? 'uma receita' : 'uma despesa'} de R$ ${params.amount} (${params.description}). Posso confirmar o cadastro?`;
                        return {
                            success: true,
                            action: 'requires_confirmation',
                            data: params,
                            message: msg
                        };
                    }
                }),
                saveTransaction: tool({
                    description: 'Salva ou remove transações.',
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
                    description: 'Prepara ou salva múltiplos lançamentos de uma vez.',
                    inputSchema: z.object({
                        action: z.enum(['prepare', 'execute']),
                        transactions: z.array(z.object({
                            description: z.string(),
                            amount: z.number(),
                            type: z.enum(['receita', 'despesa']),
                            category: z.string(),
                            paymentMethod: z.enum(['debit', 'pix', 'credit_card', 'boleto']),
                            accountId: z.string().optional(),
                            creditCardId: z.string().optional(),
                            installments: z.union([z.number(), z.string()]).optional(),
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
                                    return {
                                        ...tx,
                                        accountName: acc?.name,
                                        creditCardName: card?.name,
                                        categoryName: cat?.name || tx.category
                                    };
                                });

                                const msg = `Preparei ${transactions.length} lançamentos para você conferir. Posso confirmar todos?`;
                                return {
                                    success: true,
                                    action: 'requires_confirmation',
                                    transactions: enriched,
                                    message: msg
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
                                    message: `✅ ${successCount} lançamentos realizados com sucesso!${errors.length > 0 ? ` (Erros: ${errors.join(', ')})` : ''}`
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
                            name: z.string().optional(),
                            type: z.string().optional(),
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
                                const res = await db.collection('accounts').add({
                                    ...data, userId,
                                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { message: `✅ Conta '${data.name}' criada com sucesso! (ID: ${res.id})` };
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
                                return { message: `✅ Categoria '${data.name}' criada! (ID: ${res.id})` };
                            }
                            if (action === 'update' && categoryId && data) {
                                await db.collection('categories').doc(categoryId).update({
                                    ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                return { message: `✅ Categoria atualizada!` };
                            }
                            if (action === 'delete' && categoryId) {
                                await db.collection('categories').doc(categoryId).delete();
                                return { message: '🗑️ Categoria removida.' };
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
                                return { message: `💳 Cartão "${data.name}" cadastrado.`, id: res.id };
                            }
                            if (action === 'update' && cardId && data) {
                                await db.collection('creditCards').doc(cardId).update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                                return { message: '💳 Cartão atualizado.' };
                            }
                            if (action === 'delete' && cardId) {
                                await db.collection('creditCards').doc(cardId).delete();
                                return { message: '🗑️ Cartão excluído.' };
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
                            description: z.string().optional(),
                            targetAmount: z.number().optional(),
                            currentAmount: z.number().optional(),
                            deadline: z.string().optional(),
                            category: z.string().optional(),
                            color: z.string().optional(),
                            icon: z.string().optional(),
                        }).optional(),
                    }),
                    execute: async ({ action, goalId, data }) => {
                        console.log(`[Assistant] Tool: manageGoal, action: ${action}`);
                        try {
                            if (action === 'create' && data) {
                                const res = await db.collection('goals').add({ ...data, userId, createdAt: admin.firestore.FieldValue.serverTimestamp(), status: 'em_progresso' });
                                return { message: `🎯 Meta "${data.description}" criada.` };
                            }
                            if (action === 'delete' && goalId) {
                                await db.collection('goals').doc(goalId).delete();
                                return { message: '🗑️ Meta removida.' };
                            }
                            if (action === 'update' && goalId && data) {
                                await db.collection('goals').doc(goalId).update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                                return { message: '🎯 Meta atualizada.' };
                            }
                            return { error: 'Falha.' };
                        } catch (e) { return { error: 'Erro ao gerenciar meta.' }; }
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
