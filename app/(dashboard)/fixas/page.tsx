"use client";

import { useState } from "react";
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
    const { recurring, loading, deleteRecurringTransaction } = useRecurring();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
    const [filter, setFilter] = useState<"todas" | "receita" | "despesa">("todas");

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

    const filteredRecurring = filter === "todas"
        ? recurring
        : recurring.filter(item => item.type === filter);

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header title="Transações Fixas" />

            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <p className="text-zinc-400">
                            Gerencie suas receitas e despesas recorrentes
                        </p>
                    </div>
                    <Tabs value={filter} onValueChange={(v) => setFilter(v as "todas" | "receita" | "despesa")}>
                        <TabsList className="bg-zinc-800/50 border border-zinc-700">
                            <TabsTrigger
                                value="todas"
                                className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
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
                    <div className="text-white">Carregando...</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredRecurring.map((item) => (
                            <Card key={item.id} className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80 transition-colors">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${item.type === 'receita' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                {item.type === 'receita' ? (
                                                    <ArrowUpCircle className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <ArrowDownCircle className="w-5 h-5 text-red-400" />
                                                )}
                                            </div>
                                            <div>
                                                <CardTitle className="text-white text-lg">{item.description}</CardTitle>
                                                <CardDescription className="text-zinc-400">{item.category}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 text-zinc-400 hover:text-white">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm text-zinc-500 mb-1 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Dia {item.day}
                                            </p>
                                            <p className={`text-2xl font-bold ${item.type === 'receita' ? 'text-green-400' : 'text-red-400'}`}>
                                                {formatCurrency(item.amount)}
                                            </p>
                                        </div>
                                        <div className="text-xs text-zinc-600 flex items-center gap-1">
                                            <Repeat className="w-3 h-3" />
                                            Mensal
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {filteredRecurring.length === 0 && (
                            <div className="col-span-full text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
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
                )}
            </div>

            <RecurringModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                initialData={editingItem}
            />
        </div>
    );
}
