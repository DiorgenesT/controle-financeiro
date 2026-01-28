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
        <div className="min-h-screen bg-background">
            <Header title="Categorias" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                    <div>
                        <p className="text-muted-foreground">
                            Gerencie suas categorias para organizar transações
                        </p>
                    </div>

                    <Button
                        onClick={openNewDialog}
                        className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Categoria
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                        <DialogContent className="bg-background border-border max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">
                                    {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    {editingCategory ? "Altere os dados da categoria" : `Crie uma categoria personalizada (${ICON_LIBRARY.length} ícones disponíveis)`}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Nome</Label>
                                    <Input
                                        placeholder="Ex: Streaming, Academia..."
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-muted/50 border-input text-foreground"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Tipo</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: "receita" })}
                                            className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.type === "receita"
                                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-transparent shadow-md"
                                                : "border-input bg-muted/50 text-muted-foreground hover:bg-muted"
                                                }`}
                                        >
                                            <TrendingUp className={`w-4 h-4 ${formData.type === "receita" ? "text-white" : ""}`} />
                                            Receita
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: "despesa" })}
                                            className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${formData.type === "despesa"
                                                ? "bg-gradient-to-r from-red-500 to-red-600 text-white border-transparent shadow-md"
                                                : "border-input bg-muted/50 text-muted-foreground hover:bg-muted"
                                                }`}
                                        >
                                            <TrendingDown className={`w-4 h-4 ${formData.type === "despesa" ? "text-white" : ""}`} />
                                            Despesa
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Ícone ({filteredIcons.length} disponíveis)</Label>
                                    <Input
                                        placeholder="Buscar ícone..."
                                        value={iconFilter}
                                        onChange={(e) => setIconFilter(e.target.value)}
                                        className="bg-muted/50 border-input text-foreground"
                                    />
                                    <div className="grid grid-cols-8 gap-1.5 h-48 overflow-y-auto p-2 rounded-lg bg-muted/30 border border-input">
                                        {filteredIcons.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, icon: item.id })}
                                                    className={`aspect-square rounded-lg border transition-all flex items-center justify-center ${formData.icon === item.id
                                                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 border-transparent shadow-sm"
                                                        : "border-input bg-muted/50 hover:bg-muted hover:border-accent"
                                                        }`}
                                                    title={item.name}
                                                >
                                                    <Icon className={`w-5 h-5 ${formData.icon === item.id ? "text-white" : "text-muted-foreground"}`} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Cor</Label>
                                    <div className="grid grid-cols-10 gap-1">
                                        {COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color })}
                                                className={`w-7 h-7 rounded-lg transition-all ${formData.color === color
                                                    ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110 shadow-sm"
                                                    : "hover:scale-105"
                                                    }`}
                                                style={{
                                                    background: `linear-gradient(135deg, ${color}, ${color}dd)`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Preview */}
                                <div
                                    className="p-4 rounded-xl border border-transparent shadow-lg transition-all"
                                    style={{
                                        background: `linear-gradient(135deg, ${formData.color}, ${formData.color}dd)`
                                    }}
                                >
                                    <p className="text-xs text-white/80 mb-2 font-medium">Preview:</p>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm shadow-inner"
                                        >
                                            {(() => {
                                                const Icon = getIconById(formData.icon);
                                                return <Icon className="w-6 h-6 text-white" />;
                                            })()}
                                        </div>
                                        <div>
                                            <span className="text-white font-bold text-lg block">{formData.name || "Nome da categoria"}</span>
                                            <span className="text-white/80 text-sm capitalize">{formData.type}</span>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={handleCloseDialog} className="text-muted-foreground">
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
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            Categorias de Receita
                            <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">
                                {receitaCats.length}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Categorias para entradas de dinheiro
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                                ))}
                            </div>
                        ) : receitaCats.length === 0 ? (
                            <div className="text-center py-8">
                                <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">Nenhuma categoria de receita</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {receitaCats.map((cat) => {
                                    const Icon = getIconById(cat.icon);
                                    return (
                                        <div
                                            key={cat.id}
                                            className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-muted/50 group hover:bg-muted transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5 md:gap-3 min-w-0 overflow-hidden">
                                                <div
                                                    className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)`
                                                    }}
                                                >
                                                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                                </div>
                                                <div className="min-w-0 flex-1 overflow-hidden">
                                                    <span className="text-foreground text-xs md:text-sm font-medium block truncate pr-1">{cat.name}</span>
                                                    {cat.isDefault && (
                                                        <span className="text-[10px] md:text-xs text-muted-foreground block truncate">Padrão</span>
                                                    )}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-foreground flex-shrink-0"
                                                    >
                                                        <MoreHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-popover border-border">
                                                    <DropdownMenuItem
                                                        className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent"
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
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-red-400" />
                            Categorias de Despesa
                            <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">
                                {despesaCats.length}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Categorias para saídas de dinheiro
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                                ))}
                            </div>
                        ) : despesaCats.length === 0 ? (
                            <div className="text-center py-8">
                                <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">Nenhuma categoria de despesa</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {despesaCats.map((cat) => {
                                    const Icon = getIconById(cat.icon);
                                    return (
                                        <div
                                            key={cat.id}
                                            className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-muted/50 group hover:bg-muted transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5 md:gap-3 min-w-0 overflow-hidden">
                                                <div
                                                    className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)`
                                                    }}
                                                >
                                                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                                </div>
                                                <div className="min-w-0 flex-1 overflow-hidden">
                                                    <span className="text-foreground text-xs md:text-sm font-medium block truncate pr-1">{cat.name}</span>
                                                    {cat.isDefault && (
                                                        <span className="text-[10px] md:text-xs text-muted-foreground block truncate">Padrão</span>
                                                    )}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-foreground flex-shrink-0"
                                                    >
                                                        <MoreHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-popover border-border">
                                                    <DropdownMenuItem
                                                        className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent"
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
