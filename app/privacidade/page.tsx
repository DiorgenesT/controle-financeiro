"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield, Eye, Database, Share2, UserCheck, Mail } from "lucide-react";

export default function PrivacidadePage() {
    const sections = [
        {
            icon: Database,
            title: "1. Dados Coletados",
            content: "Coletamos apenas os dados necessários para o funcionamento do serviço: email, dados financeiros inseridos por você (receitas, despesas, metas) e informações de uso. Não coletamos dados sensíveis além do estritamente necessário."
        },
        {
            icon: Shield,
            title: "2. Proteção dos Dados",
            content: "Seus dados são protegidos com criptografia de ponta a ponta. Utilizamos servidores seguros e práticas de segurança atualizadas. Seus dados financeiros são armazenados de forma segura no Firebase."
        },
        {
            icon: Eye,
            title: "3. Uso dos Dados",
            content: "Seus dados são utilizados exclusivamente para fornecer e melhorar o serviço. Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing."
        },
        {
            icon: Share2,
            title: "4. Compartilhamento",
            content: "Compartilhamos dados apenas com: provedores de serviço essenciais (Firebase, Stripe para pagamentos), quando exigido por lei, ou com seu consentimento explícito."
        },
        {
            icon: UserCheck,
            title: "5. Seus Direitos",
            content: "Você tem direito a: acessar seus dados, corrigir informações incorretas, solicitar exclusão de seus dados, e exportar seus dados. Entre em contato para exercer qualquer desses direitos."
        },
        {
            icon: Mail,
            title: "6. Cookies e Rastreamento",
            content: "Utilizamos cookies essenciais para o funcionamento do sistema e para manter sua sessão ativa. Não utilizamos cookies de rastreamento ou publicidade de terceiros."
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
                            <Shield className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-4">
                            Política de Privacidade
                        </h1>
                        <p className="text-zinc-600 text-lg">
                            Última atualização: Janeiro de 2026
                        </p>
                    </div>

                    {/* Intro */}
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 mb-8">
                        <p className="text-zinc-700 leading-relaxed text-lg">
                            No Tudo Em Dia, levamos sua privacidade a sério. Esta política explica como coletamos,
                            usamos e protegemos suas informações pessoais e financeiras.
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
                        <h3 className="text-xl font-bold mb-2">Dúvidas sobre Privacidade?</h3>
                        <p className="text-emerald-100 mb-4">Nosso time de suporte está pronto para ajudar.</p>
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
