"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurring } from "@/hooks/useRecurring";
import { useAuth } from "@/contexts/AuthContext";
import { getCreditCards, getNextInvoice } from "@/lib/creditCards";
import { addMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export function ForecastCard() {
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
            const fixedExpenses = recurring
                .filter(t => t.type === 'despesa' && t.active)
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

    if (loading) return <div className="h-[200px] bg-muted/50 rounded-xl animate-pulse border border-border" />;

    return (
        <Card className="bg-card border-border h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Previsão Próximo Mês
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm text-muted-foreground">Receitas Fixas</span>
                        </div>
                        <span className="font-bold text-foreground">{formatCurrency(forecast.income)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-sm">
                                <TrendingDown className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm text-muted-foreground">Despesas Previstas</span>
                        </div>
                        <span className="font-bold text-foreground">{formatCurrency(forecast.expenses)}</span>
                    </div>
                    <div className="pt-4 border-t border-border flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Saldo Previsto</span>
                        <span className={`font-bold ${forecast.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(forecast.balance)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
