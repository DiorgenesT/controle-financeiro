"use client";

import { useState, useEffect } from "react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Trash2,
    Loader2,
    Wallet,
    Pencil,
    MoreHorizontal,
    Star,
    Building,
    ArrowRightLeft,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Account } from "@/lib/accounts";
import { useAccounts } from "@/hooks/useAccounts";
import { addTransaction } from "@/lib/firestore";
import { BANKS, getBankByCode, ACCOUNT_TYPES, getAccountTypeLabel } from "@/lib/banks";
import { getIconById } from "@/lib/icons";
import { toast } from "sonner";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export default function ContasPage() {
    const { user } = useAuth();
    const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        bankCode: "nubank",
        type: "checking" as Account["type"],
        balance: "",
        isDefault: false,
    });

    const [transferDialog, setTransferDialog] = useState({
        open: false,
        sourceId: "",
        targetId: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "Transferência entre contas"
    });

    const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

    const openNewDialog = () => {
        setEditingAccount(null);
        setFormData({
            name: "",
            bankCode: "nubank",
            type: "checking",
            balance: "",
            isDefault: accounts.length === 0,
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (account: Account) => {
        setEditingAccount(account);
        setFormData({
            name: account.name,
            bankCode: account.bankCode,
            type: account.type,
            balance: account.balance.toString(),
            isDefault: account.isDefault,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return;

        setSaving(true);
        try {
            const bank = getBankByCode(formData.bankCode);
            const accountData = {
                name: formData.name || bank.name,
                bankCode: formData.bankCode,
                type: formData.type,
                balance: parseFloat(formData.balance) || 0,
                color: bank.color,
                isDefault: formData.isDefault,
            };

            if (editingAccount) {
                await updateAccount(editingAccount.id, accountData);
                toast.success("Conta atualizada!");
            } else {
                const accountId = await createAccount(accountData);

                // Criar transação de saldo inicial se houver saldo
                const initialBalance = parseFloat(formData.balance) || 0;
                if (initialBalance > 0) {
                    await addTransaction(user.uid, {
                        type: "receita",
                        description: `Saldo inicial - ${accountData.name}`,
                        amount: initialBalance,
                        category: "Saldo Inicial",
                        date: new Date(),
                        paymentMethod: "debit",
                        accountId: accountId,
                    });
                }

                toast.success("Conta criada!");
            }

            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar conta");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta conta?")) return;

        try {
            await deleteAccount(id);
            toast.success("Conta removida!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover conta");
        }
    };

    const handleSetDefault = async (account: Account) => {
        try {
            // Desmarcar outras como padrão está no serviço
            await updateAccount(account.id, { isDefault: true });
            toast.success("Conta definida como padrão!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao definir conta padrão");
        }
    };

    const handleTransfer = async () => {
        if (!user?.uid) return;
        const { sourceId, targetId, amount, date, description } = transferDialog;

        if (!sourceId || !targetId) {
            toast.error("Selecione as contas de origem e destino");
            return;
        }

        if (sourceId === targetId) {
            toast.error("A conta de destino deve ser diferente da origem");
            return;
        }

        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) {
            toast.error("Valor inválido");
            return;
        }

        setSaving(true);
        try {
            const sourceAccount = accounts.find(a => a.id === sourceId);
            const targetAccount = accounts.find(a => a.id === targetId);

            if (!sourceAccount || !targetAccount) {
                toast.error("Conta não encontrada");
                return;
            }

            // 1. Saída da conta de origem
            await addTransaction(user.uid, {
                type: "despesa",
                amount: value,
                category: "Transferência",
                description: `Transferência para: ${targetAccount.name} - ${description}`,
                date: new Date(date),
                paymentMethod: "debit",
                accountId: sourceId,
                isRecurring: false
            });
            await updateAccount(sourceId, { balance: sourceAccount.balance - value });

            // 2. Entrada na conta de destino
            await addTransaction(user.uid, {
                type: "receita",
                amount: value,
                category: "Transferência",
                description: `Recebido de: ${sourceAccount.name} - ${description}`,
                date: new Date(date),
                paymentMethod: "debit",
                accountId: targetId,
                isRecurring: false
            });
            await updateAccount(targetId, { balance: targetAccount.balance + value });

            toast.success("Transferência realizada com sucesso!");
            setTransferDialog(prev => ({ ...prev, open: false, amount: "", description: "Transferência entre contas" }));
        } catch (error) {
            console.error(error);
            toast.error("Erro ao realizar transferência");
        } finally {
            setSaving(false);
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingAccount(null);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header title="Contas" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                    <div>
                        <p className="text-muted-foreground">
                            Gerencie suas contas bancárias e carteiras digitais
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={() => setTransferDialog(prev => ({ ...prev, open: true }))}
                            variant="outline"
                            className="border-input text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Transferir
                        </Button>
                        <Button
                            onClick={openNewDialog}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Conta
                        </Button>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                        <DialogContent className="bg-background border-border max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">
                                    {editingAccount ? "Editar Conta" : "Nova Conta"}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    {editingAccount ? "Altere os dados da conta" : "Adicione uma nova conta bancária"}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Banco/Instituição</Label>
                                    <Select
                                        value={formData.bankCode}
                                        onValueChange={(v) => setFormData({ ...formData, bankCode: v })}
                                    >
                                        <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border max-h-60">
                                            {BANKS.map((bank) => {
                                                const Icon = getIconById(bank.icon);
                                                return (
                                                    <SelectItem
                                                        key={bank.code}
                                                        value={bank.code}
                                                        className="text-muted-foreground focus:bg-accent focus:text-foreground"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-4 h-4 rounded flex items-center justify-center"
                                                                style={{ backgroundColor: bank.color }}
                                                            >
                                                                <Icon className="w-3 h-3 text-white" />
                                                            </div>
                                                            {bank.name}
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Nome da Conta (opcional)</Label>
                                    <Input
                                        placeholder={getBankByCode(formData.bankCode).name}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-muted/50 border-input text-foreground"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Tipo</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(v) => setFormData({ ...formData, type: v as Account["type"] })}
                                        >
                                            <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border-border">
                                                {ACCOUNT_TYPES.map((type) => (
                                                    <SelectItem
                                                        key={type.value}
                                                        value={type.value}
                                                        className="text-muted-foreground focus:bg-accent focus:text-foreground"
                                                    >
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Saldo Inicial</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={formData.balance}
                                            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                            className="bg-muted/50 border-input text-foreground"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isDefault}
                                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                        className="w-4 h-4 rounded border-input bg-muted text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-muted-foreground">Definir como conta padrão</span>
                                </label>

                                {/* Preview */}
                                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: getBankByCode(formData.bankCode).color }}
                                        >
                                            {(() => {
                                                const Icon = getIconById(getBankByCode(formData.bankCode).icon);
                                                return <Icon className="w-5 h-5 text-white" />;
                                            })()}
                                        </div>
                                        <div>
                                            <p className="text-foreground font-medium">
                                                {formData.name || getBankByCode(formData.bankCode).name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {getAccountTypeLabel(formData.type)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={handleCloseDialog} className="text-muted-foreground">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {editingAccount ? "Salvar" : "Criar"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={transferDialog.open} onOpenChange={(open) => setTransferDialog(prev => ({ ...prev, open }))}>
                        <DialogContent className="bg-background border-border">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Transferência entre Contas</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Mova dinheiro entre suas contas
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">De (Origem)</Label>
                                        <Select
                                            value={transferDialog.sourceId}
                                            onValueChange={(value) => setTransferDialog(prev => ({ ...prev, sourceId: value }))}
                                        >
                                            <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border-border">
                                                {accounts.map((account) => (
                                                    <SelectItem key={account.id} value={account.id} className="text-muted-foreground focus:bg-accent focus:text-foreground">
                                                        {account.name} ({formatCurrency(account.balance)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Para (Destino)</Label>
                                        <Select
                                            value={transferDialog.targetId}
                                            onValueChange={(value) => setTransferDialog(prev => ({ ...prev, targetId: value }))}
                                        >
                                            <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border-border">
                                                {accounts
                                                    .filter(a => a.id !== transferDialog.sourceId)
                                                    .map((account) => (
                                                        <SelectItem key={account.id} value={account.id} className="text-muted-foreground focus:bg-accent focus:text-foreground">
                                                            {account.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Valor</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0,00"
                                            value={transferDialog.amount}
                                            onChange={(e) => setTransferDialog(prev => ({ ...prev, amount: e.target.value }))}
                                            className="bg-muted/50 border-input text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Data</Label>
                                        <Input
                                            type="date"
                                            value={transferDialog.date}
                                            onChange={(e) => setTransferDialog(prev => ({ ...prev, date: e.target.value }))}
                                            className="bg-muted/50 border-input text-foreground"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Descrição</Label>
                                    <Input
                                        placeholder="Ex: Transferência para poupança"
                                        value={transferDialog.description}
                                        onChange={(e) => setTransferDialog(prev => ({ ...prev, description: e.target.value }))}
                                        className="bg-muted/50 border-input text-foreground"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setTransferDialog(prev => ({ ...prev, open: false }))} className="text-muted-foreground">
                                    Cancelar
                                </Button>
                                <Button onClick={handleTransfer} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Confirmar Transferência
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Saldo Total */}
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-none shadow-lg shadow-emerald-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-white/80 font-medium">Saldo Total em Contas</p>
                                {loading ? (
                                    <div className="h-9 w-40 bg-white/20 rounded animate-pulse mt-1" />
                                ) : (
                                    <p className={`text-3xl font-bold mt-1 text-white`}>
                                        {formatCurrency(totalBalance)}
                                    </p>
                                )}
                            </div>
                            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Wallet className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Contas */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Building className="w-5 h-5 text-emerald-400" />
                            Suas Contas
                            <Building className="w-5 h-5 text-emerald-400" />
                            Suas Contas
                            <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">
                                {accounts.length}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Gerencie suas contas bancárias
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
                                ))}
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className="text-center py-12">
                                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Nenhuma conta cadastrada</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Adicione sua primeira conta para começar
                                </p>
                                <Button
                                    onClick={openNewDialog}
                                    className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar Conta
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {accounts.map((account) => {
                                    const bank = getBankByCode(account.bankCode);
                                    const Icon = getIconById(bank.icon);
                                    return (
                                        <div
                                            key={account.id}
                                            className="p-4 rounded-xl transition-colors group relative shadow-lg"
                                            style={{
                                                background: `linear-gradient(135deg, ${account.color}, ${account.color}dd)`
                                            }}
                                        >
                                            {account.isDefault && (
                                                <Badge className="absolute top-2 right-2 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                                                    <Star className="w-3 h-3 mr-1 fill-white" />
                                                    Padrão
                                                </Badge>
                                            )}
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/20 backdrop-blur-sm"
                                                >
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-white truncate">{account.name}</p>
                                                    <p className="text-xs text-white/80">{getAccountTypeLabel(account.type)}</p>
                                                    <p className="text-lg font-bold mt-2 text-white">
                                                        {formatCurrency(account.balance)}
                                                    </p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-popover border-border">
                                                        <DropdownMenuItem
                                                            className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent"
                                                            onClick={() => openEditDialog(account)}
                                                        >
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        {!account.isDefault && (
                                                            <DropdownMenuItem
                                                                className="text-yellow-400 hover:text-yellow-300 focus:text-yellow-300 focus:bg-yellow-500/10"
                                                                onClick={() => handleSetDefault(account)}
                                                            >
                                                                <Star className="w-4 h-4 mr-2" />
                                                                Definir como padrão
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                                                            onClick={() => handleDelete(account.id)}
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
