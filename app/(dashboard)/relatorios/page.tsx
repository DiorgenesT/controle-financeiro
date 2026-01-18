"use client";

import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Calendar,
    Download,
    PieChart,
    Users
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { useTransactions } from "@/hooks/useTransactions";
import { usePeople } from "@/hooks/usePeople";
import { startOfMonth, endOfMonth, subMonths, addMonths, format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "next-themes";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const COLORS = [
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; payload?: { fill?: string;[key: string]: unknown } }>; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
                <p className="text-muted-foreground text-sm mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color || (entry.payload && entry.payload.fill) || "#fff" }}>
                        {entry.name}: {formatCurrency(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function RelatoriosPage() {
    const { transactions, loading: loadingTransactions } = useTransactions();
    const { people } = usePeople();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const gridColor = isDark ? '#27272a' : '#e5e7eb';
    const axisColor = isDark ? '#71717a' : '#6b7280';
    const [activeTab, setActiveTab] = useState("visao-geral");

    // Processamento de dados
    const today = new Date();
    // Próximos 7 meses (incluindo o atual)
    const nextMonths = Array.from({ length: 7 }, (_, i) => addMonths(today, i));

    // 1. Dados Mensais (Barras) - Próximos 7 meses
    const monthlyData = nextMonths.map(date => {
        const monthTransactions = transactions.filter(t =>
            isSameMonth(t.date, date) &&
            t.date.getFullYear() === date.getFullYear()
        );

        const receitas = monthTransactions
            .filter(t => t.type === "receita" && t.category !== "Transferência")
            .reduce((acc, t) => acc + t.amount, 0);

        const despesas = monthTransactions
            .filter(t => t.type === "despesa" && t.category !== "Transferência")
            .reduce((acc, t) => acc + t.amount, 0);

        return {
            name: format(date, "MMM", { locale: ptBR }),
            fullName: format(date, "MMMM yyyy", { locale: ptBR }),
            receitas,
            despesas,
            saldo: receitas - despesas
        };
    });

    // 2. Dados do Mês Atual (para os Cards e Gráficos de Pizza)
    // O primeiro item do array é o mês atual
    const currentMonthData = monthlyData[0];
    const totalReceitas = currentMonthData.receitas;
    const totalDespesas = currentMonthData.despesas;
    const economia = totalReceitas - totalDespesas;
    const taxaEconomia = totalReceitas > 0 ? ((economia / totalReceitas) * 100).toFixed(1) : "0.0";

    const currentMonthTransactions = transactions.filter(t =>
        isSameMonth(t.date, today) &&
        t.date.getFullYear() === today.getFullYear() &&
        t.type === "despesa" &&
        t.category !== "Transferência"
    );

    // 3. Por Categoria (Mês Atual)
    const categoryMap = new Map<string, number>();
    currentMonthTransactions.forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
    });

    const categoryData = Array.from(categoryMap.entries())
        .map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value);

    // 4. Por Usuário (Mês Atual)
    const userMap = new Map<string, number>();
    currentMonthTransactions.forEach(t => {
        const personId = t.personId || "family";
        const current = userMap.get(personId) || 0;
        userMap.set(personId, current + t.amount);
    });

    const userData = Array.from(userMap.entries())
        .map(([id, value], index) => {
            const person = people.find(p => p.id === id);
            const name = id === "family" ? "Família" : (person?.name || "Desconhecido");
            return {
                name,
                value,
                color: COLORS[index % COLORS.length]
            };
        })
        .sort((a, b) => b.value - a.value);

    // 5. Evolução (Acumulado dos próximos 7 meses)
    // Assumindo saldo inicial 0 para o gráfico de evolução, mostrando apenas o acumulado do período
    let accumulated = 0;
    // Mostrar apenas o mês atual para evolução (sem projeção)
    const evolutionData = monthlyData.slice(0, 1).map(d => {
        accumulated += d.saldo;
        return { name: d.name, saldo: accumulated };
    });

    if (loadingTransactions) {
        return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Carregando relatórios...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header title="Relatórios" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-muted-foreground">
                            Visualize seus dados financeiros de forma clara e objetiva
                        </p>
                    </div>
                    {/* <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar PDF
                    </Button> */}
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-gradient-to-br from-green-500 to-green-700 border-none text-white shadow-lg shadow-green-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-white/80">Receitas ({currentMonthData.name})</p>
                                    <p className="text-2xl font-bold text-white">{formatCurrency(totalReceitas)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500 to-red-700 border-none text-white shadow-lg shadow-red-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-white/80">Despesas ({currentMonthData.name})</p>
                                    <p className="text-2xl font-bold text-white">{formatCurrency(totalDespesas)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-none text-white shadow-lg shadow-emerald-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-white/80">Taxa de Economia</p>
                                    <p className="text-2xl font-bold text-white">{taxaEconomia}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    {/* Mobile Tab Selector */}
                    <div className="md:hidden w-full">
                        <Select value={activeTab} onValueChange={setActiveTab}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione a visualização" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="visao-geral">Visão Geral</SelectItem>
                                <SelectItem value="categorias">Por Categoria</SelectItem>
                                <SelectItem value="usuarios">Por Usuário</SelectItem>
                                <SelectItem value="evolucao">Evolução Patrimonial</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Desktop Tab List */}
                    <TabsList className="hidden md:flex bg-muted/50 border border-input p-1 h-auto">
                        <TabsTrigger
                            value="visao-geral"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                        >
                            Visão Geral
                        </TabsTrigger>
                        <TabsTrigger
                            value="categorias"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                        >
                            Por Categoria
                        </TabsTrigger>
                        <TabsTrigger
                            value="usuarios"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                        >
                            Por Usuário
                        </TabsTrigger>
                        <TabsTrigger
                            value="evolucao"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                        >
                            Evolução Patrimonial
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="visao-geral" className="space-y-4">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-emerald-400" />
                                    Receitas vs Despesas
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Previsão para os próximos 7 meses
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                            <XAxis dataKey="name" stroke={axisColor} />
                                            <YAxis
                                                stroke={axisColor}
                                                tickFormatter={(value) => {
                                                    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
                                                    return `R$ ${value}`;
                                                }}
                                                width={80}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                            <Legend />
                                            <Bar dataKey="receitas" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="categorias" className="space-y-4">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-emerald-400" />
                                    Despesas por Categoria
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Distribuição das suas despesas em {currentMonthData.fullName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                labelLine={{ stroke: "#71717a" }}
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                                    {categoryData.map((cat) => (
                                        <div key={cat.name} className="flex items-center gap-2 text-sm">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                            <span className="text-muted-foreground">{cat.name}:</span>
                                            <span className="text-foreground">{formatCurrency(cat.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="usuarios" className="space-y-4">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-400" />
                                    Despesas por Usuário
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Quem gastou mais em {currentMonthData.fullName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={userData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                labelLine={{ stroke: "#71717a" }}
                                            >
                                                {userData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                                    {userData.map((user) => (
                                        <div key={user.name} className="flex items-center gap-2 text-sm">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
                                            <span className="text-muted-foreground">{user.name}:</span>
                                            <span className="text-foreground">{formatCurrency(user.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="evolucao" className="space-y-4">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    Evolução do Patrimônio
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Evolução acumulada (Mês Atual)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={evolutionData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                            <XAxis dataKey="name" stroke={axisColor} />
                                            <YAxis
                                                stroke={axisColor}
                                                tickFormatter={(value) => {
                                                    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
                                                    return `R$ ${value}`;
                                                }}
                                                width={80}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line
                                                type="monotone"
                                                dataKey="saldo"
                                                name="Saldo Acumulado"
                                                stroke="#10B981"
                                                strokeWidth={3}
                                                dot={{ fill: "#10B981", strokeWidth: 2 }}
                                                activeDot={{ r: 8, fill: "#10B981" }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div >
        </div >
    );
}
