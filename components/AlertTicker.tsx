"use client";

import { useEffect, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { getCreditCards, getInvoices } from "@/lib/creditCards";
import { checkRecurringStatus, processRecurringTransaction, PendingRecurring } from "@/lib/recurring";
import { updateTransaction, getGoals, updateGoal } from "@/lib/firestore";
import { updateAccountBalance } from "@/lib/accounts";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Calendar, Clock, CreditCard, Receipt, CheckCircle, Repeat, ChevronLeft, ChevronRight, X, Wallet, Landmark } from "lucide-react";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Transaction } from "@/types";
import { useAccounts } from "@/hooks/useAccounts";
import { getBankByCode, getAccountTypeLabel } from "@/lib/banks";

interface Alert {
    id: string;
    message: string;
    type: "danger" | "warning" | "info";
    icon: React.ElementType;
    action?: {
        label: string;
        onClick: () => void;
    };
    recurringData?: PendingRecurring;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

import { useRouter } from "next/navigation";

export function AlertTicker() {
    const router = useRouter();
    const { transactions } = useTransactions();
    const { accounts } = useAccounts();
    const { user } = useAuth();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");

    // Modal de confirmação
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; item: PendingRecurring | Transaction | null }>({
        open: false,
        item: null
    });
    const [editValue, setEditValue] = useState("");

    const openConfirmModal = (item: PendingRecurring | Transaction) => {
        setEditValue(item.amount.toString());

        // Pre-selecionar conta: se o item já tem, usa ela. Se não, usa a padrão.
        if (item.accountId) {
            setSelectedAccountId(item.accountId);
        } else {
            const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
            setSelectedAccountId(defaultAcc?.id || "");
        }

        setConfirmModal({ open: true, item });
    };

    const handleConfirm = async () => {
        if (!confirmModal.item || !user?.uid) return;

        const value = parseFloat(editValue.replace(',', '.'));
        if (isNaN(value) || value <= 0) {
            toast.error("Valor inválido");
            return;
        }

        setProcessing(confirmModal.item.id);
        try {
            // Verificar se é recorrente (PendingRecurring tem daysUntilDue)
            if ('daysUntilDue' in confirmModal.item) {
                await processRecurringTransaction(user.uid, confirmModal.item as PendingRecurring, value, selectedAccountId);
                setAlerts(prev => prev.filter(a => a.id !== `recurring-${confirmModal.item!.id}`));
            } else {
                // É boleto (Transaction)
                const transaction = confirmModal.item as Transaction;
                await updateTransaction(transaction.id, {
                    boletoStatus: 'paid',
                    amount: value, // Atualizar valor se mudou
                });

                // Atualizar saldo se tiver conta vinculada
                if (transaction.accountId) {
                    await updateAccountBalance(transaction.accountId, value, 'subtract');
                }

                toast.success("Boleto pago com sucesso!");
                // Remover alerta do boleto
                setAlerts(prev => prev.filter(a => a.id !== `boleto-${transaction.id}`));
            }

            setConfirmModal({ open: false, item: null });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao confirmar");
        } finally {
            setProcessing(null);
        }
    };

