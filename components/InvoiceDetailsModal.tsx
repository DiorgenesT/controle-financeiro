import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCardInvoice, Transaction } from "@/types";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CreditCard, ShoppingBag } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

interface InvoiceDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: CreditCardInvoice | null;
    cardName: string;
}

export function InvoiceDetailsModal({
    isOpen,
    onClose,
    invoice,
    cardName,
}: InvoiceDetailsModalProps) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTransactions() {
            if (!invoice?.id || !user?.uid) return;
            setLoading(true);
            try {
                // Buscar as últimas 100 transações do usuário
                const q = query(
                    collection(db, "transactions"),
                    where("userId", "==", user.uid),
                    orderBy("date", "desc"),
                    limit(100)
                );
                const snapshot = await getDocs(q);

                const allRecentTransactions = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().date?.toDate() || new Date(),
                })) as Transaction[];

                // Filtrar transações da fatura
                // 1. Tenta pelo ID da fatura
                // 2. Fallback: Pelo cartão e mês/ano de vencimento (caso o ID falhe)
                const filteredData = allRecentTransactions.filter(t => {
                    // Se tiver ID da fatura e bater, é ela
                    if (t.invoiceId === invoice.id) return true;

                    // Se não tiver ID ou não bater, tenta pelo cartão + data
                    if (t.creditCardId === invoice.creditCardId) {
                        const tDate = new Date(t.date);
                        const iDate = new Date(invoice.dueDate);

                        // Compara mês e ano do vencimento
                        return tDate.getMonth() === iDate.getMonth() &&
                            tDate.getFullYear() === iDate.getFullYear();
                    }

                    return false;
                });

                setTransactions(filteredData);
            } catch (error) {
                console.error("Erro ao buscar transações da fatura:", error);
            } finally {
                setLoading(false);
            }
        }

        if (isOpen && invoice) {
            fetchTransactions();
        }
    }, [isOpen, invoice]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    if (!invoice) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-card border-border sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-violet-500" />
                        Fatura de {cardName}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {invoice.month.toString().padStart(2, '0')}/{invoice.year} - {formatCurrency(invoice.totalAmount)}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-8 h-8 rounded bg-muted" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-32 bg-muted" />
                                            <Skeleton className="h-3 w-20 bg-muted" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-16 bg-muted" />
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8">
                            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">Nenhuma transação nesta fatura</p>
                        </div>
                    ) : (
                        <div className="h-[400px] pr-4 overflow-y-auto">
                            <div className="space-y-3">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded flex items-center justify-center bg-violet-500/10">
                                                <ShoppingBag className="w-4 h-4 text-violet-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {transaction.description}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(transaction.date, "dd/MM", { locale: ptBR })}
                                                    </span>
                                                    {transaction.installments && transaction.installments > 1 && (
                                                        <span className="bg-background px-1.5 py-0.5 rounded border border-border">
                                                            {transaction.installmentNumber}/{transaction.installments}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="font-medium text-foreground">
                                            {formatCurrency(transaction.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
