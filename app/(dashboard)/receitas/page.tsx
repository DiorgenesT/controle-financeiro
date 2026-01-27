"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    TrendingUp,
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

export default function ReceitasPage() {
    const { user } = useAuth();
    const { receitas, totalReceitas, loading, remove } = useTransactions();
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Buscar categorias do Firestore
    useEffect(() => {
        async function fetchCategories() {
            if (!user?.uid) return;
            try {
                const data = await getCategories(user.uid);
                setCategories(data.filter(c => c.type === "receita"));
            } catch (error) {
                console.error("Erro ao buscar categorias:", error);
            }
        }
        fetchCategories();
    }, [user?.uid]);

    const filteredReceitas = receitas.filter(r =>
        r.description.toLowerCase().includes(searchTerm.toLowerCase())
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
            toast.success("Receita removida!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover receita");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header title="Receitas" />

            <TransactionModal open={showModal} onOpenChange={setShowModal} />

            <div className="p-6 space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder="Buscar receitas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground"
                            />
                        </div>
                        <Button variant="outline" className="border-input text-muted-foreground hover:bg-accent hover:text-foreground">
                            <Filter className="w-4 h-4 mr-2" />
                            Filtrar
                        </Button>
                    </div>

                    <Button
                        onClick={() => setShowModal(true)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Receita
                    </Button>
                </div>

                {/* Summary Card */}
                <Card className="bg-gradient-to-br from-green-500 to-green-700 border-none shadow-lg shadow-green-500/20">
                    <CardContent className="p-4 md:pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs md:text-sm text-white/80 font-medium">Total de Receitas</p>
                                {loading ? (
                                    <Skeleton className="h-7 md:h-9 w-32 md:w-40 bg-white/20 mt-1" />
                                ) : (
                                    <p className="text-xl md:text-3xl font-bold text-white mt-0.5 md:mt-1">{formatCurrency(totalReceitas)}</p>
                                )}
                            </div>
                            <div className="w-10 h-10 md:w-16 md:h-16 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                                <TrendingUp className="w-5 h-5 md:w-8 md:h-8 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Receitas List */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Histórico de Receitas</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Todas as suas entradas registradas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-12 h-12 rounded-lg bg-muted" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-40 bg-muted" />
                                                <Skeleton className="h-3 w-32 bg-muted" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-5 w-24 bg-muted" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredReceitas.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Nenhuma receita encontrada</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Adicione sua primeira receita clicando no botão acima
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredReceitas.map((receita) => {
                                    const category = getCategoryByName(receita.category);
                                    const Icon = category ? getIconById(category.icon) : TrendingUp;
                                    const color = category?.color || "#10B981";

                                    return (
                                        <div
                                            key={receita.id}
                                            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${color}, ${color}dd)`
                                                    }}
                                                >
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-lg">{receita.description}</p>
                                                    <span className="text-sm text-muted-foreground flex items-center mt-1">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {formatDate(receita.date)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-lg font-bold text-emerald-600">
                                                    +{formatCurrency(receita.amount)}
                                                </span>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-popover border-border">
                                                        <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent">
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                                                            onClick={() => handleDelete(receita.id)}
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
