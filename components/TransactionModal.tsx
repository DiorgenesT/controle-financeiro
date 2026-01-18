"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    TrendingUp,
    TrendingDown,
    Loader2,
    Plus,
    AlertCircle,
    Wallet,
    CreditCard,
    Receipt,
    Calendar,
    Smartphone,
    Users,
    User
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { getCategories, initializeDefaultCategories, Category } from "@/lib/categories";
import { getAccounts, updateAccountBalance, Account } from "@/lib/accounts";
import { getCreditCards, getOrCreateInvoice, updateInvoiceTotal, getInvoiceMonthYear, CreditCard as CreditCardType } from "@/lib/creditCards";
import { getPeople } from "@/lib/people";
import { getBankByCode } from "@/lib/banks";
import { getIconById } from "@/lib/icons";
import { addRecurringTransaction, updateRecurringTransaction, getRecurringTransaction, getRecurringTransactionSafe } from "@/lib/recurring";
import { PaymentMethod, BoletoStatus, Person, Goal, Transaction } from "@/types";
import { addTransaction, getGoals, updateGoal } from "@/lib/firestore";
import { toast } from "sonner";
import Link from "next/link";
import { Repeat } from "lucide-react";

interface TransactionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type?: "receita" | "despesa";
    initialData?: Transaction | null;
    defaultPaymentMethod?: PaymentMethod;
}

