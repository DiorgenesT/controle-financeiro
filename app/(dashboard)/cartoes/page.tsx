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
import { InvoiceDetailsModal } from "@/components/InvoiceDetailsModal";

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
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<CreditCardInvoice | null>(null);

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
        <div className="min-h-screen bg-background">
            <Header title="Cartões" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                    <div>
                        <p className="text-muted-foreground">
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
                        <DialogContent className="bg-popover border-border max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">
                                    {editingCard ? "Editar Cartão" : "Novo Cartão"}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    {editingCard ? "Altere os dados do cartão" : "Adicione um novo cartão de crédito"}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Banco Emissor</Label>
                                    <Select
                                        value={formData.bankCode}
                                        onValueChange={(v) => setFormData({ ...formData, bankCode: v })}
                                    >
                                        <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border max-h-60">
                                            {BANKS.filter(b => b.code !== "dinheiro").map((bank) => {
                                                const Icon = getIconById(bank.icon);
                                                return (
                                                    <SelectItem
                                                        key={bank.code}
                                                        value={bank.code}
                                                        className="text-muted-foreground focus:bg-muted focus:text-foreground"
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
                                        <Label className="text-muted-foreground">Nome do Cartão</Label>
                                        <Input
                                            placeholder="Ex: Platinium, Gold..."
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="bg-muted/50 border-input text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Últimos 4 dígitos</Label>
                                        <Input
                                            placeholder="1234"
                                            maxLength={4}
                                            value={formData.lastFourDigits}
                                            onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value.replace(/\D/g, "") })}
                                            className="bg-muted/50 border-input text-foreground"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Limite</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="5000,00"
                                        value={formData.limit}
                                        onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                                        className="bg-muted/50 border-input text-foreground"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Dia de Fechamento</Label>
                                        <Select
                                            value={formData.closingDay}
                                            onValueChange={(v) => setFormData({ ...formData, closingDay: v })}
                                        >
                                            <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border max-h-48">
                                                {CLOSING_DAYS.map((day) => (
                                                    <SelectItem
                                                        key={day}
                                                        value={day.toString()}
                                                        className="text-muted-foreground focus:bg-muted focus:text-foreground"
                                                    >
                                                        Dia {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Dia de Vencimento</Label>
                                        <Select
                                            value={formData.dueDay}
                                            onValueChange={(v) => setFormData({ ...formData, dueDay: v })}
                                        >
                                            <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border max-h-48">
                                                {CLOSING_DAYS.map((day) => (
                                                    <SelectItem
                                                        key={day}
                                                        value={day.toString()}
                                                        className="text-muted-foreground focus:bg-muted focus:text-foreground"
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
                                    <Button type="button" variant="ghost" onClick={handleCloseDialog} className="text-muted-foreground">
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
                <Card className="bg-gradient-to-br from-violet-500 to-violet-700 border-none text-white shadow-lg shadow-violet-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm text-white/80 font-medium">Limite Total Disponível</p>
                                {loading ? (
                                    <div className="h-9 w-40 bg-white/20 rounded animate-pulse mt-1" />
                                ) : (
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {formatCurrency(totalLimit - totalUsed)}
                                    </p>
                                )}
                            </div>
                            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                                <CreditCardIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        {!loading && totalLimit > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/80">Usado: {formatCurrency(totalUsed)}</span>
                                    <span className="text-white/80">Limite: {formatCurrency(totalLimit)}</span>
                                </div>
                                <Progress value={(totalUsed / totalLimit) * 100} className="h-2 bg-black/20 [&>div]:bg-white" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Lista de Cartões */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <CreditCardIcon className="w-5 h-5 text-violet-400" />
                            Seus Cartões
                            <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">
                                {cards.length}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Gerencie seus cartões de crédito
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse" />
                                ))}
                            </div>
                        ) : cards.length === 0 ? (
                            <div className="text-center py-12">
                                <CreditCardIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Nenhum cartão cadastrado</p>
                                <p className="text-sm text-muted-foreground mt-1">
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
                                                    background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)`
                                                }}
                                            >
                                                <div className="absolute inset-0 opacity-20">
                                                    <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/20 blur-xl" />
                                                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-black/10 blur-xl" />
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
                                                            <DropdownMenuContent className="bg-popover border-border">
                                                                <DropdownMenuItem
                                                                    className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-muted"
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
                                            <div className="bg-card/80 p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Receipt className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-muted-foreground">Fatura Atual</span>
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
                                                        <p className="text-2xl font-bold text-foreground">{formatCurrency(usedAmount)}</p>
                                                        <p className="text-xs text-muted-foreground">de {formatCurrency(card.limit)}</p>
                                                    </div>

                                                    <div className="text-right flex flex-col items-end gap-2">
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <Calendar className="w-3 h-3" />
                                                            Vence dia {card.dueDay}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {currentInvoice && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
                                                                    onClick={() => {
                                                                        setSelectedInvoiceForDetails(currentInvoice);
                                                                        setSelectedCardName(card.name);
                                                                        setDetailsModalOpen(true);
                                                                    }}
                                                                >
                                                                    Ver Detalhes
                                                                </Button>
                                                            )}
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
                                                </div>

                                                <Progress
                                                    value={usedPercent}
                                                    className={`h-2 ${usedPercent > 80 ? 'bg-red-900/50' : 'bg-muted'}`}
                                                />

                                                {nextInvoice && nextInvoice.totalAmount > 0 && (
                                                    <div className="pt-3 mt-3 border-t border-border/50 flex justify-between items-center text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-muted-foreground">Próximo Mês ({nextInvoice.month.toString().padStart(2, '0')}/{nextInvoice.year})</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 px-2 text-[10px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                                                                onClick={() => {
                                                                    setSelectedInvoiceForDetails(nextInvoice);
                                                                    setSelectedCardName(card.name);
                                                                    setDetailsModalOpen(true);
                                                                }}
                                                            >
                                                                Ver Detalhes
                                                            </Button>
                                                        </div>
                                                        <span className="text-muted-foreground font-medium">{formatCurrency(nextInvoice.totalAmount)}</span>
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

            <InvoiceDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                invoice={selectedInvoiceForDetails}
                cardName={selectedCardName}
            />
        </div >
    );
}
