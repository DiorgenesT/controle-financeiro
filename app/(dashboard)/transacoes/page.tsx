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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { getCategories, Category } from "@/lib/categories";
import { getIconById } from "@/lib/icons";
import { TransactionModal } from "@/components/TransactionModal";
import { toast } from "sonner";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
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

    // Filtrar transações por mês, ano e tipo
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.date);
            const matchMonth = date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
            const matchType = filterType === "todas" || t.type === filterType;
            const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchMonth && matchType && matchSearch;
        });
    }, [transactions, selectedMonth, selectedYear, filterType, searchTerm]);

    // Calcular totais do mês (apenas efetivados)
    const monthTotals = useMemo(() => {
        const receitas = filteredTransactions
            .filter(t => t.type === "receita" && t.category !== "Transferência")
            .reduce((sum, t) => sum + t.amount, 0);

        const despesas = filteredTransactions
            .filter(t => {
                if (t.type !== "despesa") return false;
                if (t.category === "Transferência") return false;
                // Ignorar cartão de crédito (só conta no pagamento da fatura)
                if (t.paymentMethod === "credit") return false;
                // Ignorar boleto pendente
                if (t.paymentMethod === "boleto" && t.boletoStatus === "pending") return false;
                return true;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        return { receitas, despesas, saldo: receitas - despesas };
    }, [filteredTransactions]);

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
        <div className="min-h-screen bg-zinc-950">
            <Header title="Transações" />

            <TransactionModal open={showModal} onOpenChange={setShowModal} />

            <div className="p-6 space-y-6">
                {/* Seletor de Mês */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevMonth}
                        className="text-zinc-400 hover:text-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white">
                            {MONTHS[selectedMonth]} {selectedYear}
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextMonth}
                        className="text-zinc-400 hover:text-white"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-green-900/30 to-zinc-900/50 border-green-800/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-400">Receitas</p>
                                    {loading ? (
                                        <Skeleton className="h-7 w-28 bg-zinc-800 mt-1" />
                                    ) : (
                                        <p className="text-2xl font-bold text-white mt-1">
                                            +{formatCurrency(monthTotals.receitas)}
                                        </p>
                                    )}
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-900/30 to-zinc-900/50 border-red-800/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-red-400">Despesas</p>
                                    {loading ? (
                                        <Skeleton className="h-7 w-28 bg-zinc-800 mt-1" />
                                    ) : (
                                        <p className="text-2xl font-bold text-white mt-1">
                                            -{formatCurrency(monthTotals.despesas)}
                                        </p>
                                    )}
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6 text-red-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-zinc-400">Balanço do Mês</p>
                                    {loading ? (
                                        <Skeleton className="h-7 w-28 bg-zinc-800 mt-1" />
                                    ) : (
                                        <p className={`text-2xl font-bold mt-1 ${monthTotals.saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {monthTotals.saldo >= 0 ? '+' : ''}{formatCurrency(monthTotals.saldo)}
                                        </p>
                                    )}
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                                    <ArrowUpDown className="w-6 h-6 text-zinc-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder="Buscar transações..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
                            <button
                                onClick={() => setFilterType("todas")}
                                className={`px-4 py-2 text-sm transition-colors ${filterType === "todas"
                                    ? "bg-zinc-700 text-white"
                                    : "bg-zinc-800/50 text-zinc-400 hover:text-white"
                                    }`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFilterType("receita")}
                                className={`px-4 py-2 text-sm transition-colors ${filterType === "receita"
                                    ? "bg-green-500/30 text-green-400"
                                    : "bg-zinc-800/50 text-zinc-400 hover:text-white"
                                    }`}
                            >
                                Receitas
                            </button>
                            <button
                                onClick={() => setFilterType("despesa")}
                                className={`px-4 py-2 text-sm transition-colors ${filterType === "despesa"
                                    ? "bg-red-500/30 text-red-400"
                                    : "bg-zinc-800/50 text-zinc-400 hover:text-white"
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
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Transações de {MONTHS[selectedMonth]}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            {filteredTransactions.length} transação(ões) encontrada(s)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-12 h-12 rounded-lg bg-zinc-700" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-40 bg-zinc-700" />
                                                <Skeleton className="h-3 w-32 bg-zinc-700" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-5 w-24 bg-zinc-700" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-400">Nenhuma transação encontrada</p>
                                <p className="text-sm text-zinc-500 mt-1">
                                    {filterType !== "todas"
                                        ? `Sem ${filterType === "receita" ? "receitas" : "despesas"} neste mês`
                                        : "Adicione sua primeira transação"
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTransactions.map((transaction) => {
                                    const category = getCategoryByName(transaction.category);
                                    const isReceita = transaction.type === "receita";
                                    const Icon = category
                                        ? getIconById(category.icon)
                                        : (isReceita ? TrendingUp : TrendingDown);
                                    const color = category?.color || (isReceita ? "#22C55E" : "#EF4444");
                                    const showInstallments = transaction.installments && transaction.installments > 1;

                                    return (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                                                    style={{ backgroundColor: `${color}20` }}
                                                >
                                                    <Icon className="w-5 h-5" style={{ color }} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{transaction.description}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-sm text-zinc-500 flex items-center">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {formatDate(transaction.date)}
                                                        </span>
                                                        {transaction.paymentMethod && !isReceita && (
                                                            <span className="flex items-center gap-1.5 text-xs text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/50">
                                                                {getPaymentIcon(transaction)}
                                                                <span>
                                                                    {transaction.paymentMethod === "credit" && "Crédito"}
                                                                    {transaction.paymentMethod === "debit" && "Débito"}
                                                                    {transaction.paymentMethod === "pix" && "PIX"}
                                                                    {transaction.paymentMethod === "boleto" && "Boleto"}
                                                                </span>
                                                            </span>
                                                        )}
                                                        {transaction.boletoStatus === "pending" && (
                                                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                                                Pendente
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className={`text-lg font-semibold ${isReceita ? 'text-green-400' : 'text-red-400'}`}>
                                                        {isReceita ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                    </span>
                                                    {showInstallments && (
                                                        <p className="text-xs text-zinc-500">
                                                            {transaction.installmentNumber}/{transaction.installments}
                                                        </p>
                                                    )}
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                                                        <DropdownMenuItem className="text-zinc-300 hover:text-white focus:text-white focus:bg-zinc-800">
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
