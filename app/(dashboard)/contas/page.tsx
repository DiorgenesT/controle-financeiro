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
        <div className="min-h-screen bg-zinc-950">
            <Header title="Contas" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-zinc-400">
                            Gerencie suas contas bancárias e carteiras digitais
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={() => setTransferDialog(prev => ({ ...prev, open: true }))}
                            variant="outline"
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
                        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-white">
                                    {editingAccount ? "Editar Conta" : "Nova Conta"}
                                </DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    {editingAccount ? "Altere os dados da conta" : "Adicione uma nova conta bancária"}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Banco/Instituição</Label>
                                    <Select
                                        value={formData.bankCode}
                                        onValueChange={(v) => setFormData({ ...formData, bankCode: v })}
                                    >
                                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
                                            {BANKS.map((bank) => {
                                                const Icon = getIconById(bank.icon);
                                                return (
                                                    <SelectItem
                                                        key={bank.code}
                                                        value={bank.code}
                                                        className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
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
                                    <Label className="text-zinc-300">Nome da Conta (opcional)</Label>
                                    <Input
                                        placeholder={getBankByCode(formData.bankCode).name}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-zinc-800/50 border-zinc-700 text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Tipo</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(v) => setFormData({ ...formData, type: v as Account["type"] })}
                                        >
                                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                                {ACCOUNT_TYPES.map((type) => (
                                                    <SelectItem
                                                        key={type.value}
                                                        value={type.value}
                                                        className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                                                    >
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Saldo Inicial</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={formData.balance}
                                            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                            className="bg-zinc-800/50 border-zinc-700 text-white"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isDefault}
                                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-zinc-300">Definir como conta padrão</span>
                                </label>

                                {/* Preview */}
                                <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                                    <p className="text-xs text-zinc-400 mb-2">Preview:</p>
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
                                            <p className="text-white font-medium">
                                                {formData.name || getBankByCode(formData.bankCode).name}
                                            </p>
                                            <p className="text-xs text-zinc-400">
                                                {getAccountTypeLabel(formData.type)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={handleCloseDialog} className="text-zinc-400">
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
                        <DialogContent className="bg-zinc-900 border-zinc-800">
                            <DialogHeader>
                                <DialogTitle className="text-white">Transferência entre Contas</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Mova dinheiro entre suas contas
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">De (Origem)</Label>
                                        <Select
                                            value={transferDialog.sourceId}
                                            onValueChange={(value) => setTransferDialog(prev => ({ ...prev, sourceId: value }))}
                                        >
                                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                                {accounts.map((account) => (
                                                    <SelectItem key={account.id} value={account.id} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                                                        {account.name} ({formatCurrency(account.balance)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Para (Destino)</Label>
                                        <Select
                                            value={transferDialog.targetId}
                                            onValueChange={(value) => setTransferDialog(prev => ({ ...prev, targetId: value }))}
                                        >
                                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                                {accounts
                                                    .filter(a => a.id !== transferDialog.sourceId)
                                                    .map((account) => (
                                                        <SelectItem key={account.id} value={account.id} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                                                            {account.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Valor</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0,00"
                                            value={transferDialog.amount}
                                            onChange={(e) => setTransferDialog(prev => ({ ...prev, amount: e.target.value }))}
                                            className="bg-zinc-800/50 border-zinc-700 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Data</Label>
                                        <Input
                                            type="date"
                                            value={transferDialog.date}
                                            onChange={(e) => setTransferDialog(prev => ({ ...prev, date: e.target.value }))}
                                            className="bg-zinc-800/50 border-zinc-700 text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Descrição</Label>
                                    <Input
                                        placeholder="Ex: Transferência para poupança"
                                        value={transferDialog.description}
                                        onChange={(e) => setTransferDialog(prev => ({ ...prev, description: e.target.value }))}
                                        className="bg-zinc-800/50 border-zinc-700 text-white"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setTransferDialog(prev => ({ ...prev, open: false }))} className="text-zinc-400">
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
                <Card className="bg-gradient-to-br from-emerald-900/30 to-zinc-900/50 border-emerald-800/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-400">Saldo Total em Contas</p>
                                {loading ? (
                                    <div className="h-9 w-40 bg-zinc-800 rounded animate-pulse mt-1" />
                                ) : (
                                    <p className={`text-3xl font-bold mt-1 ${totalBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                                        {formatCurrency(totalBalance)}
                                    </p>
                                )}
                            </div>
                            <div className="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Wallet className="w-8 h-8 text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Contas */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Building className="w-5 h-5 text-emerald-400" />
                            Suas Contas
                            <Badge variant="secondary" className="ml-2 bg-zinc-800 text-zinc-300">
                                {accounts.length}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Gerencie suas contas bancárias
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-28 rounded-lg bg-zinc-800/50 animate-pulse" />
                                ))}
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className="text-center py-12">
                                <Wallet className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-400">Nenhuma conta cadastrada</p>
                                <p className="text-sm text-zinc-500 mt-1">
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
                                            className="p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors group relative"
                                        >
                                            {account.isDefault && (
                                                <Badge className="absolute top-2 right-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                                    <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                                                    Padrão
                                                </Badge>
                                            )}
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: account.color }}
                                                >
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-white truncate">{account.name}</p>
                                                    <p className="text-xs text-zinc-400">{getAccountTypeLabel(account.type)}</p>
                                                    <p className={`text-lg font-bold mt-2 ${account.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {formatCurrency(account.balance)}
                                                    </p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white h-8 w-8"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                                                        <DropdownMenuItem
                                                            className="text-zinc-300 hover:text-white focus:text-white focus:bg-zinc-800"
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
