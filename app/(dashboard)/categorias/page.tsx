"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Plus,
    Trash2,
    Loader2,
    Tag,
    TrendingUp,
    TrendingDown,
    Pencil,
    MoreHorizontal,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    initializeDefaultCategories,
    Category
} from "@/lib/categories";
import { ICON_LIBRARY, getIconById } from "@/lib/icons";
import { toast } from "sonner";

const COLORS = [
    "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
    "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
    "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF",
    "#EC4899", "#F43F5E", "#78716C", "#64748B", "#6B7280",
];

export default function CategoriasPage() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);
    const [iconFilter, setIconFilter] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        type: "despesa" as "receita" | "despesa",
        icon: "shoppingcart",
        color: "#10B981",
    });

    const fetchCategories = useCallback(async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            // Inicializar categorias padrão se necessário
            await initializeDefaultCategories(user.uid);
            const data = await getCategories(user.uid);
            // Ordenar por nome
            data.sort((a, b) => a.name.localeCompare(b.name));
            setCategories(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar categorias");
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const openEditDialog = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            type: category.type,
            icon: category.icon,
            color: category.color,
        });
        setIsDialogOpen(true);
    };

    const openNewDialog = () => {
        setEditingCategory(null);
        setFormData({
            name: "",
            type: "despesa",
            icon: "shoppingcart",
            color: "#10B981",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return;

        setSaving(true);
        try {
            if (editingCategory) {
                // Editar categoria existente
                await updateCategory(editingCategory.id, formData);
                toast.success("Categoria atualizada!");
            } else {
                // Criar nova categoria
                await addCategory(user.uid, formData);
                toast.success("Categoria criada!");
            }

            setIsDialogOpen(false);
            setEditingCategory(null);
            setIconFilter("");
            fetchCategories();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar categoria");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

        try {
            await deleteCategory(id);
            toast.success("Categoria removida!");
            fetchCategories();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover categoria");
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingCategory(null);
        setIconFilter("");
    };

    // Filtrar ícones pela busca
    const filteredIcons = iconFilter
        ? ICON_LIBRARY.filter(i => i.name.toLowerCase().includes(iconFilter.toLowerCase()))
        : ICON_LIBRARY;

    const receitaCats = categories.filter(c => c.type === "receita");
    const despesaCats = categories.filter(c => c.type === "despesa");

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header title="Categorias" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-zinc-400">
                            Gerencie suas categorias para organizar transações
                        </p>
                    </div>

                    <Button
                        onClick={openNewDialog}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Categoria
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-white">
                                    {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                                </DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    {editingCategory ? "Altere os dados da categoria" : `Crie uma categoria personalizada (${ICON_LIBRARY.length} ícones disponíveis)`}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Nome</Label>
                                    <Input
                                        placeholder="Ex: Streaming, Academia..."
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-zinc-800/50 border-zinc-700 text-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Tipo</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: "receita" })}
                                            className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.type === "receita"
                                                ? "border-green-500 bg-green-500/20 text-green-400"
                                                : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800"
                                                }`}
                                        >
                                            <TrendingUp className="w-4 h-4" />
                                            Receita
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: "despesa" })}
                                            className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.type === "despesa"
                                                ? "border-red-500 bg-red-500/20 text-red-400"
                                                : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800"
                                                }`}
                                        >
                                            <TrendingDown className="w-4 h-4" />
                                            Despesa
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Ícone ({filteredIcons.length} disponíveis)</Label>
                                    <Input
                                        placeholder="Buscar ícone..."
                                        value={iconFilter}
                                        onChange={(e) => setIconFilter(e.target.value)}
                                        className="bg-zinc-800/50 border-zinc-700 text-white"
                                    />
                                    <div className="grid grid-cols-8 gap-1.5 h-48 overflow-y-auto p-2 rounded-lg bg-zinc-800/30 border border-zinc-700">
                                        {filteredIcons.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, icon: item.id })}
                                                    className={`aspect-square rounded-lg border transition-all flex items-center justify-center ${formData.icon === item.id
                                                        ? "border-emerald-500 bg-emerald-500/20"
                                                        : "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-600"
                                                        }`}
                                                    title={item.name}
                                                >
                                                    <Icon className="w-5 h-5 text-zinc-300" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Cor</Label>
                                    <div className="grid grid-cols-10 gap-1">
                                        {COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color })}
                                                className={`w-7 h-7 rounded-lg transition-all ${formData.color === color
                                                    ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                                                    : ""
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                                    <p className="text-xs text-zinc-400 mb-2">Preview:</p>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${formData.color}20` }}
                                        >
                                            {(() => {
                                                const Icon = getIconById(formData.icon);
                                                return <Icon className="w-5 h-5" style={{ color: formData.color }} />;
                                            })()}
                                        </div>
                                        <span className="text-white">{formData.name || "Nome da categoria"}</span>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={handleCloseDialog} className="text-zinc-400">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {editingCategory ? "Salvar" : "Criar"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Categorias de Receita */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            Categorias de Receita
                            <Badge variant="secondary" className="ml-2 bg-zinc-800 text-zinc-300">
                                {receitaCats.length}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Categorias para entradas de dinheiro
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-16 rounded-lg bg-zinc-800/50 animate-pulse" />
                                ))}
                            </div>
                        ) : receitaCats.length === 0 ? (
                            <div className="text-center py-8">
                                <Tag className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                                <p className="text-zinc-400 text-sm">Nenhuma categoria de receita</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {receitaCats.map((cat) => {
                                    const Icon = getIconById(cat.icon);
                                    return (
                                        <div
                                            key={cat.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 group hover:bg-zinc-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: `${cat.color}20` }}
                                                >
                                                    <Icon className="w-5 h-5" style={{ color: cat.color }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-white text-sm block truncate">{cat.name}</span>
                                                    {cat.isDefault && (
                                                        <span className="text-xs text-zinc-500">Padrão</span>
                                                    )}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white h-8 w-8 flex-shrink-0"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                                                    <DropdownMenuItem
                                                        className="text-zinc-300 hover:text-white focus:text-white focus:bg-zinc-800"
                                                        onClick={() => openEditDialog(cat)}
                                                    >
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                                                        onClick={() => handleDelete(cat.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Categorias de Despesa */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-red-400" />
                            Categorias de Despesa
                            <Badge variant="secondary" className="ml-2 bg-zinc-800 text-zinc-300">
                                {despesaCats.length}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Categorias para saídas de dinheiro
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-16 rounded-lg bg-zinc-800/50 animate-pulse" />
                                ))}
                            </div>
                        ) : despesaCats.length === 0 ? (
                            <div className="text-center py-8">
                                <Tag className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                                <p className="text-zinc-400 text-sm">Nenhuma categoria de despesa</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {despesaCats.map((cat) => {
                                    const Icon = getIconById(cat.icon);
                                    return (
                                        <div
                                            key={cat.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 group hover:bg-zinc-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: `${cat.color}20` }}
                                                >
                                                    <Icon className="w-5 h-5" style={{ color: cat.color }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-white text-sm block truncate">{cat.name}</span>
                                                    {cat.isDefault && (
                                                        <span className="text-xs text-zinc-500">Padrão</span>
                                                    )}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white h-8 w-8 flex-shrink-0"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                                                    <DropdownMenuItem
                                                        className="text-zinc-300 hover:text-white focus:text-white focus:bg-zinc-800"
                                                        onClick={() => openEditDialog(cat)}
                                                    >
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                                                        onClick={() => handleDelete(cat.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
