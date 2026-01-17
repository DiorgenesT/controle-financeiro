"use client";

import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Barcode,
    Search,
    CheckCircle,
    AlertCircle,
    Clock,
    Calendar,
    MoreHorizontal,
    Pencil,
    Trash2,
    Wallet,
    AlertTriangle,
    CalendarClock,
    ArrowRight,
    TrendingUp,
    FileText,
    Loader2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTransactions } from "@/hooks/useTransactions";
import { Transaction } from "@/types";
import { TransactionModal } from "@/components/TransactionModal";
import { toast } from "sonner";
import { format, differenceInDays, isToday, isTomorrow, startOfDay, endOfMonth, startOfMonth, isWithinInterval, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getAccounts, updateAccountBalance, Account } from "@/lib/accounts";
import { updateTransaction } from "@/lib/firestore";
import { getBankByCode } from "@/lib/banks";
import { getIconById } from "@/lib/icons";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

// Helper function to safely parse dates
const safeParseDate = (dateValue: Date | string | undefined | null): Date | null => {
    if (!dateValue) return null;
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
};

// Componente para o card de próximo boleto
const NextBoletoCard = ({ boleto }: { boleto: Transaction | null }) => {
    if (!boleto) {
        return (
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-none text-white shadow-lg shadow-emerald-500/20">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-white/90 font-medium">Tudo em dia!</p>
                            <p className="text-lg font-bold text-white">Nenhum boleto pendente</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Safely parse the due date
    const rawDate = boleto.boletoDueDate || boleto.date;
    const parsedDate = rawDate ? new Date(rawDate) : new Date();
    const isValidDate = !isNaN(parsedDate.getTime());

    const dueDate = isValidDate ? startOfDay(parsedDate) : startOfDay(new Date());
    const today = startOfDay(new Date());
    const daysUntilDue = differenceInDays(dueDate, today);
    const isOverdue = daysUntilDue < 0;

    let urgencyText = '';
    let bgGradient = 'from-blue-500 to-blue-700';
    let shadowColor = 'shadow-blue-500/20';

    if (!isValidDate) {
        urgencyText = 'Data não definida';
        bgGradient = 'from-gray-500 to-gray-700';
        shadowColor = 'shadow-gray-500/20';
    } else if (isOverdue) {
        urgencyText = `Vencido há ${Math.abs(daysUntilDue)} dia${Math.abs(daysUntilDue) > 1 ? 's' : ''}`;
        bgGradient = 'from-red-500 to-red-700';
        shadowColor = 'shadow-red-500/20';
    } else if (daysUntilDue === 0) {
        urgencyText = 'Vence HOJE!';
        bgGradient = 'from-amber-500 to-amber-700';
        shadowColor = 'shadow-amber-500/20';
    } else if (daysUntilDue === 1) {
        urgencyText = 'Vence amanhã';
        bgGradient = 'from-amber-500 to-amber-700';
        shadowColor = 'shadow-amber-500/20';
    } else if (daysUntilDue <= 7) {
        urgencyText = `Vence em ${daysUntilDue} dias`;
        bgGradient = 'from-blue-500 to-blue-700';
        shadowColor = 'shadow-blue-500/20';
    } else {
        urgencyText = `Vence em ${daysUntilDue} dias`;
        bgGradient = 'from-blue-500 to-blue-700';
        shadowColor = 'shadow-blue-500/20';
    }

    const formattedDate = isValidDate
        ? format(dueDate, "dd 'de' MMMM", { locale: ptBR })
        : "Data inválida";

    return (
        <Card className={`bg-gradient-to-br ${bgGradient} border-none text-white shadow-lg ${shadowColor}`}>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 bg-white/20 rounded-xl`}>
                            <CalendarClock className={`w-6 h-6 text-white`} />
                        </div>
                        <div>
                            <p className={`text-sm text-white/90 font-medium`}>{urgencyText}</p>
                            <p className="text-lg font-bold text-white truncate max-w-[200px]">{boleto.description}</p>
                            <p className="text-xs text-white/80 mt-1">
                                {formattedDate}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-white">{formatCurrency(boleto.amount)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function BoletosPage() {
    const { transactions, loading, remove, refresh } = useTransactions();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "overdue">("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // Estado para modal de pagamento
    const [payModal, setPayModal] = useState<{ open: boolean; boleto: Transaction | null }>({ open: false, boleto: null });
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [paying, setPaying] = useState(false);

    // Carregar contas
    useEffect(() => {
        if (user?.uid) {
            getAccounts(user.uid).then((accs) => {
                setAccounts(accs);
                const defaultAcc = accs.find(a => a.isDefault) || accs[0];
                if (defaultAcc) setSelectedAccountId(defaultAcc.id);
            });
        }
    }, [user?.uid]);

    // Filtrar apenas boletos
    const boletos = useMemo(() => {
        return transactions.filter(t => t.paymentMethod === "boleto");
    }, [transactions]);

    // Data atual para cálculos
    const today = startOfDay(new Date());
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // Calcular métricas dinâmicas
    const metrics = useMemo(() => {
        const pending = boletos.filter(b => b.boletoStatus === "pending");
        const paid = boletos.filter(b => b.boletoStatus === "paid");

        // Boletos vencidos (pendentes com data passada)
        const overdue = pending.filter(b => {
            const parsedDate = safeParseDate(b.boletoDueDate || b.date);
            if (!parsedDate) return false;
            const dueDate = startOfDay(parsedDate);
            return dueDate < today;
        });

        // Próximos a vencer (ordenados por data)
        const upcoming = pending
            .filter(b => {
                const parsedDate = safeParseDate(b.boletoDueDate || b.date);
                if (!parsedDate) return false;
                const dueDate = startOfDay(parsedDate);
                return dueDate >= today;
            })
            .sort((a, b) => {
                const dateA = safeParseDate(a.boletoDueDate || a.date) || new Date();
                const dateB = safeParseDate(b.boletoDueDate || b.date) || new Date();
                return dateA.getTime() - dateB.getTime();
            });

        // Boletos que vencem esta semana
        const next7Days = upcoming.filter(b => {
            const parsedDate = safeParseDate(b.boletoDueDate || b.date);
            if (!parsedDate) return false;
            const dueDate = startOfDay(parsedDate);
            return differenceInDays(dueDate, today) <= 7;
        });

        // Boletos pagos este mês
        const paidThisMonth = paid.filter(b => {
            const paidDate = safeParseDate(b.date);
            if (!paidDate) return false;
            return isWithinInterval(paidDate, { start: monthStart, end: monthEnd });
        });

        // Total pendente (vencidos + a vencer)
        const totalPendingAmount = pending.reduce((sum, b) => sum + b.amount, 0);
        const totalOverdueAmount = overdue.reduce((sum, b) => sum + b.amount, 0);
        const totalNext7DaysAmount = next7Days.reduce((sum, b) => sum + b.amount, 0);

        return {
            overdue,
            upcoming,
            next7Days,
            paidThisMonth,
            totalPendingCount: pending.length,
            totalPendingAmount,
            totalOverdueCount: overdue.length,
            totalOverdueAmount,
            next7DaysCount: next7Days.length,
            totalNext7DaysAmount,
            paidThisMonthCount: paidThisMonth.length,
            nextBoleto: overdue.length > 0 ? overdue[0] : upcoming[0] || null
        };
    }, [boletos, today, monthStart, monthEnd]);

    // Agrupar boletos para exibição
    const groupedBoletos = useMemo(() => {
        const filtered = boletos.filter(boleto => {
            const matchesSearch = boleto.description.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesStatus = true;
            const parsedDueDate = safeParseDate(boleto.boletoDueDate || boleto.date);
            const dueDate = parsedDueDate ? startOfDay(parsedDueDate) : today;
            const isOverdue = boleto.boletoStatus === "pending" && !!parsedDueDate && dueDate < today;

            if (statusFilter === "pending") matchesStatus = boleto.boletoStatus === "pending" && !isOverdue;
            if (statusFilter === "paid") matchesStatus = boleto.boletoStatus === "paid";
            if (statusFilter === "overdue") matchesStatus = isOverdue;

            return matchesSearch && matchesStatus;
        });

        // Agrupar por categoria
        const groups: { [key: string]: { title: string; boletos: Transaction[]; priority: number } } = {};

        filtered.forEach(boleto => {
            const parsedDueDate = safeParseDate(boleto.boletoDueDate || boleto.date);
            const dueDate = parsedDueDate ? startOfDay(parsedDueDate) : today;
            const daysDiff = differenceInDays(dueDate, today);

            let groupKey: string;
            let groupTitle: string;
            let priority: number;

            if (boleto.boletoStatus === "paid") {
                groupKey = "paid";
                groupTitle = "✓ Pagos";
                priority = 5;
            } else if (!parsedDueDate) {
                groupKey = "unknown";
                groupTitle = "❓ Data indefinida";
                priority = 6;
            } else if (daysDiff < 0) {
                groupKey = "overdue";
                groupTitle = "⚠️ Vencidos";
                priority = 0;
            } else if (daysDiff === 0) {
                groupKey = "today";
                groupTitle = "🔴 Vence Hoje";
                priority = 1;
            } else if (daysDiff <= 7) {
                groupKey = "week";
                groupTitle = "📅 Próximos 7 dias";
                priority = 2;
            } else if (daysDiff <= 30) {
                groupKey = "month";
                groupTitle = "📆 Este mês";
                priority = 3;
            } else {
                groupKey = "future";
                groupTitle = "📋 Futuros";
                priority = 4;
            }

            if (!groups[groupKey]) {
                groups[groupKey] = { title: groupTitle, boletos: [], priority };
            }
            groups[groupKey].boletos.push(boleto);
        });

        // Ordenar boletos dentro de cada grupo por data
        Object.values(groups).forEach(group => {
            group.boletos.sort((a, b) => {
                const dateA = safeParseDate(a.boletoDueDate || a.date) || new Date();
                const dateB = safeParseDate(b.boletoDueDate || b.date) || new Date();
                return dateA.getTime() - dateB.getTime();
            });
        });

        // Retornar grupos ordenados por prioridade
        return Object.values(groups).sort((a, b) => a.priority - b.priority);
    }, [boletos, searchTerm, statusFilter, today]);

    const handleEdit = (boleto: Transaction) => {
        setEditingTransaction(boleto);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este boleto?")) {
            try {
                await remove(id);
                toast.success("Boleto excluído com sucesso");
            } catch (error) {
                toast.error("Erro ao excluir boleto");
            }
        }
    };

    const handlePay = (boleto: Transaction) => {
        // Abrir modal de pagamento
        setPayModal({ open: true, boleto });
        // Se o boleto já tem uma conta associada, usar essa
        if (boleto.accountId) {
            setSelectedAccountId(boleto.accountId);
        }
    };

    const handleConfirmPayment = async () => {
        if (!payModal.boleto || !selectedAccountId) {
            toast.error("Selecione uma conta para debitar");
            return;
        }

        setPaying(true);
        try {
            // 1. Atualizar status do boleto para pago
            await updateTransaction(payModal.boleto.id, {
                boletoStatus: "paid"
            });

            // 2. Debitar valor da conta
            await updateAccountBalance(selectedAccountId, payModal.boleto.amount, "subtract");

            toast.success("Boleto pago com sucesso!");
            setPayModal({ open: false, boleto: null });
            refresh(); // Recarregar transações
        } catch (error) {
            console.error("Erro ao pagar boleto:", error);
            toast.error("Erro ao processar pagamento");
        } finally {
            setPaying(false);
        }
    };

    const getDueDateText = (boleto: Transaction) => {
        // Safely parse the due date
        const rawDate = boleto.boletoDueDate || boleto.date;
        if (!rawDate) {
            return "Data não definida";
        }

        const parsedDate = new Date(rawDate);
        if (isNaN(parsedDate.getTime())) {
            return "Data inválida";
        }

        const dueDate = startOfDay(parsedDate);
        const daysDiff = differenceInDays(dueDate, today);

        if (boleto.boletoStatus === "paid") {
            const paidDate = new Date(boleto.date);
            if (!isNaN(paidDate.getTime())) {
                return `Pago em ${format(paidDate, "dd/MM/yyyy")}`;
            }
            return "Pago";
        }
        if (daysDiff < 0) {
            return `Venceu há ${Math.abs(daysDiff)} dia${Math.abs(daysDiff) > 1 ? 's' : ''}`;
        }
        if (daysDiff === 0) {
            return "Vence hoje";
        }
        if (daysDiff === 1) {
            return "Vence amanhã";
        }
        return `Vence em ${format(dueDate, "dd/MM/yyyy")}`;
    };

    return (
        <div className="min-h-screen bg-background">
            <Header title="Boletos" />

            <div className="p-6 space-y-6">
                {/* Card principal - Próximo boleto */}
                <NextBoletoCard boleto={metrics.nextBoleto} />

                {/* Métricas dinâmicas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Vencidos */}
                    <Card className={`bg-gradient-to-br from-red-500 to-red-700 border-none text-white shadow-lg shadow-red-500/20`}>
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-white/20`}>
                                    <AlertTriangle className={`w-4 h-4 text-white`} />
                                </div>
                                <div>
                                    <p className="text-xs text-white/80">Vencidos</p>
                                    <p className={`text-xl font-bold text-white`}>
                                        {metrics.totalOverdueCount}
                                    </p>
                                </div>
                            </div>
                            {metrics.totalOverdueCount > 0 && (
                                <p className="text-xs text-white/70 mt-2">
                                    {formatCurrency(metrics.totalOverdueAmount)}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Próximos 7 dias */}
                    <Card className="bg-gradient-to-br from-amber-500 to-amber-700 border-none text-white shadow-lg shadow-amber-500/20">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Clock className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/80">Próx. 7 dias</p>
                                    <p className="text-xl font-bold text-white">{metrics.next7DaysCount}</p>
                                </div>
                            </div>
                            {metrics.next7DaysCount > 0 && (
                                <p className="text-xs text-white/70 mt-2">
                                    {formatCurrency(metrics.totalNext7DaysAmount)}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Total pendentes */}
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-700 border-none text-white shadow-lg shadow-blue-500/20">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <FileText className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/80">Pendentes</p>
                                    <p className="text-xl font-bold text-white">{metrics.totalPendingCount}</p>
                                </div>
                            </div>
                            <p className="text-xs text-white/70 mt-2">
                                {formatCurrency(metrics.totalPendingAmount)}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Pagos este mês */}
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-none text-white shadow-lg shadow-emerald-500/20">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/80">Pagos (mês)</p>
                                    <p className="text-xl font-bold text-white">{metrics.paidThisMonthCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Dica para criar boleto */}
                <div className="flex items-center justify-between bg-muted/30 border border-border border-dashed rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Barcode className="w-5 h-5" />
                        <span className="text-sm">Para adicionar um novo boleto, crie uma transação com método de pagamento &quot;Boleto&quot;</span>
                    </div>
                    <Link href="/transacoes">
                        <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10">
                            Ir para Transações
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar boletos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-muted/50 border-input text-foreground"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v: "all" | "pending" | "paid" | "overdue") => setStatusFilter(v)}>
                            <SelectTrigger className="w-[140px] bg-muted/50 border-input text-foreground">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="pending">A Vencer</SelectItem>
                                <SelectItem value="overdue">Vencidos</SelectItem>
                                <SelectItem value="paid">Pagos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Lista de Boletos Agrupados */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : groupedBoletos.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-xl border border-border border-dashed">
                            <Barcode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Nenhum boleto encontrado</p>
                        </div>
                    ) : (
                        groupedBoletos.map((group) => (
                            <div key={group.title} className="space-y-3">
                                <h3 className="text-sm font-medium text-muted-foreground px-1">
                                    {group.title}
                                    <span className="ml-2 text-xs text-muted-foreground">({group.boletos.length})</span>
                                </h3>
                                <div className="space-y-2">
                                    {group.boletos.map((boleto) => {
                                        const parsedDueDate = safeParseDate(boleto.boletoDueDate || boleto.date);
                                        const dueDate = parsedDueDate ? startOfDay(parsedDueDate) : today;
                                        const isOverdue = boleto.boletoStatus === "pending" && !!parsedDueDate && dueDate < today;

                                        return (
                                            <div
                                                key={boleto.id}
                                                className={`bg-card border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${isOverdue
                                                    ? 'border-red-500/30 hover:border-red-500/50'
                                                    : boleto.boletoStatus === 'paid'
                                                        ? 'border-border/50 opacity-70 hover:opacity-100'
                                                        : 'border-border hover:border-input'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${boleto.boletoStatus === 'paid'
                                                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                                                        : isOverdue
                                                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                                                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                        }`}>
                                                        <Barcode className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{boleto.description}</p>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{getDueDateText(boleto)}</span>
                                                            {boleto.installments && boleto.installments > 1 && (
                                                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                                                    {boleto.installmentNumber || 1}/{boleto.installments}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                    <div className="text-right">
                                                        <p className="font-bold text-foreground">{formatCurrency(boleto.amount)}</p>
                                                        <Badge variant="outline" className={`
                                                            ${boleto.boletoStatus === 'paid'
                                                                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                                                : isOverdue
                                                                    ? 'border-red-500/30 text-red-400 bg-red-500/10'
                                                                    : 'border-blue-500/30 text-blue-400 bg-blue-500/10'}
                                                        `}>
                                                            {boleto.boletoStatus === 'paid' ? 'Pago' :
                                                                isOverdue ? 'Vencido' : 'A Vencer'}
                                                        </Badge>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="bg-popover border-border">
                                                            {boleto.boletoStatus !== 'paid' && (
                                                                <DropdownMenuItem
                                                                    className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10"
                                                                    onClick={() => handlePay(boleto)}
                                                                >
                                                                    <Wallet className="w-4 h-4 mr-2" />
                                                                    Pagar
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="text-muted-foreground focus:text-foreground focus:bg-muted"
                                                                onClick={() => handleEdit(boleto)}
                                                            >
                                                                <Pencil className="w-4 h-4 mr-2" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                                                                onClick={() => handleDelete(boleto.id)}
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
                        ))
                    )}
                </div>
            </div>

            <TransactionModal
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setEditingTransaction(null);
                }}
                type="despesa"
                initialData={editingTransaction}
                defaultPaymentMethod="boleto"
            />

            {/* Modal de Pagamento */}
            <Dialog open={payModal.open} onOpenChange={(open) => setPayModal({ open, boleto: null })}>
                <DialogContent className="bg-popover border-border max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-400" />
                            Pagar Boleto
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Confirme o pagamento e selecione a conta para debitar
                        </DialogDescription>
                    </DialogHeader>

                    {payModal.boleto && (
                        <div className="space-y-4">
                            {/* Detalhes do boleto */}
                            <div className="p-4 bg-muted/50 rounded-xl border border-input">
                                <p className="text-sm text-muted-foreground">Descrição</p>
                                <p className="text-foreground font-medium">{payModal.boleto.description}</p>
                                {payModal.boleto.installments && payModal.boleto.installments > 1 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Parcela {payModal.boleto.installmentNumber}/{payModal.boleto.installments}
                                    </p>
                                )}
                            </div>

                            <div className="p-4 bg-muted/50 rounded-xl border border-input">
                                <p className="text-sm text-muted-foreground">Valor a pagar</p>
                                <p className="text-2xl font-bold text-emerald-400">
                                    {formatCurrency(payModal.boleto.amount)}
                                </p>
                            </div>

                            {/* Seleção de conta */}
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Debitar de qual conta?</Label>
                                {accounts.length === 0 ? (
                                    <div className="p-4 rounded-lg bg-muted/50 border border-input text-center">
                                        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada</p>
                                        <Link
                                            href="/contas"
                                            onClick={() => setPayModal({ open: false, boleto: null })}
                                            className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 inline-block"
                                        >
                                            Criar conta
                                        </Link>
                                    </div>
                                ) : (
                                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                        <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                            <SelectValue placeholder="Selecione uma conta" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {accounts.map((acc) => {
                                                const bank = getBankByCode(acc.bankCode);
                                                const Icon = getIconById(bank.icon);
                                                return (
                                                    <SelectItem
                                                        key={acc.id}
                                                        value={acc.id}
                                                        className="text-muted-foreground focus:bg-muted focus:text-foreground"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-5 h-5 rounded flex items-center justify-center"
                                                                style={{ backgroundColor: acc.color }}
                                                            >
                                                                <Icon className="w-3 h-3 text-white" />
                                                            </div>
                                                            <span>{acc.name}</span>
                                                            <span className="text-muted-foreground text-xs ml-auto">
                                                                {formatCurrency(acc.balance)}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setPayModal({ open: false, boleto: null })}
                            className="text-muted-foreground"
                            disabled={paying}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmPayment}
                            disabled={paying || !selectedAccountId}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {paying ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Confirmar Pagamento
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
