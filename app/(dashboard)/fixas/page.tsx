"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    getDate,
    isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";

import {
    Pencil,
    Trash2,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    Repeat,
    ChevronLeft,
    ChevronRight,
    Plus
} from "lucide-react";
import { useRecurring } from "@/hooks/useRecurring";
import { RecurringModal } from "@/components/RecurringModal";
import { RecurringTransaction } from "@/types";
import { toast } from "sonner";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export default function FixasPage() {
    const { recurring, loading, deleteRecurringTransaction, refresh } = useRecurring();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Verificar parâmetro de URL para edição automática
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const editId = searchParams.get("editId");

        if (editId && recurring.length > 0) {
            const itemToEdit = recurring.find(item => item.id === editId);
            if (itemToEdit) {
                setEditingItem(itemToEdit);
                setIsModalOpen(true);
                window.history.replaceState({}, "", "/fixas");
            }
        }
    }, [recurring]);

    const handleEdit = (item: RecurringTransaction, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja excluir esta transação fixa?")) return;
        try {
            await deleteRecurringTransaction(id);
            toast.success("Removido com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover");
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    // Gerar dias do calendário
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Função para obter transações de um dia específico
    const getTransactionsForDay = (date: Date) => {
        // Só mostra transações se o dia pertencer ao mês atual (ou se quisermos mostrar em todos os meses visualizados)
        // Como são fixas mensais, elas teoricamente "existem" em todos os meses no mesmo dia.
        // Vamos mostrar baseando-se no dia do mês (1-31).

        const dayOfMonth = getDate(date);
        const isCurrentMonthDay = isSameMonth(date, currentMonth);

        if (!isCurrentMonthDay) return [];

        // Filtra transações que vencem neste dia
        let transactions = recurring.filter(item => item.day === dayOfMonth);

        // Lógica para fim de mês (ex: dia 31 em mês de 30 dias)
        // Se for o último dia do mês, inclui transações com dia > que o último dia
        const lastDayOfCurrentMonth = getDate(monthEnd);
        if (dayOfMonth === lastDayOfCurrentMonth) {
            const overflowTransactions = recurring.filter(item => item.day > lastDayOfCurrentMonth);
            transactions = [...transactions, ...overflowTransactions];
        }

        return transactions.sort((a, b) => b.amount - a.amount); // Maiores valores primeiro
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title="Calendário de Fixas" />

            <div className="flex-1 p-4 md:p-6 flex flex-col overflow-hidden">
                {/* Calendar Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold capitalize text-foreground">
                            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                        </h2>
                        <div className="flex items-center rounded-md border bg-card/50 backdrop-blur-sm">
                            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-4 bg-border" />
                            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={goToToday} className="hidden sm:flex">
                            Hoje
                        </Button>
                    </div>

                    <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nova Fixa
                    </Button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Carregando calendário...
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col border rounded-xl bg-card shadow-xl overflow-hidden ring-1 ring-border/50">
                        {/* Week Days Header */}
                        <div className="grid grid-cols-7 bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground shadow-md relative z-10">
                            {weekDays.map((day, idx) => (
                                <div
                                    key={day}
                                    className={`
                                        py-4 text-center text-sm font-bold uppercase tracking-wider opacity-90
                                        ${(idx === 0 || idx === 6) ? 'bg-black/20' : ''}
                                    `}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-auto min-h-[600px]">
                            {calendarDays.map((day, dayIdx) => {
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isTodayDate = isToday(day);
                                const transactions = getTransactionsForDay(day);
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                                // Calcular totais do dia
                                const totalReceita = transactions
                                    .filter(t => t.type === 'receita')
                                    .reduce((acc, curr) => acc + curr.amount, 0);
                                const totalDespesa = transactions
                                    .filter(t => t.type === 'despesa')
                                    .reduce((acc, curr) => acc + curr.amount, 0);

                                return (
                                    <div
                                        key={day.toString()}
                                        className={`
                                            relative border-b border-r p-2 transition-colors hover:bg-accent/20 flex flex-col gap-1
                                            ${!isCurrentMonth ? 'bg-muted/10 text-muted-foreground/40' :
                                                isWeekend ? 'bg-primary/5' : 'bg-background/40'}
                                            ${dayIdx % 7 === 0 ? 'border-l-0' : ''}
                                            ${dayIdx % 7 === 6 ? 'border-r-0' : ''}
                                        `}
                                    >
                                        {/* Day Number */}
                                        <div className="flex justify-between items-start">
                                            <span className={`
                                                text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                                ${isTodayDate ? 'bg-primary text-primary-foreground' : ''}
                                                ${!isCurrentMonth ? 'opacity-50' : ''}
                                            `}>
                                                {format(day, "d")}
                                            </span>
                                        </div>

                                        {/* Transactions List */}
                                        <div className="flex-1 flex flex-col gap-1 mt-1">
                                            {transactions.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={(e) => handleEdit(item, e)}
                                                    className={`
                                                        group flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-[10px] sm:text-xs cursor-pointer shadow-sm transition-all hover:scale-[1.02] hover:shadow-md
                                                        ${item.type === 'receita'
                                                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                                            : 'bg-red-600 text-white hover:bg-red-500'}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        {item.type === 'receita'
                                                            ? <ArrowUpCircle className="w-3.5 h-3.5 shrink-0 text-white/90" />
                                                            : <ArrowDownCircle className="w-3.5 h-3.5 shrink-0 text-white/90" />
                                                        }
                                                        <span className="truncate font-semibold">{item.description}</span>
                                                    </div>
                                                    <span className="font-bold tabular-nums text-white/95">
                                                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <RecurringModal
                key={editingItem?.id || 'new'}
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setEditingItem(null);
                }}
                initialData={editingItem}
                onSuccess={() => {
                    refresh();
                }}
            />
        </div>
    );
}
