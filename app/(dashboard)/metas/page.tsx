"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Plus,
    Target,
    Calendar,
    MoreHorizontal,
    Pencil,
    Trash2,
    TrendingUp,
    CheckCircle2,
    Clock,
    Loader2,
    Shield,
    Plane,
    Car,
    Home,
    Laptop,
    BookOpen,
    Coins,
    Gift,
    Dumbbell
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getGoals, addGoal, deleteGoal, updateGoal, addTransaction } from "@/lib/firestore";
import { updateAccountBalance } from "@/lib/accounts";
import { useAccounts } from "@/hooks/useAccounts";
import { Goal } from "@/types";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const GOAL_ICONS = [
    { id: "target", icon: Target, name: "Meta" },
    { id: "shield", icon: Shield, name: "Emergência" },
    { id: "plane", icon: Plane, name: "Viagem" },
    { id: "car", icon: Car, name: "Carro" },
    { id: "home", icon: Home, name: "Casa" },
    { id: "laptop", icon: Laptop, name: "Tecnologia" },
    { id: "book", icon: BookOpen, name: "Educação" },
    { id: "coins", icon: Coins, name: "Investimento" },
    { id: "gift", icon: Gift, name: "Presente" },
    { id: "dumbbell", icon: Dumbbell, name: "Saúde" },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const getDaysRemaining = (deadline: Date) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

export default function MetasPage() {
    const { user } = useAuth();
    const { accounts } = useAccounts();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newMeta, setNewMeta] = useState({
        title: "",
        description: "",
        targetAmount: "",
        deadline: "",
        icon: "target",
        linkedAccountId: "none"
    });

    const fetchGoals = useCallback(async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const data = await getGoals(user.uid);
            setGoals(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar metas");
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const metasEmProgresso = goals.filter(m => m.status === "em_progresso");
    const metasConcluidas = goals.filter(m => m.status === "concluida");

    const totalMetas = metasEmProgresso.reduce((acc, m) => acc + m.targetAmount, 0);
    const totalAtual = metasEmProgresso.reduce((acc, m) => acc + m.currentAmount, 0);
    const progressoGeral = totalMetas > 0 ? (totalAtual / totalMetas) * 100 : 0;

    const getIconComponent = (iconId: string) => {
        const item = GOAL_ICONS.find(i => i.id === iconId);
        return item?.icon || Target;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return;

        setSaving(true);
        try {
            const goalData = {
                title: newMeta.title,
                targetAmount: parseFloat(newMeta.targetAmount),
                currentAmount: 0,
                deadline: new Date(newMeta.deadline),
                icon: newMeta.icon,
                linkedAccountId: newMeta.linkedAccountId !== "none" ? newMeta.linkedAccountId : undefined,
                description: newMeta.description.trim() || undefined
            };

            await addGoal(user.uid, goalData);

            toast.success("Meta criada com sucesso!");
            setIsDialogOpen(false);
            setNewMeta({
                title: "",
                description: "",
                targetAmount: "",
                deadline: "",
                icon: "target",
                linkedAccountId: "none"
            });
            fetchGoals();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar meta");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteGoal(id);
            toast.success("Meta removida!");
            fetchGoals();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover meta");
        }
    };

    const [addValueDialog, setAddValueDialog] = useState<{
        open: boolean;
        goal: Goal | null;
        amount: string;
        sourceAccountId: string;
    }>({
        open: false,
        goal: null,
        amount: "",
        sourceAccountId: "none"
    });

    const handleAddValueClick = (goal: Goal) => {
        setAddValueDialog({
            open: true,
            goal,
            amount: "",
            sourceAccountId: "none"
        });
    };

    const confirmAddValue = async () => {
        const goal = addValueDialog.goal;
        if (!goal || !user?.uid) return;

        const value = parseFloat(addValueDialog.amount);
        if (isNaN(value) || value <= 0) {
            toast.error("Valor inválido");
            return;
        }

        setSaving(true);
        try {
            // Se tiver conta de origem selecionada e for diferente da conta vinculada
            if (addValueDialog.sourceAccountId !== "none" &&
                addValueDialog.sourceAccountId !== goal.linkedAccountId) {

                const sourceAccount = accounts.find(a => a.id === addValueDialog.sourceAccountId);
                const targetAccount = accounts.find(a => a.id === goal.linkedAccountId);

                if (sourceAccount) {
                    // 1. Saída da conta de origem
                    await addTransaction(user.uid, {
                        type: "despesa",
                        amount: value,
                        category: "Transferência", // Idealmente buscar ID da categoria
                        description: `Transferência para meta: ${goal.title}`,
                        date: new Date(),
                        paymentMethod: "debit",
                        accountId: sourceAccount.id,
                        isRecurring: false
                    });
                    await updateAccountBalance(sourceAccount.id, value, "subtract");

                    // 2. Entrada na conta vinculada (se existir)
                    if (targetAccount) {
                        await addTransaction(user.uid, {
                            type: "receita",
                            amount: value,
                            category: "Transferência",
                            description: `Recebido de: ${sourceAccount.name} (Meta)`,
                            date: new Date(),
                            paymentMethod: "debit",
                            accountId: targetAccount.id,
                            isRecurring: false
                        });
                        await updateAccountBalance(targetAccount.id, value, "add");
                    }
                }
            } else if (goal.linkedAccountId) {
                // Se não selecionou origem, mas tem conta vinculada, apenas atualiza saldo da vinculada (depósito direto)
                // Assumindo que o dinheiro "apareceu" lá (ex: depósito)
                const targetAccount = accounts.find(a => a.id === goal.linkedAccountId);
                if (targetAccount) {
                    await addTransaction(user.uid, {
                        type: "receita",
                        amount: value,
                        category: "Investimentos",
                        description: `Depósito para meta: ${goal.title}`,
                        date: new Date(),
                        paymentMethod: "debit",
                        accountId: targetAccount.id,
                        isRecurring: false
                    });
                    await updateAccountBalance(targetAccount.id, value, "add");
                }
            }

            // Atualiza a meta
            const newAmount = goal.currentAmount + value;
            const newStatus = newAmount >= goal.targetAmount ? "concluida" : "em_progresso";

            await updateGoal(goal.id, {
                currentAmount: newAmount,
                status: newStatus
            });

            if (newStatus === "concluida") {
                toast.success("Parabéns! Meta concluída! 🎉");
            } else {
                toast.success(`${formatCurrency(value)} adicionado à meta!`);
            }

            setAddValueDialog(prev => ({ ...prev, open: false }));
            fetchGoals();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar meta");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header title="Metas Financeiras" />

            <div className="p-6 space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                    <div>
                        <p className="text-muted-foreground">
                            Acompanhe seu progresso em direção aos seus objetivos
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25">
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Meta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-background border-border">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Criar Nova Meta</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Defina um objetivo financeiro para alcançar
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Ícone</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {GOAL_ICONS.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setNewMeta({ ...newMeta, icon: item.id })}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${newMeta.icon === item.id
                                                        ? "bg-purple-500/30 border-2 border-purple-500"
                                                        : "bg-muted border border-input hover:bg-accent"
                                                        }`}
                                                    title={item.name}
                                                >
                                                    <Icon className="w-5 h-5 text-purple-400" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Título da Meta</Label>
                                    <Input
                                        placeholder="Ex: Fundo de Emergência"
                                        value={newMeta.title}
                                        onChange={(e) => setNewMeta({ ...newMeta, title: e.target.value })}
                                        className="bg-muted/50 border-input text-foreground"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Descrição (opcional)</Label>
                                    <Input
                                        placeholder="Ex: 6 meses de despesas"
                                        value={newMeta.description}
                                        onChange={(e) => setNewMeta({ ...newMeta, description: e.target.value })}
                                        className="bg-muted/50 border-input text-foreground"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Valor da Meta</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="1"
                                            placeholder="0,00"
                                            value={newMeta.targetAmount}
                                            onChange={(e) => setNewMeta({ ...newMeta, targetAmount: e.target.value })}
                                            className="bg-muted/50 border-input text-foreground"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Prazo</Label>
                                        <Input
                                            type="date"
                                            value={newMeta.deadline}
                                            onChange={(e) => setNewMeta({ ...newMeta, deadline: e.target.value })}
                                            className="bg-muted/50 border-input text-foreground"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Conta Vinculada (Opcional)</Label>
                                    <Select
                                        value={newMeta.linkedAccountId}
                                        onValueChange={(value) => setNewMeta({ ...newMeta, linkedAccountId: value })}
                                    >
                                        <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                            <SelectValue placeholder="Selecione uma conta" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border">
                                            <SelectItem value="none" className="text-muted-foreground">Nenhuma</SelectItem>
                                            {accounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id} className="text-muted-foreground focus:bg-accent focus:text-foreground">
                                                    {account.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Se selecionada, o valor da meta será considerado parte do saldo desta conta.
                                    </p>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Criar Meta
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={addValueDialog.open} onOpenChange={(open) => setAddValueDialog(prev => ({ ...prev, open }))}>
                        <DialogContent className="bg-background border-border">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Adicionar Valor</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Adicione dinheiro à sua meta {addValueDialog.goal?.title}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Valor</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="0,00"
                                        value={addValueDialog.amount}
                                        onChange={(e) => setAddValueDialog(prev => ({ ...prev, amount: e.target.value }))}
                                        className="bg-muted/50 border-input text-foreground"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Conta de Origem (Opcional)</Label>
                                    <Select
                                        value={addValueDialog.sourceAccountId}
                                        onValueChange={(value) => setAddValueDialog(prev => ({ ...prev, sourceAccountId: value }))}
                                    >
                                        <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                            <SelectValue placeholder="Selecione a conta de origem" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border">
                                            <SelectItem value="none" className="text-muted-foreground">Nenhuma (Apenas registrar)</SelectItem>
                                            {accounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id} className="text-muted-foreground focus:bg-accent focus:text-foreground">
                                                    {account.name} ({formatCurrency(account.balance)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Se selecionada, o valor será debitado desta conta.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setAddValueDialog(prev => ({ ...prev, open: false }))} className="text-muted-foreground">
                                    Cancelar
                                </Button>
                                <Button onClick={confirmAddValue} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Confirmar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Progress Summary */}
                <Card className="bg-gradient-to-br from-purple-500 to-purple-700 border-none text-white shadow-lg shadow-purple-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm text-white/80">Progresso Geral</p>
                                {loading ? (
                                    <Skeleton className="h-9 w-48 bg-white/20 mt-1" />
                                ) : (
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {formatCurrency(totalAtual)} <span className="text-lg text-white/60">/ {formatCurrency(totalMetas)}</span>
                                    </p>
                                )}
                            </div>
                            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                                <Target className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        {!loading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/80">{metasEmProgresso.length} metas em andamento</span>
                                    <span className="text-white font-bold">{progressoGeral.toFixed(1)}%</span>
                                </div>
                                <div className="h-3 rounded-full bg-black/20 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-white transition-all duration-500"
                                        style={{ width: `${progressoGeral}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Metas em Progresso */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        Em Andamento
                    </h3>

                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="bg-card border-border">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start gap-3">
                                            <Skeleton className="w-12 h-12 rounded-xl bg-muted" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-32 bg-muted" />
                                                <Skeleton className="h-3 w-24 bg-muted" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-2 w-full bg-muted rounded-full" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : metasEmProgresso.length === 0 ? (
                        <Card className="bg-card border-border">
                            <CardContent className="py-12 text-center">
                                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Nenhuma meta em andamento</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Crie sua primeira meta clicando no botão acima
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {metasEmProgresso.map((meta) => {
                                const percentage = (meta.currentAmount / meta.targetAmount) * 100;
                                const daysRemaining = getDaysRemaining(meta.deadline);
                                const Icon = getIconComponent(meta.icon || "target");

                                return (
                                    <Card key={meta.id} className="bg-gradient-to-br from-indigo-500 to-indigo-700 border-none text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all duration-300 group">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                                        <Icon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-white text-base">{meta.title}</CardTitle>
                                                        {meta.description && (
                                                            <CardDescription className="text-white/70 text-sm">
                                                                {meta.description}
                                                            </CardDescription>
                                                        )}
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white hover:bg-white/20 h-8 w-8"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-popover border-border">
                                                        <DropdownMenuItem
                                                            className="text-foreground hover:text-foreground focus:text-foreground focus:bg-accent"
                                                            onClick={() => handleAddValueClick(meta)}
                                                        >
                                                            <TrendingUp className="w-4 h-4 mr-2" />
                                                            Adicionar Valor
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-foreground hover:text-foreground focus:text-foreground focus:bg-accent">
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                                                            onClick={() => handleDelete(meta.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-white/80">
                                                        {formatCurrency(meta.currentAmount)}
                                                    </span>
                                                    <span className="text-white font-medium">
                                                        {formatCurrency(meta.targetAmount)}
                                                    </span>
                                                </div>
                                                <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-white transition-all duration-500"
                                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-white/80">{percentage.toFixed(0)}%</span>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-xs border-none ${daysRemaining < 30
                                                            ? "bg-amber-500 text-white"
                                                            : "bg-white/20 text-white"
                                                            }`}
                                                    >
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {daysRemaining > 0 ? `${daysRemaining} dias` : "Vencido"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Metas Concluídas */}
                {metasConcluidas.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            Concluídas
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {metasConcluidas.map((meta) => {
                                const Icon = getIconComponent(meta.icon || "target");
                                return (
                                    <Card key={meta.id} className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-none text-white shadow-lg shadow-emerald-500/20 opacity-90 hover:opacity-100 transition-opacity">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{meta.title}</p>
                                                    <p className="text-sm text-white/90 flex items-center gap-1">
                                                        {formatCurrency(meta.targetAmount)}
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