export function TransactionModal({
    open,
    onOpenChange,
    type: initialType,
    initialData,
    defaultPaymentMethod
}: TransactionModalProps) {
    const { add, update } = useTransactions();
    const { user } = useAuth();
    const [step, setStep] = useState<"type" | "payment" | "form">("type");
    const [type, setType] = useState<"receita" | "despesa">("receita");
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    // Dados
    const [categories, setCategories] = useState<Category[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [loadingPeople, setLoadingPeople] = useState(true);

    // Buscar pessoas
    useEffect(() => {
        if (open && user?.uid) {
            getPeople(user.uid).then(setPeople).finally(() => setLoadingPeople(false));
        }
    }, [open, user?.uid]);

    useEffect(() => {
        if (open) {
            if (initialData) {
                setType(initialData.type);
                setStep("form");
                setFormData({
                    description: initialData.description,
                    amount: initialData.amount.toString(),
                    category: initialData.category,
                    date: (() => {
                        try {
                            const d = initialData.date instanceof Date ? initialData.date : new Date(initialData.date);
                            return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
                        } catch {
                            return new Date().toISOString().split("T")[0];
                        }
                    })(),
                    paymentMethod: initialData.paymentMethod || "debit",
                    accountId: initialData.accountId || "",
                    creditCardId: initialData.creditCardId || "",
                    installments: initialData.installments ? initialData.installments.toString() : "1",
                    boletoStatus: initialData.boletoStatus || "pending",
                    boletoDueDate: (() => {
                        if (!initialData.boletoDueDate) return new Date().toISOString().split("T")[0];
                        try {
                            const d = initialData.boletoDueDate instanceof Date ? initialData.boletoDueDate : new Date(initialData.boletoDueDate);
                            return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
                        } catch {
                            return new Date().toISOString().split("T")[0];
                        }
                    })(),
                    boletoInstallments: initialData.installments ? initialData.installments.toString() : "1",
                    isRecurring: initialData.isRecurring || false,
                    personId: initialData.personId || "family",
                });
            } else {
                // Reset form
                setFormData({
                    description: "",
                    amount: "",
                    category: "",
                    date: new Date().toISOString().split("T")[0],
                    paymentMethod: defaultPaymentMethod || "debit",
                    accountId: "",
                    creditCardId: "",
                    installments: "1",
                    boletoStatus: "pending",
                    boletoDueDate: new Date().toISOString().split("T")[0],
                    boletoInstallments: "1",
                    isRecurring: false,
                    personId: "family",
                });

                if (initialType) {
                    setType(initialType);
                    setStep("payment"); // Pula seleção de tipo se já definido
                } else {
                    setStep("type");
                }
            }
        }
    }, [open, initialData, initialType, defaultPaymentMethod]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);

    // Form
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: (defaultPaymentMethod || "debit") as PaymentMethod,
        accountId: "",
        creditCardId: "",
        installments: "1",
        boletoStatus: "pending" as BoletoStatus,
        boletoDueDate: new Date().toISOString().split("T")[0],
        boletoInstallments: "1",
        personId: "family",
        isRecurring: false,
    });

    // Carregar dados quando modal abre
    const loadData = useCallback(async () => {
        if (!user?.uid || !open) return;

        setLoadingData(true);
        try {
            await initializeDefaultCategories(user.uid);
            const [cats, accs, cards, userGoals] = await Promise.all([
                getCategories(user.uid),
                getAccounts(user.uid),
                getCreditCards(user.uid),
                getGoals(user.uid),
            ]);

            cats.sort((a, b) => a.name.localeCompare(b.name));
            setCategories(cats);
            setAccounts(accs);
            setCreditCards(cards);
            setGoals(userGoals);

            // Definir conta padrão
            const defaultAcc = accs.find(a => a.isDefault) || accs[0];
            if (defaultAcc) {
                setFormData(prev => ({ ...prev, accountId: defaultAcc.id }));
            }

            // Definir primeiro cartão se existir
            if (cards[0]) {
                setFormData(prev => ({ ...prev, creditCardId: cards[0].id }));
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoadingData(false);
        }
    }, [user?.uid, open]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Categorias filtradas pelo tipo
    const filteredCategories = categories.filter(c => c.type === type);

    const handleTypeSelect = (selectedType: "receita" | "despesa") => {
        setType(selectedType);
        const firstCat = categories.find(c => c.type === selectedType);
        setFormData(prev => ({
            ...prev,
            category: firstCat?.id || "",
            paymentMethod: selectedType === "receita" ? "debit" : "debit",
        }));

        if (selectedType === "receita") {
            // Receita vai direto para form (sempre entra em conta)
            setStep("form");
        } else {
            // Despesa precisa escolher forma de pagamento
            setStep("payment");
        }
    };

    const handlePaymentSelect = (method: PaymentMethod) => {
        setFormData(prev => ({ ...prev, paymentMethod: method }));
        setStep("form");
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            setStep("type");
            setFormData({
                description: "",
                amount: "",
                category: "",
                date: new Date().toISOString().split("T")[0],
                paymentMethod: "debit",
                accountId: accounts.find(a => a.isDefault)?.id || accounts[0]?.id || "",
                creditCardId: creditCards[0]?.id || "",
                installments: "1",
                boletoStatus: "pending",
                boletoDueDate: new Date().toISOString().split("T")[0],
                boletoInstallments: "1",
                isRecurring: false,
                personId: "family",
            });
        }, 200);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.category) {
            toast.error("Selecione uma categoria");
            return;
        }

        if (type === "receita" && !formData.accountId) {
            toast.error("Selecione uma conta");
            return;
        }

        if (type === "despesa") {
            if ((formData.paymentMethod === "debit" || formData.paymentMethod === "pix") && !formData.accountId) {
                toast.error("Selecione uma conta");
                return;
            }
            if (formData.paymentMethod === "credit" && !formData.creditCardId) {
                toast.error("Selecione um cartão");
                return;
            }
            if (formData.paymentMethod === "boleto" && !formData.accountId) {
                toast.error("Selecione uma conta para o boleto");
                return;
            }
        }

        setSaving(true);

        try {
            const selectedCategory = categories.find(c => c.id === formData.category);
            const amount = parseFloat(formData.amount);
            // Converter data string para Date com horário local (meio-dia para evitar problemas de fuso)
            const [year, month, day] = formData.date.split('-').map(Number);
            const purchaseDate = new Date(year, month - 1, day, 12, 0, 0);

            if (isNaN(purchaseDate.getTime())) {
                toast.error("Data inválida");
                setSaving(false);
                return;
            }

            if (isNaN(amount)) {
                toast.error("Valor inválido");
                setSaving(false);
                return;
            }

            // Criar ou atualizar recorrência se selecionado
            let recurringTransactionId: string | undefined = initialData?.recurringTransactionId || undefined;

            if (formData.isRecurring && user?.uid) {
                const recurringData = {
                    type: type,
                    amount,
                    category: selectedCategory?.name || formData.category,
                    description: formData.description,
                    day: purchaseDate.getDate(),
                    active: true,
                    personId: formData.personId === "family" ? null : formData.personId,
                    lastProcessedDate: purchaseDate
                };

                // Ao editar uma transação que é recorrente, NÃO devemos alterar a regra original (recorrência).
                // A edição deve ser apenas pontual nesta transação.
                // Portanto, removemos a lógica de updateRecurringTransaction aqui.

                // Apenas se for uma NOVA transação e marcada como recorrente, criamos a regra.
                if (!initialData && formData.isRecurring) {
                    try {
                        console.log("Criando nova recorrência...");
                        recurringTransactionId = await addRecurringTransaction(user.uid, recurringData);
                        console.log("Nova recorrência criada:", recurringTransactionId);
                    } catch (err) {
                        console.error("Erro ao criar recorrência:", err);
                        toast.error("Erro ao criar recorrência");
                    }
                }
            } else if (!formData.isRecurring && initialData?.recurringTransactionId) {
                // Se desmarcou a recorrência, mas existia antes, talvez devêssemos perguntar se quer excluir a recorrência futura?
                // Por enquanto, vamos apenas desvincular (não exclui a regra de recorrência, apenas esta transação deixa de ser recorrente)
                // Ou poderíamos desativar a recorrência?
                // O comportamento mais seguro para "edição de transação" é não destruir a regra global, apenas desvincular.
                recurringTransactionId = undefined;
            }

            // === RECEITA ===
            if (type === "receita") {
                if (initialData) {
                    await update(initialData.id, {
                        description: formData.description,
                        amount,
                        category: selectedCategory?.name || formData.category,
                        date: purchaseDate,
                        paymentMethod: "debit",
                        accountId: formData.accountId,
                        isRecurring: formData.isRecurring,
                        recurrenceDay: formData.isRecurring ? purchaseDate.getDate() : null,
                        personId: formData.personId === "family" ? null : formData.personId,
                    });
                    toast.success("Receita atualizada!");
                } else {
                    await add({
                        type: "receita",
                        description: formData.description,
                        amount,
                        category: selectedCategory?.name || formData.category,
                        date: purchaseDate,
                        paymentMethod: "debit",
                        accountId: formData.accountId,
                        isRecurring: formData.isRecurring,
                        recurrenceDay: formData.isRecurring ? purchaseDate.getDate() : null,
                        personId: formData.personId === "family" ? null : formData.personId,
                        recurringTransactionId: recurringTransactionId || null,
                    });
                    // Atualizar saldo da conta (apenas se for nova)
                    await updateAccountBalance(formData.accountId, amount, "add");
                    toast.success("Receita adicionada!");
                }
            }

            // === DESPESA ===
            else {
                // DÉBITO ou PIX - sai da conta na hora
                if (formData.paymentMethod === "debit" || formData.paymentMethod === "pix") {
                    if (initialData) {
                        await update(initialData.id, {
                            description: formData.description,
                            amount,
                            category: selectedCategory?.name || formData.category,
                            date: purchaseDate,
                            paymentMethod: formData.paymentMethod,
                            accountId: formData.accountId,
                            isRecurring: formData.isRecurring,
                            recurrenceDay: formData.isRecurring ? purchaseDate.getDate() : null,
                            personId: formData.personId === "family" ? null : formData.personId,
                        });
                        toast.success("Despesa atualizada!");
                    } else {
                        await add({
                            type: "despesa",
                            description: formData.description,
                            amount,
                            category: selectedCategory?.name || formData.category,
                            date: purchaseDate,
                            paymentMethod: formData.paymentMethod,
                            accountId: formData.accountId,
                            isRecurring: formData.isRecurring,
                            recurrenceDay: formData.isRecurring ? purchaseDate.getDate() : null,
                            personId: formData.personId === "family" ? null : formData.personId,
                            recurringTransactionId: recurringTransactionId || null,
                        });

                        await updateAccountBalance(formData.accountId, amount, "subtract");

                        // Verificar se a conta está vinculada a uma meta e atualizar
                        const linkedGoal = goals.find(g => g.linkedAccountId === formData.accountId);
                        if (linkedGoal) {
                            const newAmount = Math.max(0, linkedGoal.currentAmount - amount);
                            const newStatus = newAmount >= linkedGoal.targetAmount ? "concluida" : "em_progresso";

                            await updateGoal(linkedGoal.id, {
                                currentAmount: newAmount,
                                status: newStatus
                            });

                            // Atualizar estado local das metas para refletir mudança imediata se modal reabrir
                            setGoals(prev => prev.map(g => g.id === linkedGoal.id ? { ...g, currentAmount: newAmount, status: newStatus } : g));
                        }

                        toast.success(formData.paymentMethod === "pix" ? "PIX enviado!" : "Despesa adicionada!");
                    }
                }

                // BOLETO
                else if (formData.paymentMethod === "boleto") {
                    if (initialData) {
                        // Edição de boleto (simplificada, assume que não muda parcelas)
                        await update(initialData.id, {
                            description: formData.description,
                            amount, // Se for parcelado, isso pode ser problemático se mudar o valor total, mas assumindo edição simples
                            category: selectedCategory?.name || formData.category,
                            date: new Date(formData.boletoDueDate), // Ajustar data
                            paymentMethod: "boleto",
                            accountId: formData.accountId,
                            boletoStatus: formData.boletoStatus,
                            boletoDueDate: new Date(formData.boletoDueDate),
                            personId: formData.personId === "family" ? null : formData.personId,
                        });
                        toast.success("Boleto atualizado!");
                    } else {
                        const numInstallments = parseInt(formData.boletoInstallments) || 1;
                        const installmentAmount = amount / numInstallments;
                        const firstDueDate = new Date(formData.boletoDueDate);

                        // Ajustar para meio-dia para evitar problemas de fuso horário
                        const [year, month, day] = formData.boletoDueDate.split('-').map(Number);
                        firstDueDate.setFullYear(year, month - 1, day);
                        firstDueDate.setHours(12, 0, 0, 0);

                        for (let i = 0; i < numInstallments; i++) {
                            // Calcular data de vencimento desta parcela
                            const dueDate = new Date(firstDueDate);
                            dueDate.setMonth(dueDate.getMonth() + i);

                            const description = numInstallments > 1
                                ? `${formData.description} (${i + 1}/${numInstallments})`
                                : formData.description;

                            await add({
                                type: "despesa",
                                description,
                                amount: installmentAmount,
                                category: selectedCategory?.name || formData.category,
                                date: dueDate,
                                paymentMethod: "boleto",
                                accountId: formData.accountId,
                                boletoStatus: numInstallments === 1 ? formData.boletoStatus : "pending",
                                boletoDueDate: dueDate,
                                installments: numInstallments,
                                installmentNumber: i + 1,
                                totalAmount: amount,
                                isRecurring: numInstallments === 1 ? formData.isRecurring : false,
                                recurrenceDay: (numInstallments === 1 && formData.isRecurring) ? purchaseDate.getDate() : null,
                                personId: formData.personId === "family" ? null : formData.personId,
                                recurringTransactionId: (numInstallments === 1 && formData.isRecurring) ? (recurringTransactionId || null) : null,
                            });

                            // Se boleto único e já foi pago, descontar da conta
                            if (numInstallments === 1 && formData.boletoStatus === "paid") {
                                await updateAccountBalance(formData.accountId, amount, "subtract");

                                // Verificar se a conta está vinculada a uma meta e atualizar
                                const linkedGoal = goals.find(g => g.linkedAccountId === formData.accountId);
                                if (linkedGoal) {
                                    const newAmount = Math.max(0, linkedGoal.currentAmount - amount);
                                    const newStatus = newAmount >= linkedGoal.targetAmount ? "concluida" : "em_progresso";

                                    await updateGoal(linkedGoal.id, {
                                        currentAmount: newAmount,
                                        status: newStatus
                                    });

                                    // Atualizar estado local das metas
                                    setGoals(prev => prev.map(g => g.id === linkedGoal.id ? { ...g, currentAmount: newAmount, status: newStatus } : g));
                                }
                            }
                        }

                        if (numInstallments > 1) {
                            toast.success(`Carnê de ${numInstallments}x criado!`);
                        } else {
                            toast.success(formData.boletoStatus === "paid" ? "Boleto pago!" : "Boleto pendente adicionado!");
                        }
                    }
                }

                // CARTÃO DE CRÉDITO
                else if (formData.paymentMethod === "credit") {
                    if (initialData) {
                        // Edição de cartão (simplificada, assume que não muda parcelas)
                        await update(initialData.id, {
                            description: formData.description,
                            amount, // Cuidado com parcelas
                            category: selectedCategory?.name || formData.category,
                            date: purchaseDate, // Data da compra
                            paymentMethod: "credit",
                            creditCardId: formData.creditCardId,
                            personId: formData.personId === "family" ? null : formData.personId,
                        });
                        toast.success("Despesa no cartão atualizada!");
                    } else {
                        const card = creditCards.find(c => c.id === formData.creditCardId)!;
                        const numInstallments = parseInt(formData.installments) || 1;
                        const installmentAmount = amount / numInstallments;
                        let firstTransactionId: string | undefined;

                        // Criar transação para cada parcela
                        for (let i = 0; i < numInstallments; i++) {
                            const { month, year } = getInvoiceMonthYear(purchaseDate, card.closingDay, i);

                            // Buscar ou criar fatura do mês
                            const invoice = await getOrCreateInvoice(
                                card.id,
                                user!.uid,
                                month,
                                year,
                                card.closingDay,
                                card.dueDay
                            );

                            const description = numInstallments > 1
                                ? `${formData.description} (${i + 1}/${numInstallments})`
                                : formData.description;

                            // Data da parcela = data de vencimento da fatura
                            const installmentDate = invoice.dueDate || new Date(year, month - 1, card.dueDay);

                            const transactionData: Parameters<typeof add>[0] = {
                                type: "despesa",
                                description,
                                amount: installmentAmount,
                                category: selectedCategory?.name || formData.category,
                                date: installmentDate,
                                paymentMethod: "credit",
                                creditCardId: card.id,
                                invoiceId: invoice.id,
                                installments: numInstallments,
                                installmentNumber: i + 1,
                                personId: formData.personId === "family" ? null : formData.personId,
                                totalAmount: amount,
                                purchaseDate: purchaseDate,
                            };

                            // Só adiciona parentTransactionId se não for a primeira parcela
                            if (i > 0 && firstTransactionId) {
                                transactionData.parentTransactionId = firstTransactionId;
                            }

                            const transactionId = await add(transactionData);

                            if (i === 0) firstTransactionId = transactionId;

                            // Atualizar total da fatura
                            await updateInvoiceTotal(invoice.id, installmentAmount, "add");
                        }

                        toast.success(
                            numInstallments > 1
                                ? `Compra parcelada em ${numInstallments}x adicionada!`
                                : "Despesa no cartão adicionada!"
                        );
                    }
                }
            }

            handleClose();
        } catch (error) {
            console.error("Erro detalhado ao adicionar transação:", error);
            if (error instanceof Error) {
                console.error("Message:", error.message);
                console.error("Stack:", error.stack);
            }
            toast.error("Erro ao adicionar transação. Verifique o console.");
        } finally {
            setSaving(false);
        }
    };

    const getPaymentMethodLabel = () => {
        switch (formData.paymentMethod) {
            case "debit": return "Débito/PIX";
            case "credit": return "Cartão de Crédito";
            case "boleto": return "Boleto";
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-background border-border max-w-lg max-h-[90vh] overflow-y-auto">
                {/* STEP 1: Escolher tipo */}
                {step === "type" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-foreground text-center">Nova Transação</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-center">
                                Escolha o tipo de transação
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-6">
                            <button
                                onClick={() => handleTypeSelect("receita")}
                                className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:shadow-emerald-500/30 group border-none"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                                    <TrendingUp className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-lg">Receita</p>
                                    <p className="text-sm text-emerald-100">Entrada de dinheiro</p>
                                </div>
                            </button>
                            <button
                                onClick={() => handleTypeSelect("despesa")}
                                className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] hover:shadow-red-500/30 group border-none"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                                    <TrendingDown className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-lg">Despesa</p>
                                    <p className="text-sm text-red-100">Saída de dinheiro</p>
                                </div>
                            </button>
                        </div>
                    </>
                )}

                {/* STEP 2: Escolher forma de pagamento (só despesa) */}
                {step === "payment" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-foreground text-center">Forma de Pagamento</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-center">
                                Como você pagou essa despesa?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-3 py-4">
                            <button
                                onClick={() => handlePaymentSelect("debit")}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/10 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20 border-none"
                            >
                                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold">Débito</p>
                                    <p className="text-xs text-emerald-100">Cartão de débito</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handlePaymentSelect("pix")}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/10 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20 border-none"
                            >
                                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Smartphone className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold">PIX</p>
                                    <p className="text-xs text-cyan-100">Transferência</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handlePaymentSelect("credit")}
                                disabled={creditCards.length === 0}
                                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/10 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/20 text-left disabled:opacity-50 disabled:cursor-not-allowed border-none"
                            >
                                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                                    <CreditCard className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate">Cartão de Crédito</p>
                                    <p className="text-sm text-violet-100 truncate">Vai para a fatura</p>
                                </div>
                                {creditCards.length === 0 && (
                                    <Link
                                        href="/cartoes"
                                        onClick={handleClose}
                                        className="text-xs text-white/80 hover:text-white underline shrink-0"
                                    >
                                        Criar
                                    </Link>
                                )}
                            </button>

                            <button
                                onClick={() => handlePaymentSelect("boleto")}
                                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/10 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/20 text-left border-none"
                            >
                                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                                    <Receipt className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold truncate">Boleto / Carnê</p>
                                    <p className="text-sm text-orange-100 truncate">Pendente ou pago</p>
                                </div>
                            </button>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep("type")}
                                className="text-muted-foreground"
                            >
                                Voltar
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* STEP 3: Formulário */}
                {step === "form" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-foreground flex items-center gap-2">
                                {type === "receita" ? (
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                ) : (
                                    <TrendingDown className="w-5 h-5 text-red-400" />
                                )}
                                {initialData ? "Editar" : "Nova"} {type === "receita" ? "Receita" : "Despesa"}
                                {type === "despesa" && (
                                    <span className="text-sm text-muted-foreground font-normal">
                                        • {getPaymentMethodLabel()}
                                    </span>
                                )}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                {initialData ? "Altere os dados da transação" : "Preencha os dados da transação"}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Descrição</Label>
                                <Input
                                    placeholder={type === "receita" ? "Ex: Salário janeiro" : "Ex: Supermercado"}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-muted/50 border-input text-foreground"
                                    required
                                />
                            </div>

                            {(type === "receita" || (formData.paymentMethod !== "credit" && formData.paymentMethod !== "boleto")) && (
                                <div className="flex items-center justify-between p-4 rounded-xl border border-input bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-foreground">Transação Fixa / Mensal</Label>
                                        <p className="text-xs text-muted-foreground">Repete todo mês no mesmo dia</p>
                                    </div>
                                    <Switch
                                        checked={formData.isRecurring}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Atribuir a</Label>
                                    <Select
                                        value={formData.personId}
                                        onValueChange={(value) => setFormData({ ...formData, personId: value })}
                                    >
                                        <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border">
                                            <SelectItem value="family" className="text-muted-foreground focus:bg-accent focus:text-foreground cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-emerald-400" />
                                                    <span>Família</span>
                                                </div>
                                            </SelectItem>
                                            {user && (
                                                <SelectItem value={user.uid} className="text-muted-foreground focus:bg-accent focus:text-foreground cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-blue-400" />
                                                        <span>{user.displayName?.split(" ")[0] || "Eu"}</span>
                                                    </div>
                                                </SelectItem>
                                            )}
                                            {people.map((person) => (
                                                <SelectItem key={person.id} value={person.id} className="text-muted-foreground focus:bg-accent focus:text-foreground cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        <span>{person.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">
                                        {formData.paymentMethod === "credit" && (parseInt(formData.installments) || 1) > 1
                                            ? "Valor Total"
                                            : "Valor"
                                        }
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="0,00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="bg-muted/50 border-input text-foreground"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Data</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="bg-muted/50 border-input text-foreground"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Seleção de Conta (Receita ou Débito/PIX/Boleto) */}
                            {(type === "receita" || formData.paymentMethod === "debit" || formData.paymentMethod === "pix" || formData.paymentMethod === "boleto") && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-muted-foreground">
                                            {type === "receita" ? "Entrar na conta" : "Sair da conta"}
                                        </Label>
                                        <Link
                                            href="/contas"
                                            onClick={handleClose}
                                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Nova conta
                                        </Link>
                                    </div>
                                    {loadingData ? (
                                        <Skeleton className="h-10 w-full bg-muted" />
                                    ) : accounts.length === 0 ? (
                                        <div className="p-4 rounded-lg bg-muted/50 border border-input text-center">
                                            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada</p>
                                            <Link
                                                href="/contas"
                                                onClick={handleClose}
                                                className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 inline-block"
                                            >
                                                Criar conta
                                            </Link>
                                        </div>
                                    ) : (
                                        <Select
                                            value={formData.accountId}
                                            onValueChange={(v) => setFormData({ ...formData, accountId: v })}
                                        >
                                            <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                                <SelectValue placeholder="Selecione uma conta" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border-border">
                                                {accounts.map((acc) => {
                                                    const bank = getBankByCode(acc.bankCode);
                                                    const Icon = getIconById(bank.icon);
                                                    return (
                                                        <SelectItem
                                                            key={acc.id}
                                                            value={acc.id}
                                                            className="text-muted-foreground focus:bg-accent focus:text-foreground"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-5 h-5 rounded flex items-center justify-center"
                                                                    style={{ backgroundColor: acc.color }}
                                                                >
                                                                    <Icon className="w-3 h-3 text-white" />
                                                                </div>
                                                                {acc.name}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {(() => {
                                        const selectedAccount = accounts.find(a => a.id === formData.accountId);
                                        const linkedGoal = goals.find(g => g.linkedAccountId === formData.accountId);

                                        if (selectedAccount?.type === 'emergency') {
                                            return (
                                                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                                    <div className="text-sm text-red-400">
                                                        <span className="font-medium block">Atenção!</span>
                                                        Você está utilizando sua Reserva de Emergência.
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (linkedGoal) {
                                            return (
                                                <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                                                    <div className="text-sm text-yellow-400">
                                                        <span className="font-medium block">Atenção!</span>
                                                        Esta conta está vinculada à meta: <strong>{linkedGoal.title}</strong>.
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}

                            {/* Seleção de Cartão (Crédito) */}
                            {type === "despesa" && formData.paymentMethod === "credit" && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Cartão</Label>
                                        <Select
                                            value={formData.creditCardId}
                                            onValueChange={(v) => setFormData({ ...formData, creditCardId: v })}
                                        >
                                            <SelectTrigger className="bg-muted/50 border-input text-foreground">
                                                <SelectValue placeholder="Selecione um cartão" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border-border">
                                                {creditCards.map((card) => {
                                                    const bank = getBankByCode(card.bankCode);
                                                    return (
                                                        <SelectItem
                                                            key={card.id}
                                                            value={card.id}
                                                            className="text-muted-foreground focus:bg-accent focus:text-foreground"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-5 h-5 rounded flex items-center justify-center"
                                                                    style={{ backgroundColor: card.color }}
                                                                >
                                                                    <CreditCard className="w-3 h-3 text-white" />
                                                                </div>
                                                                {card.name}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Parcelas</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={formData.installments}
                                            onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                                            className="bg-muted/50 border-input text-foreground"
                                        />
                                        {(parseInt(formData.installments) || 1) > 1 && formData.amount && (
                                            <p className="text-sm text-muted-foreground">
                                                {parseInt(formData.installments) || 1}x de{" "}
                                                <span className="text-foreground font-medium">
                                                    R$ {(parseFloat(formData.amount) / (parseInt(formData.installments) || 1)).toFixed(2)}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Opções de Boleto */}
                            {type === "despesa" && formData.paymentMethod === "boleto" && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">Parcelas</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={formData.boletoInstallments}
                                                onChange={(e) => setFormData({ ...formData, boletoInstallments: e.target.value })}
                                                className="bg-muted/50 border-input text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">
                                                {parseInt(formData.boletoInstallments) > 1 ? "Vencimento 1ª Parcela" : "Vencimento"}
                                            </Label>
                                            <Input
                                                type="date"
                                                value={formData.boletoDueDate}
                                                onChange={(e) => setFormData({ ...formData, boletoDueDate: e.target.value })}
                                                className="bg-muted/50 border-input text-foreground"
                                            />
                                        </div>
                                    </div>

                                    {/* Info de parcelas */}
                                    {parseInt(formData.boletoInstallments) > 1 && formData.amount && (
                                        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                            <p className="text-sm text-yellow-400">
                                                📋 Carnê de {formData.boletoInstallments}x de{" "}
                                                <span className="font-bold">
                                                    R$ {(parseFloat(formData.amount) / parseInt(formData.boletoInstallments)).toFixed(2)}
                                                </span>
                                            </p>
                                            <p className="text-xs text-yellow-400/70 mt-1">
                                                Parcelas serão criadas com vencimento mensal a partir de {new Date(formData.boletoDueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                                            </p>
                                        </div>
                                    )}

                                    {/* Status só para boleto único */}
                                    {parseInt(formData.boletoInstallments) === 1 && (
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">Status</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, boletoStatus: "pending" })}
                                                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.boletoStatus === "pending"
                                                        ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
                                                        : "border-input bg-muted/50 text-muted-foreground hover:bg-muted"
                                                        }`}
                                                >
                                                    ⏳ Pendente
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, boletoStatus: "paid" })}
                                                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.boletoStatus === "paid"
                                                        ? "border-green-500 bg-green-500/20 text-green-400"
                                                        : "border-input bg-muted/50 text-muted-foreground hover:bg-muted"
                                                        }`}
                                                >
                                                    ✓ Já pago
                                                </button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {formData.boletoStatus === "paid"
                                                    ? "O valor será descontado da conta selecionada"
                                                    : "O valor NÃO será descontado até marcar como pago"
                                                }
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Categoria */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-muted-foreground">Categoria</Label>
                                    <Link
                                        href="/categorias"
                                        onClick={handleClose}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Gerenciar
                                    </Link>
                                </div>
                                {loadingData ? (
                                    <div className="grid grid-cols-4 gap-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <Skeleton key={i} className="h-16 rounded-lg bg-muted" />
                                        ))}
                                    </div>
                                ) : filteredCategories.length === 0 ? (
                                    <div className="p-4 rounded-lg bg-muted/50 border border-input text-center">
                                        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Nenhuma categoria de {type}</p>
                                        <Link
                                            href="/categorias"
                                            onClick={handleClose}
                                            className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 inline-block"
                                        >
                                            Criar categoria
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                                        {filteredCategories.map((cat) => {
                                            const Icon = getIconById(cat.icon);
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, category: cat.id })}
                                                    className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${formData.category === cat.id
                                                        ? type === "receita"
                                                            ? "border-green-500 bg-green-500/20 text-green-400"
                                                            : "border-red-500 bg-red-500/20 text-red-400"
                                                        : "border-input bg-muted/50 text-muted-foreground hover:bg-muted"
                                                        }`}
                                                    title={cat.name}
                                                >
                                                    <Icon
                                                        className="w-5 h-5"
                                                        style={{ color: formData.category === cat.id ? undefined : cat.color }}
                                                    />
                                                    <span className="text-[10px] truncate w-full">{cat.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep(type === "despesa" ? "payment" : "type")}
                                    className="text-muted-foreground"
                                >
                                    Voltar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving || accounts.length === 0}
                                    className={type === "receita"
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-red-600 hover:bg-red-700 text-white"
                                    }
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {initialData ? "Salvar" : "Adicionar"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
