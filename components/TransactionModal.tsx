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
import { addRecurringTransaction, updateRecurringTransaction } from "@/lib/recurring";
import { PaymentMethod, BoletoStatus, Person, Goal } from "@/types";
import { addTransaction, getGoals, updateGoal } from "@/lib/firestore";
import { toast } from "sonner";
import Link from "next/link";
import { Repeat } from "lucide-react";

interface TransactionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type?: "receita" | "despesa";
    initialData?: any; // Usar Transaction type se possível, mas any evita conflito circular se não importado
    defaultPaymentMethod?: PaymentMethod;
}

export function TransactionModal({
    open,
    onOpenChange,
    type: initialType,
    initialData,
    defaultPaymentMethod
}: TransactionModalProps) {
    const { add } = useTransactions();
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
                    paymentMethod: initialData.paymentMethod,
                    accountId: initialData.accountId || "",
                    creditCardId: initialData.creditCardId || "",
                    installments: initialData.installments || 1,
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
                    installments: 1,
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
        paymentMethod: defaultPaymentMethod || "debit" as PaymentMethod,
        accountId: "",
        creditCardId: "",
        installments: 1,
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
                installments: 1,
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

            // Criar recorrência se selecionado
            let recurringTransactionId: string | undefined;
            if (formData.isRecurring && user?.uid) {
                try {
                    recurringTransactionId = await addRecurringTransaction(user.uid, {
                        type: type,
                        amount,
                        category: selectedCategory?.name || formData.category,
                        description: formData.description,
                        day: purchaseDate.getDate(),
                        active: true,
                        personId: formData.personId === "family" ? null : formData.personId,
                        lastProcessedDate: purchaseDate
                    });
                } catch (err) {
                    console.error("Erro ao criar recorrência:", err);
                    toast.error("Erro ao criar recorrência");
                    setSaving(false);
                    return;
                }
            }

            // === RECEITA ===
            if (type === "receita") {
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

                // Atualizar saldo da conta
                await updateAccountBalance(formData.accountId, amount, "add");

                toast.success("Receita adicionada!");
            }

            // === DESPESA ===
            else {
                // DÉBITO ou PIX - sai da conta na hora
                if (formData.paymentMethod === "debit" || formData.paymentMethod === "pix") {
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

                // BOLETO
                else if (formData.paymentMethod === "boleto") {
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

                // CARTÃO DE CRÉDITO
                else if (formData.paymentMethod === "credit") {
                    const card = creditCards.find(c => c.id === formData.creditCardId)!;
                    const installmentAmount = amount / formData.installments;
                    let firstTransactionId: string | undefined;

                    // Criar transação para cada parcela
                    for (let i = 0; i < formData.installments; i++) {
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

                        const description = formData.installments > 1
                            ? `${formData.description} (${i + 1}/${formData.installments})`
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
                            installments: formData.installments,
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
                        formData.installments > 1
                            ? `Compra parcelada em ${formData.installments}x adicionada!`
                            : "Despesa no cartão adicionada!"
                    );
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
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
                {/* STEP 1: Escolher tipo */}
                {step === "type" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-white text-center">Nova Transação</DialogTitle>
                            <DialogDescription className="text-zinc-400 text-center">
                                Escolha o tipo de transação
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-6">
                            <button
                                onClick={() => handleTypeSelect("receita")}
                                className="flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-green-500 hover:bg-green-500/10 transition-all group"
                            >
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                                    <TrendingUp className="w-8 h-8 text-green-400" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-white">Receita</p>
                                    <p className="text-sm text-zinc-400">Entrada de dinheiro</p>
                                </div>
                            </button>
                            <button
                                onClick={() => handleTypeSelect("despesa")}
                                className="flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-red-500 hover:bg-red-500/10 transition-all group"
                            >
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                                    <TrendingDown className="w-8 h-8 text-red-400" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-white">Despesa</p>
                                    <p className="text-sm text-zinc-400">Saída de dinheiro</p>
                                </div>
                            </button>
                        </div>
                    </>
                )}

                {/* STEP 2: Escolher forma de pagamento (só despesa) */}
                {step === "payment" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-white text-center">Forma de Pagamento</DialogTitle>
                            <DialogDescription className="text-zinc-400 text-center">
                                Como você pagou essa despesa?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-3 py-4">
                            <button
                                onClick={() => handlePaymentSelect("debit")}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all"
                            >
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-white">Débito</p>
                                    <p className="text-xs text-zinc-400">Cartão de débito</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handlePaymentSelect("pix")}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all"
                            >
                                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                    <Smartphone className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-white">PIX</p>
                                    <p className="text-xs text-zinc-400">Transferência</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handlePaymentSelect("credit")}
                                disabled={creditCards.length === 0}
                                className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-violet-500 hover:bg-violet-500/10 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-violet-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-white">Cartão de Crédito</p>
                                    <p className="text-sm text-zinc-400">Vai para a fatura</p>
                                </div>
                                {creditCards.length === 0 && (
                                    <Link
                                        href="/cartoes"
                                        onClick={handleClose}
                                        className="text-xs text-violet-400 hover:text-violet-300"
                                    >
                                        Criar cartão
                                    </Link>
                                )}
                            </button>

                            <button
                                onClick={() => handlePaymentSelect("boleto")}
                                className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-orange-500 hover:bg-orange-500/10 transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                    <Receipt className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">Boleto / Carnê</p>
                                    <p className="text-sm text-zinc-400">Pendente ou já pago</p>
                                </div>
                            </button>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep("type")}
                                className="text-zinc-400"
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
                            <DialogTitle className="text-white flex items-center gap-2">
                                {type === "receita" ? (
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                ) : (
                                    <TrendingDown className="w-5 h-5 text-red-400" />
                                )}
                                Nova {type === "receita" ? "Receita" : "Despesa"}
                                {type === "despesa" && (
                                    <span className="text-sm text-zinc-400 font-normal">
                                        • {getPaymentMethodLabel()}
                                    </span>
                                )}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Preencha os dados da transação
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Descrição</Label>
                                <Input
                                    placeholder={type === "receita" ? "Ex: Salário janeiro" : "Ex: Supermercado"}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-zinc-800/50 border-zinc-700 text-white"
                                    required
                                />
                            </div>

                            {(type === "receita" || (formData.paymentMethod !== "credit" && formData.paymentMethod !== "boleto")) && (
                                <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-700 bg-zinc-800/30">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-zinc-200">Transação Fixa / Mensal</Label>
                                        <p className="text-xs text-zinc-400">Repete todo mês no mesmo dia</p>
                                    </div>
                                    <Switch
                                        checked={formData.isRecurring}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Atribuir a</Label>
                                    <Select
                                        value={formData.personId}
                                        onValueChange={(value) => setFormData({ ...formData, personId: value })}
                                    >
                                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800">
                                            <SelectItem value="family" className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-emerald-400" />
                                                    <span>Família</span>
                                                </div>
                                            </SelectItem>
                                            {user && (
                                                <SelectItem value={user.uid} className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-blue-400" />
                                                        <span>{user.displayName?.split(" ")[0] || "Eu"}</span>
                                                    </div>
                                                </SelectItem>
                                            )}
                                            {people.map((person) => (
                                                <SelectItem key={person.id} value={person.id} className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-zinc-400" />
                                                        <span>{person.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">
                                        {formData.paymentMethod === "credit" && formData.installments > 1
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
                                        className="bg-zinc-800/50 border-zinc-700 text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Data</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="bg-zinc-800/50 border-zinc-700 text-white"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Seleção de Conta (Receita ou Débito/PIX/Boleto) */}
                            {(type === "receita" || formData.paymentMethod === "debit" || formData.paymentMethod === "pix" || formData.paymentMethod === "boleto") && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-zinc-300">
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
                                        <Skeleton className="h-10 w-full bg-zinc-800" />
                                    ) : accounts.length === 0 ? (
                                        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-center">
                                            <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                            <p className="text-sm text-zinc-400">Nenhuma conta cadastrada</p>
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
                                        <Label className="text-zinc-300">Cartão</Label>
                                        <Select
                                            value={formData.creditCardId}
                                            onValueChange={(v) => setFormData({ ...formData, creditCardId: v })}
                                        >
                                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                                <SelectValue placeholder="Selecione um cartão" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                                {creditCards.map((card) => {
                                                    const bank = getBankByCode(card.bankCode);
                                                    return (
                                                        <SelectItem
                                                            key={card.id}
                                                            value={card.id}
                                                            className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
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
                                        <Label className="text-zinc-300">Parcelas</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="1"
                                            value={formData.installments}
                                            onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) || 1 })}
                                            className="bg-zinc-800/50 border-zinc-700 text-white"
                                        />
                                        {formData.installments > 1 && formData.amount && (
                                            <p className="text-sm text-zinc-400">
                                                {formData.installments}x de{" "}
                                                <span className="text-white font-medium">
                                                    R$ {(parseFloat(formData.amount) / formData.installments).toFixed(2)}
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
                                            <Label className="text-zinc-300">Parcelas</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                placeholder="1"
                                                value={formData.boletoInstallments}
                                                onChange={(e) => setFormData({ ...formData, boletoInstallments: e.target.value })}
                                                className="bg-zinc-800/50 border-zinc-700 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">
                                                {parseInt(formData.boletoInstallments) > 1 ? "Vencimento 1ª Parcela" : "Vencimento"}
                                            </Label>
                                            <Input
                                                type="date"
                                                value={formData.boletoDueDate}
                                                onChange={(e) => setFormData({ ...formData, boletoDueDate: e.target.value })}
                                                className="bg-zinc-800/50 border-zinc-700 text-white"
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
                                            <Label className="text-zinc-300">Status</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, boletoStatus: "pending" })}
                                                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.boletoStatus === "pending"
                                                        ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
                                                        : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800"
                                                        }`}
                                                >
                                                    ⏳ Pendente
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, boletoStatus: "paid" })}
                                                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.boletoStatus === "paid"
                                                        ? "border-green-500 bg-green-500/20 text-green-400"
                                                        : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800"
                                                        }`}
                                                >
                                                    ✓ Já pago
                                                </button>
                                            </div>
                                            <p className="text-xs text-zinc-500">
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
                                    <Label className="text-zinc-300">Categoria</Label>
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
                                            <Skeleton key={i} className="h-16 rounded-lg bg-zinc-800" />
                                        ))}
                                    </div>
                                ) : filteredCategories.length === 0 ? (
                                    <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-center">
                                        <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                        <p className="text-sm text-zinc-400">Nenhuma categoria de {type}</p>
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
                                                        : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800"
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
                                    className="text-zinc-400"
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
                                    Adicionar
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
