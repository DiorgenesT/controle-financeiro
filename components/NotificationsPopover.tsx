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
import { useMemo, useState } from "react";
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

    const notifications = useMemo(() => {
        if (!user?.uid) return [];

        const today = startOfDay(new Date());
        const next7Days = endOfDay(addDays(today, 7));

        const items: any[] = [];

        // 1. Pending Boletos
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

                const lastProcessed = r.lastProcessedDate ? new Date(r.lastProcessedDate) : null;
                const isProcessedThisMonth = lastProcessed &&
                    lastProcessed.getMonth() === currentMonth &&
                    lastProcessed.getFullYear() === currentYear;

                if (!isProcessedThisMonth) {
                    const targetDate = new Date(currentYear, currentMonth, r.day);
                    if (isBefore(targetDate, next7Days)) {
                        items.push({
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

        return items.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [transactions, recurring, user?.uid]);

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
                                            <div className={`mt-0.5 w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${item.isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground line-clamp-1">
                                                    {item.description}
                                                </p>
                                                <p className={`text-xs ${item.isOverdue ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                                    {item.isOverdue ? 'Venceu dia ' : 'Vence dia '} {item.date.getDate()}
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
