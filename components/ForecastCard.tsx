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
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="w-full">
                            <p className="text-sm text-white/80 font-medium">Previsão Próximo Mês</p>
                            {loading ? (
                                <Skeleton className="h-8 w-32 bg-white/20 mt-1" />
                            ) : (
                                <p className={cn("text-2xl font-bold mt-1", forecast.balance >= 0 ? "text-emerald-400" : "text-red-400")}>
                                    {formatCurrency(forecast.balance)}
                                </p>
                            )}

                            {loading ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <Skeleton className="h-3 w-16 bg-white/20" />
                                    <Skeleton className="h-3 w-16 bg-white/20" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-1 text-[10px] md:text-xs">
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
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center self-start shrink-0">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (loading) return <div className={cn("h-[200px] bg-muted/50 rounded-xl animate-pulse border border-border", className)} />;

    return (
        <Card className={cn("bg-card border-border h-full flex flex-col overflow-hidden min-w-0 w-full", className)}>
            <CardHeader className="pb-2 pt-3 px-3 md:pt-6 md:px-6">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Previsão Próximo Mês
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 md:p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
                                <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                            </div>
                            <span className="text-xs md:text-sm text-muted-foreground">Receitas Fixas</span>
                        </div>
                        <span className="text-sm md:text-base font-bold text-foreground">{formatCurrency(forecast.income)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 md:p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-sm">
                                <TrendingDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                            </div>
                            <span className="text-xs md:text-sm text-muted-foreground">Despesas Previstas</span>
                        </div>
                        <span className="text-sm md:text-base font-bold text-foreground">{formatCurrency(forecast.expenses)}</span>
                    </div>
                    <div className="pt-3 md:pt-4 border-t border-border flex justify-between items-center">
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">Saldo Previsto</span>
                        <span className={`text-sm md:text-base font-bold ${forecast.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(forecast.balance)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
