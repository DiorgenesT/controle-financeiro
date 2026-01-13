"use client";

import { useEffect, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { getCreditCards, getInvoices } from "@/lib/creditCards";
import { checkRecurringStatus, processRecurringTransaction, PendingRecurring } from "@/lib/recurring";
import { updateTransaction, getGoals, updateGoal } from "@/lib/firestore";
import { updateAccountBalance } from "@/lib/accounts";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Calendar, Clock, CreditCard, Receipt, CheckCircle, Repeat, ChevronLeft, ChevronRight, X } from "lucide-react";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Transaction } from "@/types";

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
    const { user } = useAuth();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [processing, setProcessing] = useState<string | null>(null);

    // Modal de confirmação
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; item: PendingRecurring | Transaction | null }>({
        open: false,
        item: null
    });
    const [editValue, setEditValue] = useState("");

    const openConfirmModal = (item: PendingRecurring | Transaction) => {
        setEditValue(item.amount.toString());
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
                await processRecurringTransaction(user.uid, confirmModal.item as PendingRecurring, value);
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
                        message = `"${rec.description}" vence HOJE!`;
                        alertType = "warning";
                    } else if (rec.daysUntilDue === 1) {
                        message = `"${rec.description}" vence amanhã`;
                        alertType = "info";
                    } else {
                        message = `"${rec.description}" vence em ${rec.daysUntilDue} dias`;
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
        if (alerts.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % alerts.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [alerts.length]);

    const goNext = () => setCurrentIndex((prev) => (prev + 1) % alerts.length);
    const goPrev = () => setCurrentIndex((prev) => (prev - 1 + alerts.length) % alerts.length);

    if (alerts.length === 0) {
        return (
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm bg-zinc-900/50 px-4 py-3 rounded-xl border border-zinc-800 w-full">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Tudo em dia! Nenhuma pendência próxima.</span>
            </div>
        );
    }

    const currentAlert = alerts[currentIndex];
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
                        <button onClick={goPrev} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4 text-zinc-400" />
                        </button>
                    )}

                    {/* Ícone */}
                    <Icon className={`w-5 h-5 shrink-0 ${currentAlert.type === "danger" ? "text-red-400" :
                        currentAlert.type === "warning" ? "text-amber-400" : "text-blue-400"
                        }`} />

                    {/* Mensagem */}
                    <span className={`flex-1 text-sm font-medium ${currentAlert.type === "danger" ? "text-red-200" :
                        currentAlert.type === "warning" ? "text-amber-200" : "text-blue-200"
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
                        <span className="text-xs text-zinc-500 tabular-nums">
                            {currentIndex + 1}/{alerts.length}
                        </span>
                    )}

                    {/* Navegação direita */}
                    {alerts.length > 1 && (
                        <button onClick={goNext} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Modal de Confirmação com Edição de Valor */}
            <Dialog open={confirmModal.open} onOpenChange={(open) => setConfirmModal({ open, item: null })}>
                <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            Confirmar {confirmModal.item?.type === 'receita' ? 'Recebimento' : 'Pagamento'}
                        </DialogTitle>
                    </DialogHeader>

                    {confirmModal.item && (
                        <div className="space-y-4">
                            <div className="p-3 bg-zinc-800/50 rounded-lg">
                                <p className="text-sm text-zinc-400">Descrição</p>
                                <p className="text-white font-medium">{confirmModal.item.description}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value" className="text-zinc-400">Valor (pode ser editado)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                                    <Input
                                        id="value"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="pl-10 bg-zinc-800 border-zinc-700 text-white text-lg font-bold"
                                        placeholder="0,00"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">
                                    Valor original: {formatCurrency(confirmModal.item.amount)}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setConfirmModal({ open: false, item: null })}
                            className="text-zinc-400"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!!processing}
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
