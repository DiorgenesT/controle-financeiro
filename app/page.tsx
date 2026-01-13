"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  TrendingUp,
  Target,
  BarChart3,
  Shield,
  Smartphone,
  Check,
  ArrowRight,
  Star,
  Zap
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Finance-themed SVG Components
const CoinSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="45" fill="url(#coinGrad)" stroke="#fbbf24" strokeWidth="3"/>
    <text x="50" y="62" textAnchor="middle" fill="#fbbf24" fontSize="36" fontWeight="bold">$</text>
    <defs>
      <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
  </svg>
);

const ChartSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 80" fill="none">
    <path d="M10 70 L30 45 L50 55 L70 25 L90 35 L110 10" stroke="url(#chartGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="110" cy="10" r="6" fill="#10b981"/>
    <defs>
      <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
  </svg>
);

const WalletSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 80" fill="none">
    <rect x="5" y="15" width="80" height="55" rx="8" fill="url(#walletGrad)" />
    <rect x="60" y="35" width="35" height="20" rx="4" fill="#059669" />
    <circle cx="75" cy="45" r="5" fill="#34d399" />
    <defs>
      <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
  </svg>
);

const ArrowUpSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 60 100" fill="none">
    <path d="M30 90 L30 20" stroke="url(#arrowGrad)" strokeWidth="6" strokeLinecap="round"/>
    <path d="M10 40 L30 15 L50 40" stroke="url(#arrowGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
  </svg>
);

const PiggyBankSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 100" fill="none">
    <ellipse cx="60" cy="55" rx="45" ry="35" fill="url(#piggyGrad)" />
    <rect x="45" y="20" width="20" height="8" rx="2" fill="#f472b6" />
    <circle cx="80" cy="45" r="4" fill="#1f2937" />
    <ellipse cx="95" cy="55" rx="8" ry="5" fill="#ec4899" />
    <ellipse cx="40" cy="80" rx="8" ry="10" fill="#db2777" />
    <ellipse cx="80" cy="80" rx="8" ry="10" fill="#db2777" />
    <defs>
      <linearGradient id="piggyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f9a8d4" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: TrendingUp,
      title: "Controle Total",
      description: "Registre receitas e despesas de forma simples e organize suas finanças."
    },
    {
      icon: Target,
      title: "Metas Inteligentes",
      description: "Defina objetivos financeiros e acompanhe seu progresso em tempo real."
    },
    {
      icon: BarChart3,
      title: "Relatórios Visuais",
      description: "Visualize seus dados com gráficos interativos e insights valiosos."
    },
    {
      icon: Shield,
      title: "Seguro e Privado",
      description: "Seus dados protegidos com criptografia de ponta."
    },
    {
      icon: Smartphone,
      title: "100% Responsivo",
      description: "Acesse de qualquer dispositivo, quando e onde precisar."
    },
    {
      icon: Zap,
      title: "Acesso Instantâneo",
      description: "Após a compra, receba suas credenciais imediatamente por email."
    },
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Empreendedora",
      content: "Finalmente consegui organizar minhas finanças! O app é intuitivo e bonito.",
      avatar: "MS"
    },
    {
      name: "João Santos",
      role: "Desenvolvedor",
      content: "Os relatórios são incríveis. Consigo ver exatamente para onde vai meu dinheiro.",
      avatar: "JS"
    },
    {
      name: "Ana Costa",
      role: "Designer",
      content: "As metas me ajudaram muito a economizar para minha viagem. Recomendo!",
      avatar: "AC"
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations - More impactful
      if (heroRef.current) {
        const tl = gsap.timeline();
        
        // Staggered entrance with scale and rotation
        tl.fromTo(
          heroRef.current.querySelectorAll(".hero-animate"),
          { opacity: 0, y: 80, scale: 0.9 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            duration: 1, 
            stagger: 0.2, 
            ease: "power4.out" 
          }
        );

        // Floating finance SVGs with complex animations
        gsap.to(".finance-svg-1", {
          y: -30,
          rotation: 15,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        gsap.to(".finance-svg-2", {
          y: 25,
          x: -20,
          rotation: -10,
          duration: 5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        gsap.to(".finance-svg-3", {
          y: -20,
          x: 15,
          rotation: 8,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        gsap.to(".finance-svg-4", {
          y: 20,
          rotation: -12,
          duration: 4.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        gsap.to(".finance-svg-5", {
          y: -25,
          x: -10,
          rotation: 5,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        
        // Pulsing glow effect on main CTA
        gsap.to(".cta-glow", {
          boxShadow: "0 0 40px rgba(16, 185, 129, 0.6)",
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }

      // Features scroll animation - Cascade effect
      if (featuresRef.current) {
        const cards = featuresRef.current.querySelectorAll(".feature-card");
        
        gsap.fromTo(
          cards,
          { 
            opacity: 0, 
            y: 100, 
            scale: 0.8,
            rotationY: 15
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationY: 0,
            duration: 0.8,
            stagger: {
              each: 0.15,
              from: "start"
            },
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: featuresRef.current,
              start: "top 85%",
              toggleActions: "play none none none"
            }
          }
        );
      }

      // Pricing scroll animation - Dramatic entrance
      if (pricingRef.current) {
        const pricingCards = pricingRef.current.querySelectorAll(".pricing-card");
        
        gsap.fromTo(
          pricingCards,
          { 
            opacity: 0, 
            y: 80, 
            scale: 0.7,
            rotationX: -20
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 1,
            stagger: 0.3,
            ease: "elastic.out(1, 0.8)",
            scrollTrigger: {
              trigger: pricingRef.current,
              start: "top 80%",
              toggleActions: "play none none none"
            }
          }
        );

        // Price number counter animation
        const priceElements = pricingRef.current.querySelectorAll(".price-value");
        priceElements.forEach((el) => {
          const finalValue = parseFloat(el.getAttribute("data-value") || "0");
          gsap.fromTo(
            el,
            { textContent: "0" },
            {
              textContent: finalValue,
              duration: 2,
              ease: "power2.out",
              snap: { textContent: 0.01 },
              scrollTrigger: {
                trigger: pricingRef.current,
                start: "top 80%",
                toggleActions: "play none none none"
              },
              onUpdate: function() {
                const val = parseFloat(String(gsap.getProperty(el, "textContent")));
                el.textContent = val.toFixed(2).replace(".", ",");
              }
            }
          );
        });
      }

      // Testimonials scroll animation - Slide in from sides
      if (testimonialsRef.current) {
        const testimonialCards = testimonialsRef.current.querySelectorAll(".testimonial-card");
        
        testimonialCards.forEach((card, index) => {
          const direction = index % 2 === 0 ? -100 : 100;
          gsap.fromTo(
            card,
            { 
              opacity: 0, 
              x: direction,
              scale: 0.9
            },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              duration: 0.8,
              delay: index * 0.2,
              ease: "power3.out",
              scrollTrigger: {
                trigger: testimonialsRef.current,
                start: "top 80%",
                toggleActions: "play none none none"
              }
            }
          );
        });
      }

      // CTA Section animation
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current.querySelectorAll(".cta-animate"),
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 85%",
              toggleActions: "play none none none"
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {/* Finance-themed Floating SVG Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="finance-svg-1 absolute top-24 left-[5%] w-20 h-20 opacity-30">
          <CoinSVG />
        </div>
        <div className="finance-svg-2 absolute top-[20%] right-[8%] w-28 h-20 opacity-25">
          <ChartSVG />
        </div>
        <div className="finance-svg-3 absolute top-[45%] left-[3%] w-24 h-20 opacity-20">
          <WalletSVG />
        </div>
        <div className="finance-svg-4 absolute top-[60%] right-[5%] w-16 h-28 opacity-25">
          <ArrowUpSVG />
        </div>
        <div className="finance-svg-5 absolute bottom-[25%] left-[10%] w-28 h-24 opacity-20">
          <PiggyBankSVG />
        </div>
        {/* Additional coins scattered */}
        <div className="finance-svg-1 absolute top-[35%] right-[15%] w-12 h-12 opacity-15">
          <CoinSVG />
        </div>
        <div className="finance-svg-3 absolute bottom-[40%] right-[20%] w-10 h-10 opacity-10">
          <CoinSVG />
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-48 h-16">
              <Image
                src="/logo.png"
                alt="Tudo Em Dia"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-zinc-400 hover:text-white transition-colors">Recursos</a>
            <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors">Preços</a>
            <a href="#testimonials" className="text-zinc-400 hover:text-white transition-colors">Depoimentos</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Já sou cliente
            </Link>
            <a
              href="#pricing"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
            >
              Assinar Agora
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10" ref={heroRef}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="hero-animate inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
              <Star className="w-4 h-4" />
              Oferta de Lançamento
            </div>
            <h1 className="hero-animate text-5xl md:text-7xl font-bold leading-tight">
              Mantenha tudo{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 animate-pulse">
                em dia
              </span>
            </h1>
            <p className="hero-animate mt-6 text-xl text-zinc-400 leading-relaxed">
              Gerencie receitas, despesas e metas em um só lugar.
              Interface moderna, gráficos inteligentes e insights para você
              alcançar a liberdade financeira.
            </p>
            <div className="hero-animate mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#pricing"
                className="cta-glow w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-lg shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 hover:scale-110"
              >
                Ver Planos
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-white font-semibold text-lg transition-all text-center hover:border-emerald-500/50 hover:scale-105"
              >
                Conhecer Recursos
              </a>
            </div>
            <p className="hero-animate mt-4 text-sm text-zinc-500">
              ✓ Acesso imediato &nbsp;&nbsp; ✓ Cancele quando quiser &nbsp;&nbsp; ✓ Suporte incluído
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="hero-animate mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-2xl hover:border-emerald-500/30 transition-all duration-500">
              <div className="rounded-xl bg-zinc-950 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                    <BarChart3 className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-zinc-400">Preview do Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-zinc-900/50 relative z-10" ref={featuresRef}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Tudo que você precisa para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">controlar seu dinheiro</span>
            </h2>
            <p className="mt-4 text-zinc-400 max-w-2xl mx-auto text-lg">
              Ferramentas poderosas e fáceis de usar para você finalmente
              entender e organizar suas finanças pessoais.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 hover:border-emerald-500/50 transition-all group hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/10"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 relative z-10" ref={pricingRef}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Preços{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">simples e acessíveis</span>
            </h2>
            <p className="mt-4 text-zinc-400 max-w-2xl mx-auto text-lg">
              Escolha o plano que melhor se adapta às suas necessidades.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto" style={{ perspective: "1000px" }}>
            {/* Monthly Plan */}
            <div className="pricing-card p-8 rounded-2xl bg-gradient-to-b from-emerald-900/50 to-zinc-900/50 border-2 border-emerald-500/50 relative hover:border-emerald-400 transition-all hover:shadow-2xl hover:shadow-emerald-500/20" style={{ transformStyle: "preserve-3d" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-sm font-bold shadow-lg shadow-emerald-500/50">
                Mais Popular
              </div>
              <h3 className="text-2xl font-bold">Mensal</h3>
              <p className="text-5xl font-bold mt-4">
                R$ <span className="price-value" data-value="9.90">9,90</span><span className="text-lg text-zinc-400 font-normal">/mês</span>
              </p>
              <ul className="mt-8 space-y-4">
                {["Transações ilimitadas", "Metas ilimitadas", "Relatórios avançados", "Exportar PDF/Excel", "Categorias personalizadas", "Suporte prioritário"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-300">
                    <Check className="w-5 h-5 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="mt-8 block w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-center font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-emerald-500/30"
              >
                Assinar Agora
              </a>
              <p className="text-xs text-zinc-500 text-center mt-3">
                Credenciais enviadas por email após a compra
              </p>
            </div>

            {/* Annual Plan */}
            <div className="pricing-card p-8 rounded-2xl bg-zinc-800/50 border-2 border-zinc-600 relative hover:border-amber-500/50 transition-all hover:shadow-2xl hover:shadow-amber-500/10" style={{ transformStyle: "preserve-3d" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-bold text-black shadow-lg">
                Economia de 33%
              </div>
              <h3 className="text-2xl font-bold">Anual</h3>
              <p className="text-5xl font-bold mt-4">
                R$ <span className="price-value" data-value="79.90">79,90</span><span className="text-lg text-zinc-400 font-normal">/ano</span>
              </p>
              <p className="text-emerald-400 text-sm mt-1 font-medium">Equivale a R$ 6,66/mês (4 meses grátis)</p>
              <ul className="mt-8 space-y-4">
                {["Tudo do plano Mensal", "Preço garantido por 1 ano", "4 meses grátis", "Acesso antecipado a novidades"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-300">
                    <Check className="w-5 h-5 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="mt-8 block w-full py-4 rounded-xl border-2 border-zinc-500 hover:bg-zinc-700 hover:border-amber-500/50 text-center font-bold text-lg transition-all hover:scale-105"
              >
                Assinar Anual
              </a>
              <p className="text-xs text-zinc-500 text-center mt-3">
                Credenciais enviadas por email após a compra
              </p>
            </div>
          </div>

          {/* Como funciona */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-semibold mb-8">Como funciona?</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="p-6 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-lg shadow-emerald-500/30">1</div>
                <p className="text-zinc-300">Escolha seu plano e realize a compra</p>
              </div>
              <div className="p-6 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-lg shadow-emerald-500/30">2</div>
                <p className="text-zinc-300">Receba seu login e senha por email</p>
              </div>
              <div className="p-6 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-lg shadow-emerald-500/30">3</div>
                <p className="text-zinc-300">Acesse e comece a organizar suas finanças</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-zinc-900/50 relative z-10" ref={testimonialsRef}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              O que nossos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">clientes dizem</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="testimonial-card p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 hover:border-emerald-500/30 transition-all hover:scale-105"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-300 mb-6 text-lg">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-zinc-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative z-10" ref={ctaRef}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="cta-animate text-4xl md:text-5xl font-bold">
            Pronto para manter tudo em dia?
          </h2>
          <p className="cta-animate mt-6 text-xl text-zinc-400">
            Junte-se a milhares de pessoas que já transformaram sua vida financeira.
          </p>
          <a
            href="#pricing"
            className="cta-animate cta-glow mt-10 inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xl shadow-xl shadow-emerald-500/30 transition-all hover:scale-110"
          >
            Assinar Agora
            <ArrowRight className="w-6 h-6" />
          </a>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-zinc-900/50 relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-emerald-500/30 transition-all">
              <h3 className="font-semibold text-white text-lg">Como recebo meu acesso?</h3>
              <p className="text-zinc-400 mt-2">
                Após a confirmação do pagamento, você receberá um email com seu login (o mesmo email da compra) e uma senha temporária. Você poderá alterar a senha no primeiro acesso.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-emerald-500/30 transition-all">
              <h3 className="font-semibold text-white text-lg">Posso cancelar a qualquer momento?</h3>
              <p className="text-zinc-400 mt-2">
                Sim! Você pode cancelar sua assinatura a qualquer momento. Seu acesso continua válido até o fim do período pago.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-emerald-500/30 transition-all">
              <h3 className="font-semibold text-white text-lg">Meus dados ficam seguros?</h3>
              <p className="text-zinc-400 mt-2">
                Absolutamente! Utilizamos criptografia de ponta e servidores seguros para proteger todas as suas informações financeiras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-32 h-12">
                <Image
                  src="/logo.png"
                  alt="Tudo Em Dia"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-zinc-400 text-sm">
              © 2026 Tudo Em Dia. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
