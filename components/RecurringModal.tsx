"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { RecurringTransaction } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { addRecurringTransaction, updateRecurringTransaction } from "@/lib/recurring";
import { getCategories, Category } from "@/lib/categories";
import { usePeople } from "@/hooks/usePeople";
import { getIconById } from "@/lib/icons";
import { toast } from "sonner";

interface RecurringModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: RecurringTransaction | null;
    onSuccess?: () => void;
}

export function RecurringModal({ open, onOpenChange, initialData, onSuccess }: RecurringModalProps) {
    const { user } = useAuth();
    const { people } = usePeople();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        type: "despesa" as "receita" | "despesa",
        category: "",
        day: "5",
        personId: "family", // "family" or personId
    });

    useEffect(() => {
        if (open) {
            loadCategories();
            if (initialData) {
                setFormData({
                    description: initialData.description,
                    amount: initialData.amount.toString(),
                    type: initialData.type,
                    category: initialData.category,
                    day: initialData.day.toString(),
                    personId: initialData.personId || "family",
                });
            } else {
                setFormData({
                    description: "",
                    amount: "",
                    type: "despesa",
                    category: "",
                    day: "5",
                    personId: "family",
                });
            }
        }
    }, [open, initialData]);

    const loadCategories = async () => {
        if (!user?.uid) return;
        const cats = await getCategories(user.uid);
        setCategories(cats);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return;

        setLoading(true);
        try {
            const data = {
                description: formData.description,
                amount: parseFloat(formData.amount),
                type: formData.type,
                category: formData.category || (formData.type === "receita" ? "Salário" : "Outros"),
                day: parseInt(formData.day),
                personId: formData.personId === "family" ? null : formData.personId,
                active: true,
            };

            if (initialData) {
                await updateRecurringTransaction(initialData.id, data);
                toast.success("Fixa atualizada!");
            } else {
                await addRecurringTransaction(user.uid, data);
                toast.success("Fixa criada!");
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar");
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(c => c.type === formData.type);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Fixa" : "Nova Transação Fixa"}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Configure uma receita ou despesa que se repete todo mês.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v: "receita" | "despesa") => setFormData({ ...formData, type: v, category: "" })}
                            >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    <SelectItem value="receita">Receita</SelectItem>
                                    <SelectItem value="despesa">Despesa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Dia do Mês</Label>
                            <Input
                                type="number"
                                min="1"
                                max="31"
                                value={formData.day}
                                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ex: Aluguel, Salário"
                            className="bg-zinc-800 border-zinc-700"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="bg-zinc-800 border-zinc-700"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(v) => setFormData({ ...formData, category: v })}
                            >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
                                    {filteredCategories.map((cat) => {
                                        const Icon = getIconById(cat.icon);
                                        return (
                                            <SelectItem key={cat.id} value={cat.name}>
                                                <span className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4" style={{ color: cat.color }} />
                                                    <span>{cat.name}</span>
                                                </span>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Atribuir a</Label>
                        <Select
                            value={formData.personId}
                            onValueChange={(v) => setFormData({ ...formData, personId: v })}
                        >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="family">Família</SelectItem>
                                {people.map((person) => (
                                    <SelectItem key={person.id} value={person.id}>
                                        {person.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar Fixa
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
