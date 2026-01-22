"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
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
    const { theme, setTheme } = useTheme();
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

    // Estado para configurações de notificação
    const [budgetAlerts, setBudgetAlerts] = useState(user?.settings?.budgetAlerts ?? true);
    const [goalReminders, setGoalReminders] = useState(user?.settings?.goalReminders ?? true);

    useEffect(() => {
        if (user?.settings) {
            setBudgetAlerts(user.settings.budgetAlerts);
            setGoalReminders(user.settings.goalReminders);
        }
    }, [user?.settings]);

    const handleToggleSettings = async (setting: 'budgetAlerts' | 'goalReminders') => {
        if (!user?.uid) return;

        const newValue = setting === 'budgetAlerts' ? !budgetAlerts : !goalReminders;

        // Atualiza estado local imediatamente para feedback visual
        if (setting === 'budgetAlerts') setBudgetAlerts(newValue);
        else setGoalReminders(newValue);

        try {
            await updateUserProfile(user.uid, {
                settings: {
                    budgetAlerts: setting === 'budgetAlerts' ? newValue : budgetAlerts,
                    goalReminders: setting === 'goalReminders' ? newValue : goalReminders
                }
            });
            await refreshUser();
            toast.success("Configuração atualizada!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar configuração");
            // Reverte em caso de erro
            if (setting === 'budgetAlerts') setBudgetAlerts(!newValue);
            else setGoalReminders(!newValue);
        }
    };

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
        <div className="min-h-screen bg-background">
            <Header title="Configurações" />

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Profile Section */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-400" />
                            Perfil
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Gerencie suas informações pessoais
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                                    <AvatarImage src={user?.photoURL || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-2xl font-bold">
                                        {getInitials(user?.displayName ?? null)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-medium text-foreground">
                                    {user?.displayName || "Usuário"}
                                </h3>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                                <p className="text-xs text-emerald-500 font-medium mt-1">
                                    Plano {user?.subscriptionStatus === "active" ? "Ativo" : "Inativo"}
                                </p>
                            </div>
                        </div>

                        <Separator className="bg-border" />

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-muted-foreground">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10 bg-muted/50 border-input text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={user?.email || ""}
                                        disabled
                                        className="pl-10 bg-muted/50 border-input text-muted-foreground"
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
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-500" />
                            Membros da Família
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Gerencie quem tem acesso à conta
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nome do membro (ex: João)"
                                value={newPersonName}
                                onChange={(e) => setNewPersonName(e.target.value)}
                                className="bg-muted/50 border-input text-foreground"
                            />
                            <Button
                                onClick={handleAddPerson}
                                disabled={addingPerson || !newPersonName.trim()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {addingPerson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {loadingPeople ? (
                                <p className="text-sm text-muted-foreground">Carregando...</p>
                            ) : people.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">Nenhum membro cadastrado.</p>
                            ) : (
                                people.map((person) => (
                                    <div
                                        key={person.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50 hover:border-emerald-500/30 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-border">
                                                <AvatarImage src={undefined} />
                                                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-medium">
                                                    {getInitials(person.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-foreground">{person.name}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeletePerson(person.id)}
                                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
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
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            Segurança
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Gerencie sua senha e segurança da conta
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Alterar Senha</p>
                                    <p className="text-sm text-muted-foreground">Atualize sua senha periodicamente</p>
                                </div>
                            </div>
                            <Button variant="outline" className="border-input text-muted-foreground hover:bg-accent hover:text-foreground">
                                Alterar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Bell className="w-5 h-5 text-emerald-400" />
                            Notificações
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Configure como você deseja receber alertas
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div>
                                <p className="font-medium text-foreground">Alertas de Orçamento</p>
                                <p className="text-sm text-muted-foreground">Receba alertas quando estiver próximo do limite</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleSettings('budgetAlerts')}
                                className={budgetAlerts
                                    ? "border-emerald-500 text-emerald-400 hover:bg-emerald-500/20"
                                    : "border-input text-muted-foreground hover:bg-accent hover:text-foreground"
                                }
                            >
                                {budgetAlerts ? "Ativado" : "Desativado"}
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div>
                                <p className="font-medium text-foreground">Lembretes de Metas</p>
                                <p className="text-sm text-muted-foreground">Receba lembretes sobre suas metas financeiras</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleSettings('goalReminders')}
                                className={goalReminders
                                    ? "border-emerald-500 text-emerald-400 hover:bg-emerald-500/20"
                                    : "border-input text-muted-foreground hover:bg-accent hover:text-foreground"
                                }
                            >
                                {goalReminders ? "Ativado" : "Desativado"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Appearance Section */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Palette className="w-5 h-5 text-emerald-400" />
                            Aparência
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Personalize a interface do aplicativo
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div>
                                <p className="font-medium text-foreground">Tema</p>
                                <p className="text-sm text-muted-foreground">Escolha entre claro e escuro</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setTheme("light")}
                                    className={`border-input ${theme === 'light' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                                >
                                    Claro
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setTheme("dark")}
                                    className={`border-input ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                                >
                                    Escuro
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Support Section */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Mail className="w-5 h-5 text-emerald-400" />
                            Suporte
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Precisa de ajuda? Entre em contato
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div>
                                <p className="font-medium text-foreground">Email de Contato</p>
                                <p className="text-sm text-muted-foreground">contato@tatudoemdia.com.br</p>
                            </div>
                            <a href="mailto:contato@tatudoemdia.com.br">
                                <Button variant="outline" className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10">
                                    Enviar Email
                                </Button>
                            </a>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-red-500/10 border-red-500/50">
                    <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Zona de Perigo
                        </CardTitle>
                        <CardDescription className="text-red-600/80 dark:text-red-400/80">
                            Ações irreversíveis
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                            <div>
                                <h4 className="text-red-700 dark:text-red-300 font-medium">Resetar Dados</h4>
                                <p className="text-sm text-red-600/80 dark:text-red-400/80">
                                    Apaga todas as transações, contas e configurações.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setShowResetModal(true)}
                                className="bg-red-600 hover:bg-red-700 text-white border border-red-600 font-medium"
                            >
                                Resetar Tudo
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
                <DialogContent className="bg-popover border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Confirmar Reset de Dados
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
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
                                className="bg-muted/50 border-input text-foreground"
                                placeholder="Digite sua senha..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowResetModal(false)}
                            className="text-muted-foreground hover:text-foreground"
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
