"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, CreditCard, Wallet } from "lucide-react";
import { RecurringTransaction } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { addRecurringTransaction, updateRecurringTransaction, updateFutureLinkedTransactions } from "@/lib/recurring";
import { getCategories, Category } from "@/lib/categories";
import { getCreditCards, CreditCard as CreditCardType } from "@/lib/creditCards";
import { getAccounts, Account } from "@/lib/accounts";
import { usePeople } from "@/hooks/usePeople";
import { getIconById } from "@/lib/icons";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

interface RecurringModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: RecurringTransaction | null;
    onSuccess?: () => void;
}

export function RecurringModal({ open, onOpenChange, initialData, onSuccess }: RecurringModalProps) {
    const { user } = useAuth();
    const { people } = usePeople();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        type: "despesa" as "receita" | "despesa",
        category: "",
        day: "5",
        personId: "family",
        paymentMethod: "debit" as "debit" | "credit" | "boleto" | "pix",
        creditCardId: "",
        accountId: "",
    });

    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            loadData();
            if (initialData) {
                setEditingId(initialData.id);
                setFormData({
                    description: initialData.description,
                    amount: initialData.amount.toString(),
                    type: initialData.type,
                    category: initialData.category,
                    day: initialData.day.toString(),
                    personId: initialData.personId || "family",
                    paymentMethod: initialData.paymentMethod || "debit",
                    creditCardId: initialData.creditCardId || "",
                    accountId: initialData.accountId || "",
                });
            } else {
                setEditingId(null);
                setFormData({
                    description: "",
                    amount: "",
                    type: "despesa",
                    category: "",
                    day: "5",
                    personId: "family",
                    paymentMethod: "debit",
                    creditCardId: "",
                    accountId: "",
                });
            }
        }
    }, [open, initialData]);

    const loadData = async () => {
        if (!user?.uid) return;
        const [cats, cards, accs] = await Promise.all([
            getCategories(user.uid),
            getCreditCards(user.uid),
            getAccounts(user.uid),
        ]);
        setCategories(cats);
        setCreditCards(cards);
        setAccounts(accs);

        // Definir primeira conta/cartão como padrão se disponível
        if (accs.length > 0 && !formData.accountId) {
            const defaultAcc = accs.find(a => a.isDefault) || accs[0];
            setFormData(prev => ({ ...prev, accountId: defaultAcc.id }));
        }
        if (cards.length > 0 && !formData.creditCardId) {
            setFormData(prev => ({ ...prev, creditCardId: cards[0].id }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return;

        // Validações
        if (formData.type === "despesa") {
            if (formData.paymentMethod === "credit" && !formData.creditCardId) {
                toast.error("Selecione um cartão");
                return;
            }
            if (formData.paymentMethod === "debit" && !formData.accountId && accounts.length > 0) {
                toast.error("Selecione uma conta");
                return;
            }
        }

        setLoading(true);
        try {
            const data = {
                description: formData.description,
                amount: parseFloat(formData.amount),
                type: formData.type,
                category: formData.category || (formData.type === "receita" ? "Salário" : "Outros"),
                day: parseInt(formData.day),
                personId: formData.personId === "family" ? null : formData.personId,
                active: true,
                // Campos de pagamento (apenas para despesas)
                ...(formData.type === "despesa" && {
                    paymentMethod: formData.paymentMethod,
                    creditCardId: formData.paymentMethod === "credit" ? formData.creditCardId : undefined,
                    accountId: formData.paymentMethod === "debit" ? formData.accountId : undefined,
                }),
            };

            if (editingId) {
                console.log("Updating recurring transaction (by ID):", editingId);
                await updateRecurringTransaction(editingId, data);
                toast.success("Fixa atualizada!");
            } else {
                console.log("Creating new recurring transaction (no ID)");
                await addRecurringTransaction(user.uid, data);
                toast.success("Fixa criada!");
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar");
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(c => c.type === formData.type);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-background border-border text-foreground sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Fixa" : "Nova Transação Fixa"}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Configure uma receita ou despesa que se repete todo mês.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v: "receita" | "despesa") => setFormData({ ...formData, type: v, category: "" })}
                            >
                                <SelectTrigger className="bg-muted/50 border-input">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="receita">Receita</SelectItem>
                                    <SelectItem value="despesa">Despesa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Dia do Mês</Label>
                            <Input
                                type="number"
                                min="1"
                                max="31"
                                value={formData.day}
                                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                                className="bg-muted/50 border-input"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ex: Aluguel, Salário"
                            className="bg-muted/50 border-input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <CurrencyInput
                                value={formData.amount}
                                onChange={(val) => setFormData({ ...formData, amount: val })}
                                className="bg-muted/50 border-input"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(v) => setFormData({ ...formData, category: v })}
                            >
                                <SelectTrigger className="bg-muted/50 border-input">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border max-h-60">
                                    {filteredCategories.map((cat) => {
                                        const Icon = getIconById(cat.icon);
                                        return (
                                            <SelectItem key={cat.id} value={cat.name}>
                                                <span className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4" style={{ color: cat.color }} />
                                                    <span>{cat.name}</span>
                                                </span>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Forma de pagamento - apenas para despesas */}
                    {formData.type === "despesa" && (
                        <div className="space-y-3">
                            <Label>Forma de Pagamento</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentMethod: "debit" })}
                                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${formData.paymentMethod === "debit"
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border-input bg-muted/50 text-muted-foreground hover:border-accent"
                                        }`}
                                >
                                    <Wallet className="w-4 h-4" />
                                    <span className="text-sm font-medium">Débito/PIX</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentMethod: "credit" })}
                                    disabled={creditCards.length === 0}
                                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${formData.paymentMethod === "credit"
                                        ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                        : "border-input bg-muted/50 text-muted-foreground hover:border-accent"
                                        } ${creditCards.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    <span className="text-sm font-medium">Cartão</span>
                                </button>
                            </div>

                            {/* Seletor de cartão */}
                            {formData.paymentMethod === "credit" && creditCards.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Cartão</Label>
                                    <Select
                                        value={formData.creditCardId}
                                        onValueChange={(v) => setFormData({ ...formData, creditCardId: v })}
                                    >
                                        <SelectTrigger className="bg-muted/50 border-input">
                                            <SelectValue placeholder="Selecione o cartão" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {creditCards.map((card) => (
                                                <SelectItem key={card.id} value={card.id}>
                                                    {card.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Seletor de conta para débito */}
                            {formData.paymentMethod === "debit" && accounts.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Conta</Label>
                                    <Select
                                        value={formData.accountId}
                                        onValueChange={(v) => setFormData({ ...formData, accountId: v })}
                                    >
                                        <SelectTrigger className="bg-muted/50 border-input">
                                            <SelectValue placeholder="Selecione a conta" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {accounts.map((acc) => (
                                                <SelectItem key={acc.id} value={acc.id}>
                                                    {acc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Atribuir a</Label>
                        <Select
                            value={formData.personId}
                            onValueChange={(v) => setFormData({ ...formData, personId: v })}
                        >
                            <SelectTrigger className="bg-muted/50 border-input">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="family">Família</SelectItem>
                                {people.map((person) => (
                                    <SelectItem key={person.id} value={person.id}>
                                        {person.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar Fixa
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
