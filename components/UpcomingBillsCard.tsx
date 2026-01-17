"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurring } from "@/hooks/useRecurring";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { useMemo } from "react";
import { isAfter, isBefore, addDays, startOfDay, endOfDay, differenceInDays } from "date-fns";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export function UpcomingBillsCard() {
    const { transactions } = useTransactions();
    const { recurring } = useRecurring();
    const { user } = useAuth();

    const upcomingBills = useMemo(() => {
        if (!user?.uid) return [];

        const today = startOfDay(new Date());
        const next7Days = endOfDay(addDays(today, 7));

        const bills: any[] = [];

        // 1. Pending Boletos
        const pendingBoletos = transactions.filter(t =>
            t.type === 'despesa' &&
            t.paymentMethod === 'boleto' &&
            t.boletoStatus === 'pending' &&
            t.boletoDueDate
        );

        pendingBoletos.forEach(t => {
            const dueDate = new Date(t.boletoDueDate!);
            // Consider bills due today or in the future (up to 7 days)
            // Also include overdue bills? Maybe distinct visual? For now, just upcoming.
            if (isBefore(dueDate, next7Days)) {
                bills.push({
                    id: t.id,
                    description: t.description,
                    amount: t.amount,
                    date: dueDate,
                    type: 'boleto',
                    isOverdue: isBefore(dueDate, today)
                });
            }
        });

        // 2. Recurring Expenses
        recurring.forEach(r => {
            if (r.type === 'despesa' && r.active) {
                const currentDay = today.getDate();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();

                // Check if already processed this month
                const lastProcessed = r.lastProcessedDate ? new Date(r.lastProcessedDate) : null;
                const isProcessedThisMonth = lastProcessed &&
                    lastProcessed.getMonth() === currentMonth &&
                    lastProcessed.getFullYear() === currentYear;

                if (!isProcessedThisMonth) {
                    const targetDate = new Date(currentYear, currentMonth, r.day);

                    // Only if it's in the future (or today) and within range
                    // If it's in the past of this month and NOT processed, it's overdue/pending for this month
                    if (isBefore(targetDate, next7Days)) {
                        bills.push({
                            id: r.id,
                            description: r.description,
                            amount: r.amount,
                            date: targetDate,
                            type: 'recurring',
                            isOverdue: isBefore(targetDate, today)
                        });
                    }
                }
            }
        });

        return bills.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [transactions, recurring, user?.uid]);

    return (
        <Card className="bg-card border-border h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Próximos Vencimentos
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                {upcomingBills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground min-h-[150px]">
                        <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Tudo em dia!</p>
                    </div>
                ) : (
                    <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 max-h-[250px]">
                        {upcomingBills.map((bill, idx) => (
                            <div key={`${bill.type}-${bill.id}-${idx}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${bill.isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground line-clamp-1">{bill.description}</p>
                                        <p className={`text-xs ${bill.isOverdue ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                            {bill.isOverdue ? 'Venceu dia ' : 'Vence dia '} {bill.date.getDate()}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-foreground">
                                    {formatCurrency(bill.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
