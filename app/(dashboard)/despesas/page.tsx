"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    TrendingDown,
    Calendar,
    MoreHorizontal,
    Pencil,
    Trash2,
    FileText,
    Search,
    Filter,
    Plus,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { getCategories, Category } from "@/lib/categories";
import { getIconById } from "@/lib/icons";
import { TransactionModal } from "@/components/TransactionModal";
import { toast } from "sonner";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
};

export default function DespesasPage() {
    const { user } = useAuth();
    const { despesas, totalDespesas, loading, remove } = useTransactions();
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Buscar categorias do Firestore
    useEffect(() => {
        async function fetchCategories() {
            if (!user?.uid) return;
            try {
                const data = await getCategories(user.uid);
                setCategories(data.filter(c => c.type === "despesa"));
            } catch (error) {
                console.error("Erro ao buscar categorias:", error);
            }
        }
        fetchCategories();
    }, [user?.uid]);

    const filteredDespesas = despesas.filter(d =>
        d.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Buscar categoria pelo nome (que é como está salvo na transação)
    const getCategoryByName = (categoryName: string) => {
        return categories.find(c =>
            c.name.toLowerCase() === categoryName.toLowerCase() ||
            c.id === categoryName
        );
    };

    const handleDelete = async (id: string) => {
        try {
            await remove(id);
            toast.success("Despesa removida!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover despesa");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header title="Despesas" />

            <TransactionModal open={showModal} onOpenChange={setShowModal} />

            <div className="p-6 space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder="Buscar despesas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                            <Filter className="w-4 h-4 mr-2" />
                            Filtrar
                        </Button>
                    </div>

                    <Button
                        onClick={() => setShowModal(true)}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Despesa
                    </Button>
                </div>

                {/* Summary Card */}
                <Card className="bg-gradient-to-br from-red-900/30 to-zinc-900/50 border-red-800/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-400">Total de Despesas</p>
                                {loading ? (
                                    <Skeleton className="h-9 w-40 bg-zinc-800 mt-1" />
                                ) : (
                                    <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalDespesas)}</p>
                                )}
                            </div>
                            <div className="w-16 h-16 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <TrendingDown className="w-8 h-8 text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Despesas List */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Histórico de Despesas</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Todas as suas saídas registradas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-12 h-12 rounded-lg bg-zinc-700" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-40 bg-zinc-700" />
                                                <Skeleton className="h-3 w-32 bg-zinc-700" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-5 w-24 bg-zinc-700" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredDespesas.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-400">Nenhuma despesa encontrada</p>
                                <p className="text-sm text-zinc-500 mt-1">
                                    Adicione sua primeira despesa clicando no botão acima
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredDespesas.map((despesa) => {
                                    const category = getCategoryByName(despesa.category);
                                    const Icon = category ? getIconById(category.icon) : TrendingDown;
                                    const color = category?.color || "#EF4444";
                                    const categoryName = category?.name || despesa.category;

                                    return (
                                        <div
                                            key={despesa.id}
                                            className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                                                    style={{ backgroundColor: `${color}20` }}
                                                >
                                                    <Icon className="w-5 h-5" style={{ color }} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{despesa.description}</p>
                                                    <span className="text-sm text-zinc-500 flex items-center mt-1">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {formatDate(despesa.date)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-lg font-semibold text-red-400">
                                                    -{formatCurrency(despesa.amount)}
                                                </span>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                                                        <DropdownMenuItem className="text-zinc-300 hover:text-white focus:text-white focus:bg-zinc-800">
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                                                            onClick={() => handleDelete(despesa.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
