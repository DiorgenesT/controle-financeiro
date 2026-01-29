"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    MoreHorizontal,
    Pencil,
    Trash2,
    FileText,
    Search,
    ChevronLeft,
    ChevronRight,
    Plus,
    ArrowUpDown,
    Wallet,
    CreditCard,
    Receipt,
    Smartphone,
} from "lucide-react";
import {
    format,
    isBefore,
    startOfDay,
    isSameMonth,
    isSameYear,
    addDays,
    isToday,
    isYesterday
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useAuth } from "@/contexts/AuthContext";
import { getCategories, Category } from "@/lib/categories";
import { getIconById } from "@/lib/icons";
import { TransactionModal } from "@/components/TransactionModal";
import { formatTransactionDescription } from "@/lib/utils";
import { toast } from "sonner";
import { ForecastCard } from "@/components/ForecastCard";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
};

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

type FilterType = "todas" | "receita" | "despesa";

export default function TransacoesPage() {
    const { user } = useAuth();
    const { transactions, loading, remove } = useTransactions();
    const { accounts } = useAccounts();
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<typeof transactions[0] | undefined>(undefined);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterType, setFilterType] = useState<FilterType>("todas");

    // Filtro de mês/ano
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Buscar categorias do Firestore
    useEffect(() => {
        async function fetchCategories() {
            if (!user?.uid) return;
            try {
                const data = await getCategories(user.uid);
                setCategories(data);
            } catch (error) {
                console.error("Erro ao buscar categorias:", error);
            }
        }
        fetchCategories();
    }, [user?.uid]);

    // Transações do mês (para os cards) - ignora filtro de tipo e busca
    const allMonthTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.date);
            const matchMonth = date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;

            // Filtros de visibilidade (ocultar crédito e boletos pendentes)
            if (t.paymentMethod === "credit") return false;
            if (t.paymentMethod === "boleto" && t.boletoStatus === "pending") return false;

            return matchMonth;
        });
    }, [transactions, selectedMonth, selectedYear]);

    // Filtrar transações para a lista (aplica tipo e busca)
    const filteredTransactions = useMemo(() => {
        return allMonthTransactions.filter(t => {
            const matchType = filterType === "todas" || t.type === filterType;
            const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchType && matchSearch;
        });
    }, [allMonthTransactions, filterType, searchTerm]);

    // Agrupar transações por data
    const groupedTransactions = useMemo(() => {
        const groups: { [key: string]: typeof transactions } = {};

        filteredTransactions.forEach(t => {
            const date = new Date(t.date);
            const dateKey = format(date, "yyyy-MM-dd");
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(t);
        });

        // Ordenar chaves (datas) decrescente
        return Object.keys(groups)
            .sort((a, b) => b.localeCompare(a))
            .map(dateKey => ({
                date: new Date(dateKey + "T12:00:00"), // Evitar problemas de fuso
                items: groups[dateKey]
            }));
    }, [filteredTransactions]);

    // Calcular totais do mês (usando allMonthTransactions)
    const monthTotals = useMemo(() => {
        const receitas = allMonthTransactions
            .filter(t => t.type === "receita" && t.category !== "Transferência")
            .reduce((sum, t) => sum + t.amount, 0);

        const despesas = allMonthTransactions
            .filter(t => {
                if (t.type !== "despesa") return false;
                if (t.category === "Transferência") return false;
                return true;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        return { receitas, despesas, saldo: receitas - despesas };
    }, [allMonthTransactions]);

    const getCategoryByName = (categoryName: string) => {
        return categories.find(c =>
            c.name.toLowerCase() === categoryName.toLowerCase() ||
            c.id === categoryName
        );
    };

    const handleDelete = async (id: string) => {
        try {
            await remove(id);
            toast.success("Transação removida!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover transação");
        }
    };

    const handleEdit = (transaction: typeof transactions[0]) => {
        setEditingTransaction(transaction);
        setShowModal(true);
    };

    const prevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const nextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const getPaymentIcon = (transaction: typeof transactions[0]) => {
        switch (transaction.paymentMethod) {
            case "credit": return <CreditCard className="w-3 h-3" />;
            case "boleto": return <Receipt className="w-3 h-3" />;
            case "pix": return <Smartphone className="w-3 h-3" />;
            default: return <Wallet className="w-3 h-3" />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header title="Transações" />

            <TransactionModal
                open={showModal}
                onOpenChange={(open) => {
                    setShowModal(open);
                    if (!open) setEditingTransaction(undefined);
                }}
                initialData={editingTransaction}
            />

            <div className="p-6 space-y-6">
                {/* Seletor de Mês */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevMonth}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-foreground">
                            {MONTHS[selectedMonth]} {selectedYear}
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextMonth}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Cards de Resumo */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                    <Card className="bg-gradient-to-br from-green-500 to-green-700 border-none text-white shadow-lg shadow-green-500/20">
                        <CardContent className="p-3 md:pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] md:text-sm text-white/80 font-medium">Receitas</p>
                                    {loading ? (
                                        <Skeleton className="h-5 md:h-7 w-20 md:w-28 bg-white/20 mt-1" />
                                    ) : (
                                        <p className="text-base md:text-2xl font-bold text-white mt-0.5 md:mt-1">
                                            +{formatCurrency(monthTotals.receitas)}
                                        </p>
                                    )}
                                </div>
                                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500 to-red-700 border-none text-white shadow-lg shadow-red-500/20">
                        <CardContent className="p-3 md:pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] md:text-sm text-white/80 font-medium">Despesas</p>
                                    {loading ? (
                                        <Skeleton className="h-5 md:h-7 w-20 md:w-28 bg-white/20 mt-1" />
                                    ) : (
                                        <p className="text-sm md:text-2xl font-bold text-white mt-0.5 md:mt-1">
                                            -{formatCurrency(monthTotals.despesas)}
                                        </p>
                                    )}
                                </div>
                                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <TrendingDown className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500 to-blue-700 border-none text-white shadow-lg shadow-blue-500/20">
                        <CardContent className="p-3 md:pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] md:text-sm text-white/80 font-medium">Balanço</p>
                                    {loading ? (
                                        <Skeleton className="h-5 md:h-7 w-20 md:w-28 bg-white/20 mt-1" />
                                    ) : (
                                        <p className="text-sm md:text-2xl font-bold mt-0.5 md:mt-1 text-white">
                                            {monthTotals.saldo >= 0 ? '+' : ''}{formatCurrency(monthTotals.saldo)}
                                        </p>
                                    )}
                                </div>
                                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <ArrowUpDown className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <ForecastCard compact className="shadow-lg" />
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar transações..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex rounded-lg border border-input overflow-hidden">
                            <button
                                onClick={() => setFilterType("todas")}
                                className={`px-4 py-2 text-sm transition-colors ${filterType === "todas"
                                    ? "bg-muted text-foreground"
                                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFilterType("receita")}
                                className={`px-4 py-2 text-sm transition-colors ${filterType === "receita"
                                    ? "bg-green-500/30 text-green-400"
                                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Receitas
                            </button>
                            <button
                                onClick={() => setFilterType("despesa")}
                                className={`px-4 py-2 text-sm transition-colors ${filterType === "despesa"
                                    ? "bg-red-500/30 text-red-400"
                                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Despesas
                            </button>
                        </div>

                        <Button
                            onClick={() => setShowModal(true)}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova
                        </Button>
                    </div>
                </div>

                {/* Lista de Transações */}
                <Card className="bg-card border-border">
                    <CardHeader className="pb-0 pt-3 px-3 md:p-4 relative z-10">
                        <CardTitle className="text-[10px] md:text-sm font-medium text-foreground">
                            Transações de {MONTHS[selectedMonth]}
                        </CardTitle>
                        <CardDescription className="text-[10px] text-muted-foreground">
                            {filteredTransactions.length} transação(ões) encontrada(s)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-2">
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-12 h-12 rounded-lg bg-muted" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-40 bg-muted" />
                                                <Skeleton className="h-3 w-32 bg-muted" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-5 w-24 bg-muted" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {filterType !== "todas"
                                        ? `Sem ${filterType === "receita" ? "receitas" : "despesas"} neste mês`
                                        : "Adicione sua primeira transação"
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {groupedTransactions.map((group) => {
                                    const date = group.date;
                                    let dateLabel = format(date, "dd 'de' MMMM", { locale: ptBR });

                                    if (isToday(date)) dateLabel = "Hoje";
                                    else if (isYesterday(date)) dateLabel = "Ontem";

                                    return (
                                        <div key={date.toISOString()} className="space-y-2">
                                            <div className="flex items-center gap-2 px-1">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                                    {dateLabel}
                                                </span>
                                                <div className="h-[1px] flex-1 bg-border/30" />
                                            </div>

                                            <div className="space-y-1">
                                                {group.items.map((transaction) => {
                                                    const category = getCategoryByName(transaction.category);
                                                    const isReceita = transaction.type === "receita";
                                                    const Icon = category
                                                        ? getIconById(category.icon)
                                                        : (isReceita ? TrendingUp : TrendingDown);
                                                    const showInstallments = transaction.installments && transaction.installments > 1;

                                                    return (
                                                        <div
                                                            key={transaction.id}
                                                            onClick={() => handleEdit(transaction)}
                                                            className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-all group cursor-pointer border border-transparent hover:border-border/50"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                <div
                                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isReceita
                                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                                        : 'bg-rose-500/10 text-rose-500'
                                                                        }`}
                                                                >
                                                                    <Icon className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="font-medium text-foreground text-[10px] md:text-[11px] leading-tight">
                                                                        {formatTransactionDescription(transaction, accounts)}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[9px] text-muted-foreground font-medium">
                                                                            {transaction.category}
                                                                        </span>
                                                                        {transaction.paymentMethod && !isReceita && (
                                                                            <span className="flex items-center gap-1 text-[9px] text-muted-foreground/70">
                                                                                • {getPaymentIcon(transaction)}
                                                                            </span>
                                                                        )}
                                                                        {transaction.boletoStatus === "pending" && (
                                                                            <span className="text-[9px] text-amber-500 font-bold uppercase tracking-tighter">
                                                                                • Pendente
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0 ml-2">
                                                                <div className="text-right">
                                                                    <p className={`text-[10px] md:text-[11px] font-bold tabular-nums ${isReceita ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                        {isReceita ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                                    </p>
                                                                    {showInstallments && (
                                                                        <p className="text-[9px] text-muted-foreground font-medium">
                                                                            {transaction.installmentNumber}/{transaction.installments}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                                                        >
                                                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="bg-popover border-border">
                                                                        <DropdownMenuItem
                                                                            className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent"
                                                                            onClick={() => handleEdit(transaction)}
                                                                        >
                                                                            <Pencil className="w-4 h-4 mr-2" />
                                                                            Editar
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                                                                            onClick={() => handleDelete(transaction.id)}
                                                                        >
                                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                                            Excluir
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent >
                </Card >
            </div >
        </div >
    );
}
