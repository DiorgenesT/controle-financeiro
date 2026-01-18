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
  Zap,
  Wallet,
  PiggyBank,
  Coins,
  ArrowUpRight,
  CreditCard,
  CircleDollarSign,
  Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

// Finance-themed SVG Components replaced with Lucide Icons
// Finance-themed SVG Components replaced with Lucide Icons
const FloatingIcon = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`${className} flex items-center justify-center filter drop-shadow-lg`}>
    {children}
  </div>
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

        // Brand text impact animation - Smooth Blur Reveal
        tl.fromTo(
          heroRef.current.querySelector(".brand-text"),
          { opacity: 0, scale: 1.2, filter: "blur(12px)" },
          {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 1.5,
            ease: "power3.out"
          },
          "-=0.6"
        );

        // Scroll Parallax Effect (Wrapper)
        const scrollWrappers = document.querySelectorAll(".scroll-icon-wrapper");
        scrollWrappers.forEach((wrapper, i) => {
          const speed = parseFloat(wrapper.getAttribute("data-speed") || "1");
          gsap.to(wrapper, {
            y: 300 * speed, // Move down significantly on scroll
            ease: "none",
            scrollTrigger: {
              trigger: "body",
              start: "top top",
              end: "bottom bottom",
              scrub: 1
            }
          });
        });

        // Mouse Parallax Effect (Inner Icon)
        const icons = document.querySelectorAll(".floating-icon");

        const handleMouseMove = (e: MouseEvent) => {
          const mouseX = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
          const mouseY = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1

          icons.forEach((icon, index) => {
            const depth = (index + 1) * 15; // Slightly reduced depth for mouse to avoid conflict
            gsap.to(icon, {
              x: mouseX * depth,
              y: mouseY * depth,
              duration: 1,
              ease: "power2.out"
            });
          });
        };

        window.addEventListener("mousemove", handleMouseMove);

        // Continuous Floating Animation (Inner Icon - Bobbing)
        icons.forEach((icon, index) => {
          const randomDuration = 3 + Math.random() * 2;
          const randomY = 10 + Math.random() * 10;

          // We use yPercent here to avoid conflict with the 'y' tween from mouse parallax if possible,
          // but since mouse parallax uses 'y' pixels, we can just mix them if we are careful.
          // Actually, best to use yoyo on the same property might be tricky if mouse overwrites.
          // To be safe, let's animate 'rotation' and 'scale' for bobbing, or use a separate timeline.
          // Or simpler: just let them overwrite? No.
          // Solution: Mouse moves 'x' and 'y'. Bobbing moves 'y'.
          // GSAP can combine them if we use 'y' for one and 'yPercent' for another? No.
          // Let's use 'y' for mouse and 'rotation' for bobbing to be safe, 
          // OR rely on the fact that mouse is user-interaction and bobbing is ambient.
          // Better: Mouse moves X/Y. Bobbing moves Rotation and Scale slightly.

          gsap.to(icon, {
            rotation: Math.random() * 15 - 7.5,
            scale: 1.1,
            duration: randomDuration,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: index * 0.5
          });
        });

        // Cleanup mouse listener on revert
        return () => window.removeEventListener("mousemove", handleMouseMove);
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
              onUpdate: function () {
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 overflow-x-hidden selection:bg-emerald-500/20">
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-400/5 blur-[100px]" />
      </div>

      {/* Finance-themed Floating SVG Decorations - Frosted Glass Style */}
      {/* Finance-themed Floating SVG Decorations - Frosted Glass Style */}
      {/* Finance-themed Floating SVG Decorations - Clean Style */}
      {/* Finance-themed Floating SVG Decorations - Clean Style */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="scroll-icon-wrapper absolute top-[15%] left-[5%]" data-speed="1.2">
          <FloatingIcon className="floating-icon w-24 h-24 opacity-40 text-amber-500">
            <Coins className="w-full h-full drop-shadow-lg" />
          </FloatingIcon>
        </div>

        <div className="scroll-icon-wrapper absolute top-[10%] right-[10%]" data-speed="0.8">
          <FloatingIcon className="floating-icon w-32 h-32 opacity-30 text-emerald-500">
            <TrendingUp className="w-full h-full drop-shadow-lg" />
          </FloatingIcon>
        </div>

        <div className="scroll-icon-wrapper absolute top-[40%] right-[5%]" data-speed="1.3">
          <FloatingIcon className="floating-icon w-24 h-24 opacity-30 text-emerald-600">
            <CircleDollarSign className="w-full h-full drop-shadow-lg" />
          </FloatingIcon>
        </div>

        <div className="scroll-icon-wrapper absolute top-[45%] left-[8%]" data-speed="1.5">
          <FloatingIcon className="floating-icon w-28 h-28 opacity-20 text-blue-500">
            <Wallet className="w-full h-full drop-shadow-lg" />
          </FloatingIcon>
        </div>

        <div className="scroll-icon-wrapper absolute top-[75%] right-[15%]" data-speed="1.1">
          <FloatingIcon className="floating-icon w-24 h-24 opacity-30 text-teal-500">
            <ArrowUpRight className="w-full h-full drop-shadow-lg" />
          </FloatingIcon>
        </div>

        <div className="scroll-icon-wrapper absolute bottom-[15%] left-[12%]" data-speed="0.9">
          <FloatingIcon className="floating-icon w-32 h-32 opacity-20 text-pink-500">
            <PiggyBank className="w-full h-full drop-shadow-lg" />
          </FloatingIcon>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-64 h-20">
              <Image
                src="/logo-new.png"
                alt="Tudo Em Dia"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-zinc-600 hover:text-emerald-600 transition-colors">Recursos</a>
            <a href="#pricing" className="text-zinc-600 hover:text-emerald-600 transition-colors">Preços</a>
            <a href="#testimonials" className="text-zinc-600 hover:text-emerald-600 transition-colors">Depoimentos</a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-zinc-600 hover:text-emerald-600 transition-colors"
            >
              Já sou cliente
            </Link>
            <a
              href="#pricing"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-emerald-500/40"
            >
              Assinar Agora
            </a>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-zinc-600">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                <nav className="flex flex-col gap-6 mt-8">
                  <a href="#features" className="text-lg font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Recursos</a>
                  <a href="#pricing" className="text-lg font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Preços</a>
                  <a href="#testimonials" className="text-lg font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Depoimentos</a>
                  <hr className="border-zinc-200" />
                  <Link
                    href="/login"
                    className="text-lg font-medium text-zinc-600 hover:text-emerald-600 transition-colors"
                  >
                    Já sou cliente
                  </Link>
                  <a
                    href="#pricing"
                    className="w-full text-center px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    Assinar Agora
                  </a>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10" ref={heroRef}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto px-4 md:px-0">
            <div className="hero-animate inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
              <Star className="w-4 h-4" />
              Oferta de Lançamento
            </div>
            <h1 className="text-4xl md:text-7xl font-bold leading-tight tracking-tight">
              <span className="hero-animate inline-block">Mantenha </span>{" "}
              <span className="brand-text inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 animate-gradient-x pb-2">
                Tudo em Dia
              </span>
            </h1>
            <p className="hero-animate mt-6 text-lg md:text-xl text-zinc-600 leading-relaxed">
              Gerencie receitas, despesas e metas em um só lugar.
              Interface moderna, gráficos inteligentes e insights para você
              alcançar a liberdade financeira.
            </p>
            <div className="hero-animate mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <a
                href="#pricing"
                className="cta-glow w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-lg shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 hover:scale-105 hover:-translate-y-1"
              >
                Ver Planos
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 font-semibold text-lg transition-all text-center hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1"
              >
                Conhecer Recursos
              </a>
            </div>
            <div className="hero-animate mt-6 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 text-sm text-zinc-500">
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-500" /> Acesso imediato</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-500" /> Cancele quando quiser</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-500" /> Suporte incluído</span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="hero-animate mt-20 relative perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent to-transparent z-10" />
            <div className="rounded-3xl border border-white/60 bg-white/40 backdrop-blur-md p-4 shadow-2xl shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-700 transform hover:rotate-x-2">
              <div className="rounded-2xl bg-white/80 h-96 flex items-center justify-center border border-white/50 shadow-inner">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                    <BarChart3 className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-zinc-500 font-medium tracking-wide">Preview do Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative z-10" ref={featuresRef}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Tudo que você precisa para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">controlar seu dinheiro</span>
            </h2>
            <p className="mt-4 text-zinc-600 max-w-2xl mx-auto text-lg">
              Ferramentas poderosas e fáceis de usar para você finalmente
              entender e organizar suas finanças pessoais.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card p-8 rounded-3xl bg-white/60 backdrop-blur-lg border border-white/60 shadow-lg shadow-zinc-200/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all group hover:-translate-y-2"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                  <feature.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-zinc-800 group-hover:text-emerald-600 transition-colors">{feature.title}</h3>
                <p className="text-zinc-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative z-10" ref={pricingRef}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Preços{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">simples e acessíveis</span>
            </h2>
            <p className="mt-4 text-zinc-600 max-w-2xl mx-auto text-lg">
              Escolha o plano que melhor se adapta às suas necessidades.
            </p>
          </div>

          <div className="max-w-md mx-auto" style={{ perspective: "1000px" }}>
            {/* Lifetime Plan */}
            <div className="pricing-card p-10 rounded-3xl bg-white/80 backdrop-blur-xl border-2 border-emerald-500/20 relative hover:border-emerald-500/50 transition-all hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2" style={{ transformStyle: "preserve-3d" }}>
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold shadow-lg shadow-emerald-500/30 text-white tracking-wide">
                Oferta Única
              </div>
              <h3 className="text-3xl font-bold text-center">Vitalício</h3>
              <p className="text-6xl font-bold mt-6 text-center">
                R$ <span className="price-value" data-value="67.00">67,00</span>
              </p>
              <p className="text-zinc-500 text-center mt-2 font-medium">Pagamento único. Sem mensalidades.</p>

              <ul className="mt-8 space-y-4">
                {[
                  "Acesso vitalício ao sistema",
                  "Todas as atualizações futuras",
                  "Sem taxas recorrentes",
                  "Transações e metas ilimitadas",
                  "Relatórios avançados",
                  "Suporte prioritário"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-700">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="mt-8 block w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-emerald-500/30 text-center"
              >
                Quero Acesso Vitalício
              </a>
              <p className="text-xs text-zinc-500 text-center mt-3">
                Acesso imediato após a confirmação do pagamento
              </p>
            </div>
          </div>

          {/* Como funciona */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-semibold mb-8">Como funciona?</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-md border border-white/60 shadow-lg shadow-zinc-200/50 hover:bg-white/80 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-6 font-bold text-2xl shadow-lg shadow-emerald-500/30">1</div>
                <p className="text-zinc-600 font-medium">Escolha seu plano e realize a compra</p>
              </div>
              <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-md border border-white/60 shadow-lg shadow-zinc-200/50 hover:bg-white/80 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-6 font-bold text-2xl shadow-lg shadow-emerald-500/30">2</div>
                <p className="text-zinc-600 font-medium">Receba seu login e senha por email</p>
              </div>
              <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-md border border-white/60 shadow-lg shadow-zinc-200/50 hover:bg-white/80 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-6 font-bold text-2xl shadow-lg shadow-emerald-500/30">3</div>
                <p className="text-zinc-600 font-medium">Acesse e comece a organizar suas finanças</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 relative z-10" ref={testimonialsRef}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              O que nossos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">clientes dizem</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="testimonial-card p-8 rounded-3xl bg-white/60 backdrop-blur-md border border-white/60 shadow-lg shadow-zinc-200/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all hover:-translate-y-2"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-600 mb-6 text-lg">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-zinc-500">{testimonial.role}</p>
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
          <p className="cta-animate mt-6 text-xl text-zinc-600">
            Junte-se a milhares de pessoas que já transformaram sua vida financeira.
          </p>
          <a
            href="#pricing"
            className="cta-animate cta-glow mt-10 inline-flex items-center gap-2 px-12 py-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xl shadow-2xl shadow-emerald-500/40 transition-all hover:scale-105 hover:-translate-y-1"
          >
            Assinar Agora
            <ArrowRight className="w-6 h-6" />
          </a>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/60 shadow-sm hover:shadow-md transition-all">
              <h3 className="font-semibold text-zinc-900 text-lg">Como recebo meu acesso?</h3>
              <p className="text-zinc-600 mt-2 leading-relaxed">
                Após a confirmação do pagamento, você receberá um email com seu login (o mesmo email da compra) e uma senha temporária. Você poderá alterar a senha no primeiro acesso.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/60 shadow-sm hover:shadow-md transition-all">
              <h3 className="font-semibold text-zinc-900 text-lg">Posso cancelar a qualquer momento?</h3>
              <p className="text-zinc-600 mt-2 leading-relaxed">
                Sim! Você pode cancelar sua assinatura a qualquer momento. Seu acesso continua válido até o fim do período pago.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/60 shadow-sm hover:shadow-md transition-all">
              <h3 className="font-semibold text-zinc-900 text-lg">Meus dados ficam seguros?</h3>
              <p className="text-zinc-600 mt-2 leading-relaxed">
                Absolutamente! Utilizamos criptografia de ponta e servidores seguros para proteger todas as suas informações financeiras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-200/60 bg-white/40 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-32 h-12">
                <Image
                  src="/logo-new.png"
                  alt="Tudo Em Dia"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-zinc-500 text-sm">
              © 2026 Tudo Em Dia. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="#" className="hover:text-zinc-900 transition-colors">Termos</a>
              <a href="#" className="hover:text-zinc-900 transition-colors">Privacidade</a>
              <a href="#" className="hover:text-zinc-900 transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
