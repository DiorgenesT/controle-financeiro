import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Account, updateAccountBalance } from "@/lib/accounts";
import { CreditCardInvoice, payInvoice } from "@/lib/creditCards";
import { addTransaction } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { getBankByCode } from "@/lib/banks";
import { getIconById } from "@/lib/icons";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

interface PayInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: CreditCardInvoice | null;
    cardName: string;
    accounts: Account[];
    onSuccess: () => void;
}

export function PayInvoiceModal({
    isOpen,
    onClose,
    invoice,
    cardName,
    accounts,
    onSuccess
}: PayInvoiceModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState("");
    const [accountId, setAccountId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (isOpen && invoice) {
            setAmount(invoice.totalAmount.toString());
            setAccountId("");
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, invoice]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid || !invoice || !accountId) return;

        setLoading(true);
        try {
            const value = parseFloat(amount.replace(',', '.'));

            if (isNaN(value) || value <= 0) {
                toast.error("Valor inválido");
                return;
            }

            // 1. Criar transação de despesa
            await addTransaction(user.uid, {
                type: "despesa",
                description: `Fatura ${cardName} - ${invoice.month}/${invoice.year}`,
                amount: value,
                category: "Cartão de Crédito", // Categoria fixa ou poderia deixar escolher? Melhor fixa por enquanto ou "Contas"
                date: new Date(date),
                paymentMethod: "debit", // Sai da conta como débito
                accountId: accountId,
            });

            // 2. Debitar da conta
            await updateAccountBalance(accountId, value, "subtract");

            // 3. Marcar fatura como paga
            await payInvoice(invoice.id, accountId);

            toast.success("Fatura paga com sucesso!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao pagar fatura");
        } finally {
            setLoading(false);
        }
    };

    if (!invoice) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pagar Fatura</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Confirmar pagamento da fatura de {cardName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">


                    <div className="space-y-2">
                        <Label>Valor do Pagamento</Label>
                        <CurrencyInput
                            value={amount}
                            onChange={(val) => setAmount(val)}
                            className="bg-zinc-800/50 border-zinc-700 text-white"
                            required
                        />
                        <p className="text-xs text-zinc-500">
                            Total da fatura: {formatCurrency(invoice.totalAmount)}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Data do Pagamento</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="pl-10 bg-zinc-800/50 border-zinc-700 text-white"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Pagar com a conta</Label>
                        {accounts.length === 0 ? (
                            <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-center text-sm text-zinc-400">
                                Nenhuma conta cadastrada
                            </div>
                        ) : (
                            <Select value={accountId} onValueChange={setAccountId} required>
                                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                    <SelectValue placeholder="Selecione uma conta" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    {accounts.map((acc) => {
                                        const bank = getBankByCode(acc.bankCode);
                                        const Icon = getIconById(bank.icon);
                                        return (
                                            <SelectItem
                                                key={acc.id}
                                                value={acc.id}
                                                className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                                        style={{ backgroundColor: acc.color }}
                                                    >
                                                        <Icon className="w-3 h-3 text-white" />
                                                    </div>
                                                    <span>{acc.name}</span>
                                                    <span className="text-xs text-zinc-500 ml-auto">
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

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-400">
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !accountId}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
                            Confirmar Pagamento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
