"use client";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurring } from "@/hooks/useRecurring";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Calendar, CheckCircle2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { isBefore, addDays, startOfDay, endOfDay } from "date-fns";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export function NotificationsPopover() {
    const { transactions } = useTransactions();
    const { recurring } = useRecurring();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [creditCards, setCreditCards] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);

    // Fetch additional data for notifications
    useEffect(() => {
        async function fetchData() {
            if (!user?.uid) return;
            // Note: Ideally these should be in hooks or context to avoid refetching
            // For now, we'll fetch here or assume we could get them from context if available
            // To keep it simple and robust, let's just use the hooks if we had them, 
            // but since we don't have useCreditCards/useGoals hooks readily available in this file context,
            // we will import the fetch functions.
            const { getCreditCards } = await import("@/lib/creditCards");
            const { getGoals } = await import("@/lib/firestore");
            const { getInvoices } = await import("@/lib/creditCards");

            const [cards, userGoals] = await Promise.all([
                getCreditCards(user.uid),
                getGoals(user.uid)
            ]);

            // For cards, we need the current invoice total to check limit
            const cardsWithInvoice = await Promise.all(cards.map(async (card) => {
                const invoices = await getInvoices(card.id, user.uid);
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();
                const currentInvoice = invoices.find(i => i.month === currentMonth && i.year === currentYear);
                return { ...card, currentInvoiceTotal: currentInvoice?.totalAmount || 0 };
            }));

            setCreditCards(cardsWithInvoice);
            setGoals(userGoals);
        }
        fetchData();
    }, [user?.uid, open]); // Fetch when opening to be fresh

    const notifications = useMemo(() => {
        if (!user?.uid) return [];

        const today = startOfDay(new Date());
        const next7Days = endOfDay(addDays(today, 7));
        const settings = user.settings || { budgetAlerts: true, goalReminders: true };

        const items: any[] = [];

        // 1. Pending Boletos (Always active if exists)
        const pendingBoletos = transactions.filter(t =>
            t.type === 'despesa' &&
            t.paymentMethod === 'boleto' &&
            t.boletoStatus === 'pending' &&
            t.boletoDueDate
        );

        pendingBoletos.forEach(t => {
            const dueDate = new Date(t.boletoDueDate!);
            if (isBefore(dueDate, next7Days)) {
                items.push({
                    id: t.id,
                    description: `Boleto: ${t.description}`,
                    amount: t.amount,
                    date: dueDate,
                    type: 'boleto',
                    isOverdue: isBefore(dueDate, today)
                });
            }
        });

        // 2. Recurring Expenses (Always active)
        recurring.forEach(r => {
            if (r.type === 'despesa' && r.active) {
                const currentDay = today.getDate();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();

                const lastProcessed = r.lastProcessedDate ? new Date(r.lastProcessedDate) : null;
                const isProcessedThisMonth = lastProcessed &&
                    lastProcessed.getMonth() === currentMonth &&
                    lastProcessed.getFullYear() === currentYear;

                if (!isProcessedThisMonth) {
                    const targetDate = new Date(currentYear, currentMonth, r.day);
                    if (isBefore(targetDate, next7Days)) {
                        items.push({
                            id: r.id,
                            description: `Fixa: ${r.description}`,
                            amount: r.amount,
                            date: targetDate,
                            type: 'recurring',
                            isOverdue: isBefore(targetDate, today)
                        });
                    }
                }
            }
        });

        // 3. Budget Alerts (Credit Card Limit) - Controlled by Setting
        if (settings.budgetAlerts) {
            creditCards.forEach(card => {
                const limit = card.limit;
                const current = card.currentInvoiceTotal;
                if (limit > 0 && current >= limit * 0.9) {
                    items.push({
                        id: card.id,
                        description: `Limite: ${card.name} (${Math.round((current / limit) * 100)}%)`,
                        amount: current,
                        date: new Date(), // Alert for now
                        type: 'budget',
                        isOverdue: current >= limit // Red if over limit
                    });
                }
            });
        }

        // 4. Goal Reminders - Controlled by Setting
        if (settings.goalReminders) {
            goals.forEach(goal => {
                if (goal.status === 'em_progresso' && goal.deadline) {
                    const deadline = new Date(goal.deadline);
                    if (isBefore(deadline, next7Days)) {
                        items.push({
                            id: goal.id,
                            description: `Meta: ${goal.title}`,
                            amount: goal.targetAmount - goal.currentAmount, // Remaining
                            date: deadline,
                            type: 'goal',
                            isOverdue: isBefore(deadline, today)
                        });
                    }
                }
            });
        }

        return items.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [transactions, recurring, user?.uid, creditCards, goals, user?.settings]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
                <div className="p-4 border-b border-border">
                    <h4 className="font-medium leading-none text-foreground">Notificações</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        Você tem {notifications.length} alertas pendentes
                    </p>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                            <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">Tudo em dia!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map((item, idx) => (
                                <div key={`${item.type}-${item.id}-${idx}`} className="p-3 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-8 h-8 rounded-md flex items-center justify-center shrink-0 
                                                ${item.type === 'budget' ? 'bg-red-500/10 text-red-500' :
                                                    item.type === 'goal' ? 'bg-blue-500/10 text-blue-500' :
                                                        item.isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {item.type === 'budget' ? <Bell className="w-4 h-4" /> :
                                                    item.type === 'goal' ? <CheckCircle2 className="w-4 h-4" /> :
                                                        <Calendar className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground line-clamp-1">
                                                    {item.description}
                                                </p>
                                                <p className={`text-xs ${item.isOverdue ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                                    {item.type === 'budget' ? 'Atenção ao limite' :
                                                        item.isOverdue ? 'Venceu dia ' : 'Vence dia '} {item.date.getDate()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-foreground whitespace-nowrap">
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
