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

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; payload?: any }>; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl">
                <p className="text-zinc-400 text-sm mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color || entry.payload.fill || "#fff" }}>
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
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Carregando relatórios...</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header title="Relatórios" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-zinc-400">
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
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Receitas ({currentMonthData.name})</p>
                                    <p className="text-2xl font-bold text-green-400">{formatCurrency(totalReceitas)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Despesas ({currentMonthData.name})</p>
                                    <p className="text-2xl font-bold text-red-400">{formatCurrency(totalDespesas)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-400">Taxa de Economia</p>
                                    <p className="text-2xl font-bold text-emerald-400">{taxaEconomia}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <Tabs defaultValue="visao-geral" className="space-y-4">
                    <TabsList className="bg-zinc-800/50 border border-zinc-700">
                        <TabsTrigger value="visao-geral" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                            Visão Geral
                        </TabsTrigger>
                        <TabsTrigger value="categorias" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                            Por Categoria
                        </TabsTrigger>
                        <TabsTrigger value="usuarios" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                            Por Usuário
                        </TabsTrigger>
                        <TabsTrigger value="evolucao" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                            Evolução Patrimonial
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="visao-geral" className="space-y-4">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-emerald-400" />
                                    Receitas vs Despesas
                                </CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Previsão para os próximos 7 meses
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                            <XAxis dataKey="name" stroke="#71717a" />
                                            <YAxis stroke="#71717a" tickFormatter={(value) => `R$${value / 1000}k`} />
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
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-emerald-400" />
                                    Despesas por Categoria
                                </CardTitle>
                                <CardDescription className="text-zinc-400">
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
                                            <span className="text-zinc-400">{cat.name}:</span>
                                            <span className="text-white">{formatCurrency(cat.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="usuarios" className="space-y-4">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-400" />
                                    Despesas por Usuário
                                </CardTitle>
                                <CardDescription className="text-zinc-400">
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
                                            <span className="text-zinc-400">{user.name}:</span>
                                            <span className="text-white">{formatCurrency(user.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="evolucao" className="space-y-4">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    Evolução do Patrimônio
                                </CardTitle>
                                <CardDescription className="text-zinc-400">
                                    Evolução acumulada (Mês Atual)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={evolutionData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                            <XAxis dataKey="name" stroke="#71717a" />
                                            <YAxis stroke="#71717a" tickFormatter={(value) => `R$${value / 1000}k`} />
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
            </div>
        </div>
    );
}