    useEffect(() => {
        const fetchAlerts = async () => {
            if (!user?.uid) return;

            const newAlerts: Alert[] = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Boletos Pendentes
            const pendingBoletos = transactions.filter(
                t => t.paymentMethod === "boleto" && t.boletoStatus === "pending" && t.boletoDueDate
            );

            pendingBoletos.forEach(boleto => {
                const dueDate = new Date(boleto.boletoDueDate!);
                dueDate.setHours(0, 0, 0, 0);
                const diff = differenceInDays(dueDate, today);

                if (diff < 0) {
                    newAlerts.push({
                        id: `boleto-${boleto.id}`,
                        message: `Boleto "${boleto.description}" venceu há ${Math.abs(diff)} dias!`,
                        type: "danger",
                        icon: Receipt
                    });
                } else if (diff === 0) {
                    newAlerts.push({
                        id: `boleto-${boleto.id}`,
                        message: `Boleto "${boleto.description}" vence HOJE!`,
                        type: "warning",
                        icon: Receipt,
                        action: {
                            label: "Confirmar pagamento",
                            onClick: () => openConfirmModal(boleto)
                        }
                    });
                } else if (diff <= 5) {
                    newAlerts.push({
                        id: `boleto-${boleto.id}`,
                        message: `Boleto "${boleto.description}" vence em ${diff} dias.`,
                        type: "warning",
                        icon: Receipt,
                        action: {
                            label: "Confirmar pagamento",
                            onClick: () => openConfirmModal(boleto)
                        }
                    });
                }
            });

            // 2. Faturas de Cartão
            try {
                const cards = await getCreditCards(user.uid);
                for (const card of cards) {
                    const invoices = await getInvoices(card.id, user.uid);
                    const relevantInvoices = invoices.filter(inv =>
                        (inv.status === "open" || inv.status === "closed" || inv.status === "overdue") &&
                        inv.totalAmount > 0
                    );

                    relevantInvoices.forEach(inv => {
                        const dueDate = new Date(inv.dueDate);
                        dueDate.setHours(0, 0, 0, 0);
                        const diff = differenceInDays(dueDate, today);

                        if (inv.status === "overdue" || diff < 0) {
                            newAlerts.push({
                                id: `invoice-${inv.id}`,
                                message: `Fatura ${card.name} (${inv.month}/${inv.year}) está atrasada!`,
                                type: "danger",
                                icon: CreditCard
                            });
                        } else if (diff === 0) {
                            newAlerts.push({
                                id: `invoice-${inv.id}`,
                                message: `Fatura ${card.name} vence HOJE!`,
                                type: "danger",
                                icon: CreditCard
                            });
                        } else if (diff <= 5) {
                            newAlerts.push({
                                id: `invoice-${inv.id}`,
                                message: `Fatura ${card.name} vence em ${diff} dias.`,
                                type: "warning",
                                icon: CreditCard
                            });
                        }
                    });
                }
            } catch (error) {
                console.error("Erro ao verificar faturas:", error);
            }

            // 3. Transações Fixas Pendentes (até 5 dias antes do vencimento)
            try {
                const pendingRecurring = await checkRecurringStatus(user.uid);
                pendingRecurring.forEach(rec => {
                    const isReceita = rec.type === 'receita';
                    const verb = isReceita ? 'recebimento' : 'pagamento';

                    let message = '';
                    let alertType: "danger" | "warning" | "info" = "info";

                    if (rec.daysUntilDue === 0) {
                        message = isReceita ? `"${rec.description}" para RECEBER HOJE!` : `"${rec.description}" vence HOJE!`;
                        alertType = "warning";
                    } else if (rec.daysUntilDue === 1) {
                        message = isReceita ? `"${rec.description}" para receber amanhã` : `"${rec.description}" vence amanhã`;
                        alertType = "info";
                    } else {
                        message = isReceita ? `"${rec.description}" para receber em ${rec.daysUntilDue} dias` : `"${rec.description}" vence em ${rec.daysUntilDue} dias`;
                        alertType = "info";
                    }

                    newAlerts.push({
                        id: `recurring-${rec.id}`,
                        message,
                        type: alertType,
                        icon: Repeat,
                        recurringData: rec,
                        action: {
                            label: isReceita ? "Confirmar Recebimento" : "Confirmar Pagamento",
                            onClick: () => openConfirmModal(rec)
                        }
                    });
                });
            } catch (error) {
                console.error("Erro ao verificar fixas:", error);
            }

            setAlerts(newAlerts);
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, [user?.uid, transactions]);

    // Rotação automática
    useEffect(() => {
        if (alerts.length <= 1) {
            setCurrentIndex(0);
            return;
        }
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % alerts.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [alerts.length]);

    // Garantir que o índice está sempre dentro dos limites
    useEffect(() => {
        if (currentIndex >= alerts.length && alerts.length > 0) {
            setCurrentIndex(0);
        }
    }, [alerts.length, currentIndex]);

    const goNext = () => setCurrentIndex((prev) => (prev + 1) % alerts.length);
    const goPrev = () => setCurrentIndex((prev) => (prev - 1 + alerts.length) % alerts.length);

    if (alerts.length === 0) {
        return (
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm bg-muted/50 px-4 py-3 rounded-xl border border-border w-full">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Tudo em dia! Nenhuma pendência próxima.</span>
            </div>
        );
    }

    const currentAlert = alerts[currentIndex] || alerts[0];
    if (!currentAlert) return null;
    const Icon = currentAlert.icon;

    return (
        <>
            <div className="w-full">
                <div
                    className={`
                        flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-300
                        ${currentAlert.type === 'danger' ? 'bg-red-500/10 border-red-500/30' : ''}
                        ${currentAlert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : ''}
                        ${currentAlert.type === 'info' ? 'bg-blue-500/10 border-blue-500/30' : ''}
                    `}
                >
                    {/* Navegação esquerda */}
                    {alerts.length > 1 && (
                        <button onClick={goPrev} className="p-1 hover:bg-muted rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                    )}

                    {/* Ícone */}
                    <Icon className={`w-5 h-5 shrink-0 ${currentAlert.type === "danger" ? "text-red-500" :
                        currentAlert.type === "warning" ? "text-amber-500" : "text-blue-500"
                        }`} />

                    {/* Mensagem */}
                    <span className={`flex-1 text-sm font-medium ${currentAlert.type === "danger" ? "text-red-600 dark:text-red-200" :
                        currentAlert.type === "warning" ? "text-amber-600 dark:text-amber-200" : "text-blue-600 dark:text-blue-200"
                        }`}>
                        {currentAlert.message}
                    </span>

                    {/* Botão de ação */}
                    {currentAlert.action && (
                        <button
                            onClick={currentAlert.action.onClick}
                            disabled={!!processing}
                            className="px-4 py-1.5 text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                            {processing === currentAlert.recurringData?.id || processing === currentAlert.id.replace('boleto-', '') ? "..." : currentAlert.action.label}
                        </button>
                    )}

                    {/* Indicador de página */}
                    {alerts.length > 1 && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {currentIndex + 1}/{alerts.length}
                        </span>
                    )}

                    {/* Navegação direita */}
                    {alerts.length > 1 && (
                        <button onClick={goNext} className="p-1 hover:bg-muted rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                    )}
                </div>
            </div>

            {/* Modal de Confirmação com Edição de Valor */}
            <Dialog open={confirmModal.open} onOpenChange={(open) => setConfirmModal({ open, item: null })}>
                <DialogContent className="bg-popover border-border sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">
                            Confirmar {confirmModal.item?.type === 'receita' ? 'Recebimento' : 'Pagamento'}
                        </DialogTitle>
                    </DialogHeader>

                    {confirmModal.item && (
                        <div className="space-y-4">
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Descrição</p>
                                <p className="text-foreground font-medium">{confirmModal.item.description}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value" className="text-muted-foreground">Valor (pode ser editado)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                    <Input
                                        id="value"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="pl-10 bg-muted border-input text-foreground text-lg font-bold"
                                        placeholder="0,00"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Valor original: {formatCurrency(confirmModal.item.amount)}
                                </p>
                            </div>

                            {/* Seletor de Conta */}
                            {('daysUntilDue' in confirmModal.item || (confirmModal.item as Transaction).paymentMethod === 'boleto') && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground flex items-center gap-2">
                                        <Wallet className="w-3 h-3" />
                                        Conta para {confirmModal.item.type === 'receita' ? 'recebimento' : 'pagamento'}
                                    </Label>
                                    <Select
                                        value={selectedAccountId}
                                        onValueChange={setSelectedAccountId}
                                    >
                                        <SelectTrigger className="bg-muted/50 border-input">
                                            <SelectValue placeholder="Selecione a conta" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {accounts.map((acc) => {
                                                const bank = getBankByCode(acc.bankCode);
                                                return (
                                                    <SelectItem key={acc.id} value={acc.id}>
                                                        <div className="flex items-center gap-2 w-full min-w-0">
                                                            <div
                                                                className="w-2 h-2 rounded-full shrink-0"
                                                                style={{ backgroundColor: bank.color }}
                                                            />
                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded shrink-0">
                                                                    {getAccountTypeLabel(acc.type)}
                                                                </span>
                                                                <span className="text-sm font-medium truncate">{acc.name}</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    {!selectedAccountId && (
                                        <p className="text-[10px] text-amber-500 font-medium">
                                            * Selecione uma conta para atualizar o saldo
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setConfirmModal({ open: false, item: null })}
                            className="text-muted-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!!processing || (confirmModal.item && ('daysUntilDue' in confirmModal.item || (confirmModal.item as Transaction).paymentMethod === 'boleto') && !selectedAccountId)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {processing ? "Processando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
