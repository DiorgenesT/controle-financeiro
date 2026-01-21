"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Pencil,
    Trash2,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    Repeat
} from "lucide-react";
import { useRecurring } from "@/hooks/useRecurring";
import { RecurringModal } from "@/components/RecurringModal";
import { RecurringTransaction } from "@/types";
import { toast } from "sonner";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export default function FixasPage() {
    const { recurring, loading, deleteRecurringTransaction, refresh } = useRecurring();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
    const [filter, setFilter] = useState<"todas" | "receita" | "despesa">("todas");

    // Verificar parâmetro de URL para edição automática
    useEffect(() => {

        const searchParams = new URLSearchParams(window.location.search);
        const editId = searchParams.get("editId");

        if (editId && recurring.length > 0) {
            const itemToEdit = recurring.find(item => item.id === editId);
            if (itemToEdit) {
                setEditingItem(itemToEdit);
                setIsModalOpen(true);
                // Limpar URL
                window.history.replaceState({}, "", "/fixas");
            }
        }
    }, [recurring]);

    const handleEdit = (item: RecurringTransaction) => {

        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta transação fixa?")) return;
        try {
            await deleteRecurringTransaction(id);
            toast.success("Removido com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover");
        }
    };

    const filteredRecurring = (filter === "todas"
        ? recurring
        : recurring.filter(item => item.type === filter)
    ).sort((a, b) => b.amount - a.amount); // Ordenar por valor (maior primeiro)



    return (
        <div className="min-h-screen bg-background">
            <Header title="Transações Fixas" />

            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <p className="text-muted-foreground">
                            Gerencie suas receitas e despesas recorrentes
                        </p>
                    </div>
                    <Tabs value={filter} onValueChange={(v) => setFilter(v as "todas" | "receita" | "despesa")}>
                        <TabsList className="bg-muted/50 border border-input">
                            <TabsTrigger
                                value="todas"
                                className="data-[state=active]:bg-muted data-[state=active]:text-foreground"
                            >
                                Todas
                            </TabsTrigger>
                            <TabsTrigger
                                value="receita"
                                className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400"
                            >
                                Receitas
                            </TabsTrigger>
                            <TabsTrigger
                                value="despesa"
                                className="data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400"
                            >
                                Despesas
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {loading ? (
                    <div className="text-foreground">Carregando...</div>
                ) : (
                    <>
                        <div className="text-xs text-muted-foreground mb-2">
                            Mostrando {filteredRecurring.length} de {recurring.length} transações fixas
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredRecurring.map((item) => (
                                <Card
                                    key={item.id}
                                    className={`border-none transition-colors shadow-lg ${item.type === 'receita'
                                        ? 'bg-gradient-to-br from-green-500 to-green-700 shadow-green-500/20'
                                        : 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/20'
                                        }`}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-white/20">
                                                    {item.type === 'receita' ? (
                                                        <ArrowUpCircle className="w-5 h-5 text-white" />
                                                    ) : (
                                                        <ArrowDownCircle className="w-5 h-5 text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-white text-lg">{item.description}</CardTitle>
                                                    <CardDescription className="text-white/80">{item.category}</CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-sm text-white/80 mb-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Dia {item.day}
                                                </p>
                                                <p className="text-2xl font-bold text-white">
                                                    {formatCurrency(item.amount)}
                                                </p>
                                            </div>
                                            <div className="text-xs text-white/80 flex items-center gap-1">
                                                <Repeat className="w-3 h-3" />
                                                Mensal
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {filteredRecurring.length === 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                                    <Repeat className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>
                                        {filter === "todas"
                                            ? "Nenhuma transação fixa cadastrada."
                                            : filter === "receita"
                                                ? "Nenhuma receita fixa cadastrada."
                                                : "Nenhuma despesa fixa cadastrada."
                                        }
                                    </p>
                                    <p className="text-sm mt-2">Cadastre ao criar uma nova transação.</p>
                                </div>
                            )}
                        </div>
                    </>
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
