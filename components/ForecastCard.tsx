"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurring } from "@/hooks/useRecurring";
import { useAuth } from "@/contexts/AuthContext";
import { getCreditCards, getNextInvoice } from "@/lib/creditCards";
import { addMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

interface ForecastCardProps {
    className?: string;
    compact?: boolean;
}

export function ForecastCard({ className, compact }: ForecastCardProps) {
    const { transactions } = useTransactions();
    const { recurring } = useRecurring();
    const { user } = useAuth();
    const [forecast, setForecast] = useState({
        income: 0,
        expenses: 0,
        balance: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateForecast = async () => {
            if (!user?.uid) return;

            // 1. Receitas Fixas (Baseado nas regras de recorrência ativas)
            const fixedIncome = recurring
                .filter(t => t.type === 'receita' && t.active)
                .reduce((acc, t) => acc + t.amount, 0);

            // 2. Despesas Fixas (Baseado nas regras de recorrência ativas)
            // NOTA: Excluir recorrências no cartão, pois já estão nas faturas
            const fixedExpenses = recurring
                .filter(t => t.type === 'despesa' && t.active && t.paymentMethod !== 'credit')
                .reduce((acc, t) => acc + t.amount, 0);

            // 3. Boletos Parcelados / Futuros do Próximo Mês
            const nextMonthDate = addMonths(new Date(), 1);
            const startNextMonth = startOfMonth(nextMonthDate);
            const endNextMonth = endOfMonth(nextMonthDate);

            const futureBoletos = transactions
                .filter(t => {
                    if (t.type !== 'despesa' || t.paymentMethod !== 'boleto' || t.boletoStatus !== 'pending') return false;

                    // Verificar se vence no próximo mês
                    const dueDate = t.boletoDueDate ? new Date(t.boletoDueDate) : (t.date ? new Date(t.date) : null);
                    if (!dueDate) return false;

                    return isWithinInterval(dueDate, { start: startNextMonth, end: endNextMonth });
                })
                .reduce((acc, t) => acc + t.amount, 0);

            // 4. Faturas de Cartão do Próximo Mês
            let creditCardExpenses = 0;
            try {
                const cards = await getCreditCards(user.uid);
                for (const card of cards) {
                    const nextInvoice = await getNextInvoice(card.id, user.uid);
                    if (nextInvoice) {
                        creditCardExpenses += nextInvoice.totalAmount;
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar faturas futuras:", error);
            }

            setForecast({
                income: fixedIncome,
                expenses: fixedExpenses + creditCardExpenses + futureBoletos,
                balance: fixedIncome - (fixedExpenses + creditCardExpenses + futureBoletos)
            });
            setLoading(false);
        };

        calculateForecast();
    }, [transactions, recurring, user?.uid]);

    if (compact) {
        return (
            <Card className={cn("bg-gradient-to-br from-slate-700 to-slate-900 border-none text-white shadow-lg shadow-slate-500/20", className)}>
                <CardContent className="p-3 md:pt-6">
                    <div className="flex items-center justify-between">
                        <div className="w-full">
                            <p className="text-[10px] md:text-sm text-white/80 font-medium">Previsão Próximo Mês</p>
                            {loading ? (
                                <Skeleton className="h-5 md:h-8 w-20 md:w-32 bg-white/20 mt-1" />
                            ) : (
                                <p className={cn("text-base md:text-2xl font-bold mt-0.5 md:mt-1", forecast.balance >= 0 ? "text-emerald-400" : "text-red-400")}>
                                    {formatCurrency(forecast.balance)}
                                </p>
                            )}

                            {loading ? (
                                <div className="hidden md:flex items-center gap-2 mt-1">
                                    <Skeleton className="h-3 w-16 bg-white/20" />
                                    <Skeleton className="h-3 w-16 bg-white/20" />
                                </div>
                            ) : (
                                <div className="hidden md:flex items-center gap-2 mt-1 text-xs">
                                    <span className="flex items-center text-emerald-400 font-medium">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        {formatCurrency(forecast.income)}
                                    </span>
                                    <span className="flex items-center text-red-400 font-medium">
                                        <TrendingDown className="w-3 h-3 mr-1" />
                                        {formatCurrency(forecast.expenses)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center self-start shrink-0">
                            <Calendar className="w-4 h-4 md:w-6 md:h-6 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (loading) return <div className={cn("h-[200px] bg-muted/50 rounded-xl animate-pulse border border-border", className)} />;

    return (
        <Card className={cn("h-full flex flex-col overflow-hidden min-w-0 w-full border border-emerald-500/40 dark:border-white/10 bg-gradient-to-b from-card to-muted/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.2)] transition-all duration-300 group", className)}>
            {/* Top Glow Line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />

            <CardHeader className="pb-2 pt-5 px-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full" />
                        <div className="relative p-2 rounded-xl bg-card border border-emerald-100/10 shadow-sm ring-1 ring-emerald-500/10">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
                            Previsão
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            Próximo Mês
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-5 pt-2 relative z-10">
                <div className="space-y-5">
                    {/* Saldo em Destaque */}
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium">Saldo Estimado</span>
                        <span className={cn("text-2xl font-bold tracking-tight", forecast.balance >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                            {formatCurrency(forecast.balance)}
                        </span>
                    </div>

                    {/* Barras de Comparação */}
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Receitas</span>
                                <span className="text-emerald-600 font-bold">{formatCurrency(forecast.income)}</span>
                            </div>
                            <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Despesas</span>
                                <span className="text-red-600 font-bold">{formatCurrency(forecast.expenses)}</span>
                            </div>
                            <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full"
                                    style={{ width: `${Math.min((forecast.expenses / (forecast.income || 1)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
