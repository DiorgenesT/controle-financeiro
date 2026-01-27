"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
    format,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import {
    Pencil,
    Trash2,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    Repeat,
    ChevronLeft,
    ChevronRight,
    Plus,
    Tag
} from "lucide-react";
import { useRecurring } from "@/hooks/useRecurring";
import { RecurringModal } from "@/components/RecurringModal";
import { RecurringTransaction } from "@/types";
import { getCategories, Category } from "@/lib/categories";
import { getIconById } from "@/lib/icons";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export default function FixasPage() {
    const { user } = useAuth();
    const { recurring, loading, deleteRecurringTransaction, refresh } = useRecurring();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

    // Carregar categorias para exibir ícones
    useEffect(() => {
        if (!user?.uid) return;
        getCategories(user.uid).then(setCategories).catch(console.error);
    }, [user?.uid]);

    // Verificar parâmetro de URL para edição automática
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const editId = searchParams.get("editId");

        if (editId && recurring.length > 0) {
            const itemToEdit = recurring.find(item => item.id === editId);
            if (itemToEdit) {
                setEditingItem(itemToEdit);
                setIsModalOpen(true);
                window.history.replaceState({}, "", "/fixas");
            }
        }
    }, [recurring]);

    const handleEdit = (item: RecurringTransaction, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja excluir esta transação fixa?")) return;
        try {
            await deleteRecurringTransaction(id);
            toast.success("Removido com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover");
        }
    };



    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title="Calendário de Fixas" />

            <div className="flex-1 p-4 md:p-6 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex flex-col">
                        <h2 className="text-3xl font-black tracking-tight text-foreground">
                            Transações Fixas
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Gerencie suas receitas e despesas recorrentes
                        </p>
                    </div>

                    <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="gap-2 shadow-lg shadow-primary/20 px-6 h-12 rounded-2xl font-bold">
                        <Plus className="w-5 h-5" />
                        Nova Fixa
                    </Button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Carregando transações fixas...
                    </div>
                ) : recurring.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                        <div className="p-6 rounded-full bg-muted/20">
                            <Calendar className="w-12 h-12 opacity-20" />
                        </div>
                        <p>Nenhuma transação fixa cadastrada.</p>
                        <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} variant="outline">
                            Criar minha primeira fixa
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4 pb-8">
                        {recurring.sort((a, b) => a.day - b.day).map((item) => {
                            const category = categories.find(c => c.name === item.category && c.type === item.type);
                            const CategoryIcon = category ? getIconById(category.icon || 'tag') : Tag;

                            return (
                                <div
                                    key={item.id}
                                    onClick={(e) => handleEdit(item, e)}
                                    className={`
                                        group relative flex flex-col justify-between p-2.5 md:p-4 rounded-2xl md:rounded-3xl cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] active:scale-[0.97] overflow-hidden border border-white/10
                                        ${item.type === 'receita'
                                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-500/20'
                                            : 'bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-500/20'}
                                    `}
                                >
                                    {/* Glassmorphism Overlay */}
                                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    {/* Background Accent Icon */}
                                    <div className="absolute -right-2 -top-2 md:-right-4 md:-top-4 opacity-[0.07] group-hover:opacity-[0.15] group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700 ease-out">
                                        {item.type === 'receita'
                                            ? <ArrowUpCircle className="w-16 h-16 md:w-24 md:h-24" />
                                            : <ArrowDownCircle className="w-16 h-16 md:w-24 md:h-24" />
                                        }
                                    </div>

                                    <div className="relative z-10 flex flex-col gap-0.5 md:gap-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10">
                                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter md:tracking-widest opacity-90">
                                                    Dia {item.day}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 md:h-7 md:w-7 text-white hover:bg-white/20 rounded-full transition-colors"
                                                    onClick={(e) => handleEdit(item, e)}
                                                >
                                                    <Pencil className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 md:h-7 md:w-7 text-white hover:bg-white/20 rounded-full transition-colors"
                                                    onClick={(e) => handleDelete(item.id, e)}
                                                >
                                                    <Trash2 className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-1 md:mt-2">
                                            <div className="p-1 md:p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                                <CategoryIcon className="w-2.5 h-2.5 md:w-4 md:h-4 text-white" />
                                            </div>
                                            <h3 className="font-bold text-[10px] md:text-sm line-clamp-1 leading-tight tracking-tight">
                                                {item.description}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-3 md:mt-8">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] md:text-[9px] font-bold uppercase opacity-60 tracking-widest mb-0.5">Valor Fixo</span>
                                            <p className="text-xs md:text-xl font-black tabular-nums tracking-tighter md:tracking-tight">
                                                {new Intl.NumberFormat("pt-BR", {
                                                    style: "currency",
                                                    currency: "BRL",
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                }).format(item.amount)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <RecurringModal
                key={editingItem?.id || 'new'}
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setEditingItem(null);
                }}
                initialData={editingItem}
                onSuccess={() => {
                    refresh();
                }}
            />
        </div>
    );
}
