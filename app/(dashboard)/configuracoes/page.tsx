"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/lib/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User,
    Mail,
    Lock,
    Bell,
    Palette,
    Shield,
    Loader2,
    Check,
    Users,
    Trash2,
    Plus,
    AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { Person } from "@/types";
import { getPeople, addPerson, deletePerson } from "@/lib/people";
import { resetUserData, reauthenticate } from "@/lib/settings";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function ConfiguracoesPage() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState(user?.displayName || "");
    const [saving, setSaving] = useState(false);

    // Estado para gestão de pessoas
    const [people, setPeople] = useState<Person[]>([]);
    const [newPersonName, setNewPersonName] = useState("");
    const [loadingPeople, setLoadingPeople] = useState(true);

    const [addingPerson, setAddingPerson] = useState(false);

    // Estado para Reset
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPassword, setResetPassword] = useState("");
    const [resetting, setResetting] = useState(false);

    const handleResetData = async () => {
        if (!resetPassword) {
            toast.error("Digite sua senha para confirmar");
            return;
        }

        setResetting(true);
        try {
            await reauthenticate(resetPassword);
            if (!user?.uid) return;
            await resetUserData(user.uid);
            toast.success("Dados resetados com sucesso!");
            setShowResetModal(false);
            setResetPassword("");
            window.location.reload();
        } catch (error) {
            console.error(error);
            const firebaseError = error as { code?: string; message: string };
            if (firebaseError.code === 'auth/wrong-password') {
                toast.error("Senha incorreta");
            } else {
                toast.error("Erro ao resetar dados: " + firebaseError.message);
            }
        } finally {
            setResetting(false);
        }
    };

    // Carregar pessoas
    const fetchPeople = async () => {
        if (!user?.uid) return;
        try {
            const data = await getPeople(user.uid);
            setPeople(data);
        } catch (error) {
            console.error("Erro ao buscar pessoas:", error);
        } finally {
            setLoadingPeople(false);
        }
    };

    // Carregar ao montar
    useEffect(() => {
        fetchPeople();
    }, [user?.uid]);

    const handleAddPerson = async () => {
        if (!user?.uid || !newPersonName.trim()) return;
        setAddingPerson(true);
        try {
            await addPerson(user.uid, newPersonName.trim());
            setNewPersonName("");
            fetchPeople();
            toast.success("Membro adicionado com sucesso!");
        } catch (error) {
            toast.error("Erro ao adicionar membro");
        } finally {
            setAddingPerson(false);
        }
    };

    const handleDeletePerson = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este membro?")) return;
        try {
            await deletePerson(id);
            fetchPeople();
            toast.success("Membro removido.");
        } catch (error) {
            toast.error("Erro ao remover membro");
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSaveProfile = async () => {
        if (!user?.uid || !name.trim()) return;

        setSaving(true);
        try {
            await updateUserProfile(user.uid, { displayName: name.trim() });
            await refreshUser();
            toast.success("Perfil atualizado com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar perfil");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header title="Configurações" />

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Profile Section */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-400" />
                            Perfil
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Gerencie suas informações pessoais
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="w-24 h-24 border-4 border-emerald-500/30">
                                <AvatarImage src={user?.photoURL || undefined} />
                                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-2xl">
                                    {getInitials(user?.displayName ?? null)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-lg font-medium text-white">{user?.displayName || "Usuário"}</h3>
                                <p className="text-zinc-400">{user?.email}</p>
                                <p className="text-xs text-emerald-400 mt-1">
                                    Plano {user?.subscriptionStatus === "active" ? "Ativo" : "Inativo"}
                                </p>
                            </div>
                        </div>

                        <Separator className="bg-zinc-800" />

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10 bg-zinc-800/50 border-zinc-700 text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        value={user?.email || ""}
                                        disabled
                                        className="pl-10 bg-zinc-800/50 border-zinc-700 text-zinc-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleSaveProfile}
                            disabled={saving || name === user?.displayName}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4 mr-2" />
                            )}
                            Salvar Alterações
                        </Button>
                    </CardContent>
                </Card>

                {/* Family Members Section */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-400" />
                            Membros da Família
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Cadastre pessoas para atribuir compras e filtrar relatórios
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nome do membro (ex: João)"
                                value={newPersonName}
                                onChange={(e) => setNewPersonName(e.target.value)}
                                className="bg-zinc-800/50 border-zinc-700 text-white"
                            />
                            <Button
                                onClick={handleAddPerson}
                                disabled={addingPerson || !newPersonName.trim()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {addingPerson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {loadingPeople ? (
                                <p className="text-sm text-zinc-500">Carregando...</p>
                            ) : people.length === 0 ? (
                                <p className="text-sm text-zinc-500 italic">Nenhum membro cadastrado.</p>
                            ) : (
                                people.map((person) => (
                                    <div key={person.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-bold">
                                                {getInitials(person.name)}
                                            </div>
                                            <span className="text-zinc-200">{person.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeletePerson(person.id)}
                                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Security Section */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            Segurança
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Gerencie sua senha e segurança da conta
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Alterar Senha</p>
                                    <p className="text-sm text-zinc-400">Atualize sua senha periodicamente</p>
                                </div>
                            </div>
                            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                                Alterar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Bell className="w-5 h-5 text-emerald-400" />
                            Notificações
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Configure como você deseja receber alertas
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                            <div>
                                <p className="font-medium text-white">Alertas de Orçamento</p>
                                <p className="text-sm text-zinc-400">Receba alertas quando estiver próximo do limite</p>
                            </div>
                            <Button variant="outline" size="sm" className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/20">
                                Ativado
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                            <div>
                                <p className="font-medium text-white">Lembretes de Metas</p>
                                <p className="text-sm text-zinc-400">Receba lembretes sobre suas metas financeiras</p>
                            </div>
                            <Button variant="outline" size="sm" className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/20">
                                Ativado
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                            <div>
                                <p className="font-medium text-white">Relatórios Semanais</p>
                                <p className="text-sm text-zinc-400">Receba um resumo semanal por email</p>
                            </div>
                            <Button variant="outline" size="sm" className="border-zinc-600 text-zinc-400 hover:bg-zinc-800">
                                Desativado
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Appearance Section */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Palette className="w-5 h-5 text-emerald-400" />
                            Aparência
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Personalize a interface do aplicativo
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
                            <div>
                                <p className="font-medium text-white">Tema</p>
                                <p className="text-sm text-zinc-400">Escolha entre claro e escuro</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="border-zinc-600 text-zinc-400">
                                    Claro
                                </Button>
                                <Button variant="outline" size="sm" className="border-emerald-500 text-emerald-400 bg-emerald-500/10">
                                    Escuro
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Danger Zone */}
                <Card className="bg-red-950/10 border-red-900/50">
                    <CardHeader>
                        <CardTitle className="text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Zona de Perigo
                        </CardTitle>
                        <CardDescription className="text-red-400/60">
                            Ações irreversíveis
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-red-900/30 bg-red-950/20">
                            <div>
                                <h4 className="text-red-200 font-medium">Resetar Dados</h4>
                                <p className="text-sm text-red-400/60">
                                    Apaga todas as transações, contas e configurações.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setShowResetModal(true)}
                                className="bg-red-900 hover:bg-red-800 text-red-100 border border-red-800"
                            >
                                Resetar Tudo
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Confirmar Reset de Dados
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Esta ação é <strong>IRREVERSÍVEL</strong>. Todos os seus dados serão apagados permanentemente.
                            Digite sua senha para confirmar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Sua Senha</Label>
                            <Input
                                type="password"
                                value={resetPassword}
                                onChange={(e) => setResetPassword(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white"
                                placeholder="Digite sua senha..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowResetModal(false)}
                            className="text-zinc-400 hover:text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleResetData}
                            disabled={resetting || !resetPassword}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {resetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirmar e Apagar Tudo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
