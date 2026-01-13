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
    CreditCard as CreditCardIcon,
    Pencil,
    MoreHorizontal,
    Calendar,
    Receipt,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import {
    getCreditCards,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
    getInvoices,
    getOrCreateInvoice,
    CreditCard,
} from "@/lib/creditCards";
import { getAccounts, Account } from "@/lib/accounts";
import { CreditCardInvoice } from "@/types";
import { BANKS, getBankByCode } from "@/lib/banks";
import { getIconById } from "@/lib/icons";
import { toast } from "sonner";
import { PayInvoiceModal } from "@/components/PayInvoiceModal";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const CLOSING_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function CartoesPage() {
    const { user } = useAuth();
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [invoices, setInvoices] = useState<Record<string, CreditCardInvoice[]>>({});
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<CreditCardInvoice | null>(null);
    const [selectedCardName, setSelectedCardName] = useState("");

    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        bankCode: "nubank",
        limit: "",
        closingDay: "1",
        dueDay: "10",
        lastFourDigits: "",
    });

    const fetchCards = useCallback(async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const [cardsData, accountsData] = await Promise.all([
                getCreditCards(user.uid),
                getAccounts(user.uid)
            ]);

            setCards(cardsData);
            setAccounts(accountsData);

            // Buscar faturas de cada cartão
            const invoicesMap: Record<string, CreditCardInvoice[]> = {};
            for (const card of cardsData) {
                // Criar fatura do mês atual se não existir
                const now = new Date();
                await getOrCreateInvoice(
                    card.id,
                    user.uid,
                    now.getMonth() + 1,
                    now.getFullYear(),
                    card.closingDay,
                    card.dueDay
                );
                invoicesMap[card.id] = await getInvoices(card.id, user.uid);
            }
            setInvoices(invoicesMap);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    const openNewDialog = () => {
        setEditingCard(null);
        setFormData({
            name: "",
            bankCode: "nubank",
            limit: "",
            closingDay: "1",
            dueDay: "10",
            lastFourDigits: "",
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (card: CreditCard) => {
        setEditingCard(card);
        setFormData({
            name: card.name,
            bankCode: card.bankCode,
            limit: card.limit.toString(),
            closingDay: card.closingDay.toString(),
            dueDay: card.dueDay.toString(),
            lastFourDigits: card.lastFourDigits || "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return;

        setSaving(true);
        try {
            const bank = getBankByCode(formData.bankCode);
            const cardData = {
                name: formData.name || `${bank.name} ${formData.lastFourDigits ? `****${formData.lastFourDigits}` : ""}`.trim(),
                bankCode: formData.bankCode,
                limit: parseFloat(formData.limit) || 0,
                closingDay: parseInt(formData.closingDay),
                dueDay: parseInt(formData.dueDay),
                color: bank.color,
                lastFourDigits: formData.lastFourDigits,
            };

            if (editingCard) {
                await updateCreditCard(editingCard.id, cardData);
                toast.success("Cartão atualizado!");
            } else {
                await createCreditCard(user.uid, cardData);
                toast.success("Cartão criado!");
            }

            setIsDialogOpen(false);
            fetchCards();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar cartão");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este cartão?")) return;

        try {
            await deleteCreditCard(id);
            toast.success("Cartão removido!");
            fetchCards();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover cartão");
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingCard(null);
    };

    const getCurrentInvoice = (cardId: string): CreditCardInvoice | undefined => {
        const cardInvoices = invoices[cardId] || [];
        const now = new Date();
        // Tenta pegar a fatura aberta do mês atual, ou a última aberta/fechada
        // Melhorar lógica: Ordenar por data e pegar a mais relevante
        return cardInvoices.find(inv =>
            inv.month === now.getMonth() + 1 && inv.year === now.getFullYear()
        ) || cardInvoices[0];
    };

    const getNextInvoice = (cardId: string): CreditCardInvoice | undefined => {
        const cardInvoices = invoices[cardId] || [];
        const now = new Date();
        let nextMonth = now.getMonth() + 2; // Próximo mês
        let nextYear = now.getFullYear();

        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear += 1;
        }

        return cardInvoices.find(inv =>
            inv.month === nextMonth && inv.year === nextYear
        );
    };

    const totalLimit = cards.reduce((acc, c) => acc + c.limit, 0);
    const totalUsed = Object.values(invoices).flat()
        .filter(inv => inv.status === "open")
        .reduce((acc, inv) => acc + inv.totalAmount, 0);

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header title="Cartões" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-zinc-400">
                            Gerencie seus cartões de crédito e faturas
                        </p>
                    </div>

                    <Button
                        onClick={openNewDialog}
                        className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white shadow-lg shadow-violet-500/25"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Cartão
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-white">
                                    {editingCard ? "Editar Cartão" : "Novo Cartão"}
                                </DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    {editingCard ? "Altere os dados do cartão" : "Adicione um novo cartão de crédito"}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Banco Emissor</Label>
                                    <Select
                                        value={formData.bankCode}
                                        onValueChange={(v) => setFormData({ ...formData, bankCode: v })}
                                    >
                                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
                                            {BANKS.filter(b => b.code !== "dinheiro").map((bank) => {
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Nome do Cartão</Label>
                                        <Input
                                            placeholder="Ex: Platinium, Gold..."
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="bg-zinc-800/50 border-zinc-700 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Últimos 4 dígitos</Label>
                                        <Input
                                            placeholder="1234"
                                            maxLength={4}
                                            value={formData.lastFourDigits}
                                            onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value.replace(/\D/g, "") })}
                                            className="bg-zinc-800/50 border-zinc-700 text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Limite</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="5000,00"
                                        value={formData.limit}
                                        onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                                        className="bg-zinc-800/50 border-zinc-700 text-white"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Dia de Fechamento</Label>
                                        <Select
                                            value={formData.closingDay}
                                            onValueChange={(v) => setFormData({ ...formData, closingDay: v })}
                                        >
                                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 max-h-48">
                                                {CLOSING_DAYS.map((day) => (
                                                    <SelectItem
                                                        key={day}
                                                        value={day.toString()}
                                                        className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                                                    >
                                                        Dia {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Dia de Vencimento</Label>
                                        <Select
                                            value={formData.dueDay}
                                            onValueChange={(v) => setFormData({ ...formData, dueDay: v })}
                                        >
                                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 max-h-48">
                                                {CLOSING_DAYS.map((day) => (
                                                    <SelectItem
                                                        key={day}
                                                        value={day.toString()}
                                                        className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                                                    >
                                                        Dia {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Preview do Cartão */}
                                <div
                                    className="p-4 rounded-xl relative overflow-hidden"
                                    style={{
                                        background: `linear-gradient(135deg, ${getBankByCode(formData.bankCode).color}dd, ${getBankByCode(formData.bankCode).color}88)`
                                    }}
                                >
                                    <div className="absolute inset-0 opacity-10">
                                        <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/20" />
                                        <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-white/10" />
                                    </div>
                                    <div className="relative">
                                        <p className="text-white/70 text-xs mb-4">{getBankByCode(formData.bankCode).name}</p>
                                        <p className="text-white font-mono text-lg tracking-widest mb-4">
                                            •••• •••• •••• {formData.lastFourDigits || "••••"}
                                        </p>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-white/70 text-xs">LIMITE</p>
                                                <p className="text-white font-semibold">{formatCurrency(parseFloat(formData.limit) || 0)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white/70 text-xs">VENCE</p>
                                                <p className="text-white font-semibold">TODO DIA {formData.dueDay}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={handleCloseDialog} className="text-zinc-400">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {editingCard ? "Salvar" : "Criar"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Resumo de Limites */}
                <Card className="bg-gradient-to-br from-violet-900/30 to-zinc-900/50 border-violet-800/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm text-violet-400">Limite Total Disponível</p>
                                {loading ? (
                                    <div className="h-9 w-40 bg-zinc-800 rounded animate-pulse mt-1" />
                                ) : (
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {formatCurrency(totalLimit - totalUsed)}
                                    </p>
                                )}
                            </div>
                            <div className="w-16 h-16 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                <CreditCardIcon className="w-8 h-8 text-violet-400" />
                            </div>
                        </div>
                        {!loading && totalLimit > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Usado: {formatCurrency(totalUsed)}</span>
                                    <span className="text-zinc-400">Limite: {formatCurrency(totalLimit)}</span>
                                </div>
                                <Progress value={(totalUsed / totalLimit) * 100} className="h-2 bg-zinc-800" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Lista de Cartões */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <CreditCardIcon className="w-5 h-5 text-violet-400" />
                            Seus Cartões
                            <Badge variant="secondary" className="ml-2 bg-zinc-800 text-zinc-300">
                                {cards.length}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Gerencie seus cartões de crédito
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-48 rounded-xl bg-zinc-800/50 animate-pulse" />
                                ))}
                            </div>
                        ) : cards.length === 0 ? (
                            <div className="text-center py-12">
                                <CreditCardIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-400">Nenhum cartão cadastrado</p>
                                <p className="text-sm text-zinc-500 mt-1">
                                    Adicione seu primeiro cartão de crédito
                                </p>
                                <Button
                                    onClick={openNewDialog}
                                    className="mt-4 bg-violet-600 hover:bg-violet-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar Cartão
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cards.map((card) => {
                                    const bank = getBankByCode(card.bankCode);
                                    const Icon = getIconById(bank.icon);
                                    const currentInvoice = getCurrentInvoice(card.id);
                                    const nextInvoice = getNextInvoice(card.id);
                                    const usedAmount = currentInvoice?.totalAmount || 0;
                                    const usedPercent = (usedAmount / card.limit) * 100;

                                    return (
                                        <div
                                            key={card.id}
                                            className="rounded-xl overflow-hidden group relative"
                                        >
                                            {/* Cartão visual */}
                                            <div
                                                className="p-4 relative overflow-hidden"
                                                style={{
                                                    background: `linear-gradient(135deg, ${card.color}dd, ${card.color}88)`
                                                }}
                                            >
                                                <div className="absolute inset-0 opacity-10">
                                                    <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/20" />
                                                    <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-white/10" />
                                                </div>
                                                <div className="relative">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <p className="text-white/70 text-xs">{bank.name}</p>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                                                                >
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                                                                <DropdownMenuItem
                                                                    className="text-zinc-300 hover:text-white focus:text-white focus:bg-zinc-800"
                                                                    onClick={() => openEditDialog(card)}
                                                                >
                                                                    <Pencil className="w-4 h-4 mr-2" />
                                                                    Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                                                                    onClick={() => handleDelete(card.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Excluir
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    <p className="text-white font-mono text-lg tracking-widest mb-4">
                                                        •••• •••• •••• {card.lastFourDigits || "••••"}
                                                    </p>
                                                    <p className="text-white font-medium">{card.name}</p>
                                                </div>
                                            </div>

                                            {/* Info da fatura */}
                                            <div className="bg-zinc-800/80 p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Receipt className="w-4 h-4 text-zinc-400" />
                                                        <span className="text-zinc-300">Fatura Atual</span>
                                                    </div>
                                                    {currentInvoice?.status === "paid" ? (
                                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Paga
                                                        </Badge>
                                                    ) : currentInvoice?.status === "closed" ? (
                                                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Fechada
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                            Aberta
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-2xl font-bold text-white">{formatCurrency(usedAmount)}</p>
                                                        <p className="text-xs text-zinc-400">de {formatCurrency(card.limit)}</p>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-2">
                                                        <div className="flex items-center gap-1 text-sm text-zinc-400">
                                                            <Calendar className="w-3 h-3" />
                                                            Vence dia {card.dueDay}
                                                        </div>
                                                        {currentInvoice && currentInvoice.status !== "paid" && usedAmount > 0 && (
                                                            <Button
                                                                size="sm"
                                                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                onClick={() => {
                                                                    setSelectedInvoice(currentInvoice);
                                                                    setSelectedCardName(card.name);
                                                                    setPayModalOpen(true);
                                                                }}
                                                            >
                                                                Pagar Fatura
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                <Progress
                                                    value={usedPercent}
                                                    className={`h-2 ${usedPercent > 80 ? 'bg-red-900/50' : 'bg-zinc-700'}`}
                                                />

                                                {nextInvoice && nextInvoice.totalAmount > 0 && (
                                                    <div className="pt-3 mt-3 border-t border-zinc-700/50 flex justify-between items-center text-xs">
                                                        <span className="text-zinc-400">Próximo Mês ({nextInvoice.month.toString().padStart(2, '0')}/{nextInvoice.year})</span>
                                                        <span className="text-zinc-300 font-medium">{formatCurrency(nextInvoice.totalAmount)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <PayInvoiceModal
                isOpen={payModalOpen}
                onClose={() => setPayModalOpen(false)}
                invoice={selectedInvoice}
                cardName={selectedCardName}
                accounts={accounts}
                onSuccess={fetchCards}
            />
        </div>
    );
}
