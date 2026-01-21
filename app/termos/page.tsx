"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield, FileText, Scale, Users, Lock, CheckCircle } from "lucide-react";

export default function TermosPage() {
    const sections = [
        {
            icon: FileText,
            title: "1. Aceitação dos Termos",
            content: "Ao acessar e utilizar o Tudo Em Dia, você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize nossos serviços."
        },
        {
            icon: Users,
            title: "2. Descrição do Serviço",
            content: "O Tudo Em Dia é uma plataforma de controle financeiro pessoal que permite gerenciar receitas, despesas, metas e visualizar relatórios financeiros. O serviço é oferecido mediante assinatura."
        },
        {
            icon: Lock,
            title: "3. Conta do Usuário",
            content: "Você é responsável por manter a confidencialidade de suas credenciais de acesso. Todas as atividades realizadas em sua conta são de sua responsabilidade. Notifique-nos imediatamente sobre qualquer uso não autorizado."
        },
        {
            icon: Scale,
            title: "4. Uso Aceitável",
            content: "Você concorda em utilizar o serviço apenas para fins legais e de acordo com estes termos. É proibido usar o serviço para atividades ilegais, fraudulentas ou que violem direitos de terceiros."
        },
        {
            icon: Shield,
            title: "5. Pagamento e Assinatura",
            content: "O acesso ao Tudo Em Dia requer uma assinatura ativa. Os pagamentos são processados de forma segura através do Stripe. Você pode cancelar sua assinatura a qualquer momento, mantendo acesso até o fim do período pago."
        },
        {
            icon: CheckCircle,
            title: "6. Limitação de Responsabilidade",
            content: "O Tudo Em Dia é fornecido 'como está'. Não garantimos que o serviço será ininterrupto ou livre de erros. Não somos responsáveis por decisões financeiras tomadas com base nas informações do sistema."
        }
    ];

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative w-48 h-14">
                            <Image
                                src="/logo-new.png"
                                alt="Tudo Em Dia"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-zinc-600 hover:text-emerald-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-6 shadow-lg shadow-emerald-500/30">
                            <FileText className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-4">
                            Termos de Uso
                        </h1>
                        <p className="text-zinc-600 text-lg">
                            Última atualização: Janeiro de 2026
                        </p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-6">
                        {sections.map((section, index) => (
                            <div
                                key={index}
                                className="p-8 rounded-3xl bg-white/60 backdrop-blur-md border border-white/60 shadow-lg shadow-zinc-200/50 hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center shrink-0">
                                        <section.icon className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-800 mb-3">{section.title}</h2>
                                        <p className="text-zinc-600 leading-relaxed">{section.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact */}
                    <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-center">
                        <h3 className="text-xl font-bold mb-2">Dúvidas sobre os Termos?</h3>
                        <p className="text-emerald-100 mb-4">Entre em contato conosco para esclarecimentos.</p>
                        <a
                            href="mailto:contato@tatudoemdia.com.br"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-600 font-bold hover:scale-105 transition-transform"
                        >
                            contato@tatudoemdia.com.br
                        </a>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-zinc-200/60 bg-white/40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto text-center text-zinc-500 text-sm">
                    © 2026 Tudo Em Dia. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
}
