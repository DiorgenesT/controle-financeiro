"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
  Menu,
  Sparkles,
  MessageSquare,
  LogIn,
  CheckCircle
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

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    if (!email || !name || !cellphone || !taxId) {
      alert("Por favor, preencha todos os campos para continuar.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, cellphone, taxId }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Erro: ${data.details || data.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setCheckoutLoading(false);
    }
  };





  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const dashboardImages = [
    { src: "/dashboard-light.jpg", alt: "Dashboard Light Mode", label: "Tema Claro" },
    { src: "/dashboard-dark.jpg", alt: "Dashboard Dark Mode", label: "Tema Escuro" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % dashboardImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
            <a href="#features" className="text-zinc-600 hover:text-emerald-600 transition-colors cursor-pointer">Recursos</a>
            <a href="#pricing" className="text-zinc-600 hover:text-emerald-600 transition-colors cursor-pointer">Preços</a>
            <a href="#testimonials" className="text-zinc-600 hover:text-emerald-600 transition-colors cursor-pointer">Depoimentos</a>
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
              <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 border-l border-emerald-500/20">
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>

                <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl">
                  {/* Header with Logo */}
                  <div className="p-6 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-500/10 p-2 rounded-lg">
                        <CircleDollarSign className="h-6 w-6 text-emerald-500" />
                      </div>
                      <span className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                        Tudo Em Dia
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex-1 flex flex-col gap-2 p-6 overflow-y-auto">
                    <a
                      href="#features"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all group"
                    >
                      <Sparkles className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                      <span className="font-medium">Recursos</span>
                    </a>

                    <a
                      href="#pricing"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all group"
                    >
                      <CreditCard className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                      <span className="font-medium">Preços</span>
                    </a>

                    <a
                      href="#testimonials"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all group"
                    >
                      <MessageSquare className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                      <span className="font-medium">Depoimentos</span>
                    </a>
                  </nav>

                  {/* Footer Actions */}
                  <div className="p-6 border-t border-border/50 space-y-4 bg-muted/30">
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted/50 text-zinc-600 font-medium transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      Já sou cliente
                    </Link>

                    <a
                      href="#pricing"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Assinar Agora
                    </a>
                  </div>
                </div>
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
          <div className="hero-animate mt-20 relative perspective-1000 max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent to-transparent z-10" />

            <div className="relative rounded-3xl border border-white/60 bg-white/40 backdrop-blur-md p-2 md:p-4 shadow-2xl shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-700 transform hover:-translate-y-2">
              {/* Spacer Image to define container height */}
              <Image
                src="/dashboard-light.jpg"
                alt="Spacer"
                width={1200}
                height={675}
                className="w-full h-auto opacity-0 pointer-events-none"
                priority
              />

              <div className={`absolute inset-0 p-2 md:p-4 transition-opacity duration-1000 ${currentImageIndex === 0 ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                <Image
                  src="/dashboard-light.jpg"
                  alt="Dashboard Light Mode"
                  width={1200}
                  height={675}
                  className="rounded-2xl shadow-inner border border-zinc-100 w-full h-full"
                  priority
                />
                <div className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-sm font-bold flex items-center gap-2 shadow-lg">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Tema Claro
                </div>
              </div>
              <div className={`absolute inset-0 p-2 md:p-4 transition-opacity duration-1000 ${currentImageIndex === 1 ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                <Image
                  src="/dashboard-dark.jpg"
                  alt="Dashboard Dark Mode"
                  width={1200}
                  height={675}
                  className="rounded-2xl shadow-inner border border-zinc-100 w-full h-full"
                />
                <div className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-sm font-bold flex items-center gap-2 shadow-lg">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Tema Escuro
                </div>
              </div>
            </div>

            {/* Background Image (Tilted) - Switches between Dark/Light */}
            <div className="absolute top-4 -right-4 md:top-8 md:-right-12 w-full md:w-[90%] rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-emerald-500/20 transform rotate-3 opacity-90 hidden md:block -z-10">
              {/* Spacer for background */}
              <Image
                src="/dashboard-dark.jpg"
                alt="Spacer"
                width={1200}
                height={675}
                className="w-full h-auto opacity-0 pointer-events-none"
              />

              <div className={`absolute inset-0 transition-opacity duration-1000 ${currentImageIndex === 0 ? "opacity-100" : "opacity-0"}`}>
                <Image
                  src="/dashboard-dark.jpg"
                  alt="Dashboard Dark Mode"
                  width={1200}
                  height={675}
                  className="rounded-3xl opacity-80 w-full h-full"
                />
              </div>
              <div className={`absolute inset-0 transition-opacity duration-1000 ${currentImageIndex === 1 ? "opacity-100" : "opacity-0"}`}>
                <Image
                  src="/dashboard-light.jpg"
                  alt="Dashboard Light Mode"
                  width={1200}
                  height={675}
                  className="rounded-3xl opacity-80 w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative z-10 scroll-mt-24" ref={featuresRef}>
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
                className="feature-card p-8 rounded-3xl bg-white/60 backdrop-blur-lg border border-white/60 shadow-lg shadow-zinc-200/50 transition-all duration-500 group hover:-translate-y-4 hover:scale-105 hover:bg-gradient-to-br hover:from-emerald-600 hover:to-teal-600 hover:shadow-2xl hover:shadow-emerald-500/50 hover:border-transparent"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mb-6 transition-all duration-500 shadow-inner group-hover:scale-110 group-hover:bg-white group-hover:shadow-lg group-hover:rotate-6">
                  <feature.icon className="w-8 h-8 text-emerald-600 transition-colors duration-500 group-hover:text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-zinc-800 transition-colors duration-500 group-hover:text-white">{feature.title}</h3>
                <p className="text-zinc-600 leading-relaxed transition-colors duration-500 group-hover:text-emerald-50">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative z-10 scroll-mt-24" ref={pricingRef}>
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
            {/* Annual Plan - Premium Design */}
            <div className="relative p-1 rounded-2xl bg-gradient-to-b from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/20">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 whitespace-nowrap z-10">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                Melhor Escolha
              </div>

              <div className="relative p-8 bg-white rounded-xl h-full flex flex-col overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="mb-8 text-center relative z-10">
                  <h3 className="text-3xl font-bold text-zinc-800">Anual</h3>
                  <p className="text-emerald-600 font-medium mt-2">Economize 58%</p>
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <span className="text-zinc-400 line-through text-lg">R$ 159,90</span>
                    <div className="flex flex-col items-start">
                      <span className="text-5xl font-bold text-zinc-900 tracking-tight">R$ 67,90</span>
                      <span className="text-zinc-500 text-sm font-medium">/ano</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">Equivalente a R$ 5,65/mês</p>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent mb-8"></div>

                <ul className="space-y-4 mb-8 flex-1 relative z-10">
                  {[
                    "Acesso ilimitado ao sistema",
                    "Gestão completa de contas",
                    "Metas e objetivos financeiros",
                    "Relatórios avançados",
                    "Suporte prioritário VIP"
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-zinc-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
                      Seu nome completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="João Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                      Seu melhor email
                    </label>
                    <input
                      type="email"
                      id="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="cellphone" className="block text-sm font-medium text-zinc-700 mb-1">
                      Seu celular (com DDD)
                    </label>
                    <input
                      type="tel"
                      id="cellphone"
                      placeholder="(11) 99999-9999"
                      value={cellphone}
                      onChange={(e) => setCellphone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-zinc-700 mb-1">
                      Seu CPF
                    </label>
                    <input
                      type="text"
                      id="taxId"
                      placeholder="000.000.000-00"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || !email || !name || !cellphone || !taxId}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-14 text-lg font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] hover:shadow-emerald-500/40 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? "Carregando..." : "Quero Organizar Minha Vida"}
                  {!checkoutLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>
              </div>
            </div>
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
      </section>

      {/* Testimonials Section */}
      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 relative z-10 scroll-mt-24" ref={testimonialsRef}>
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
      </section >

      {/* CTA Section */}
      < section className="py-24 px-6 relative z-10" ref={ctaRef} >
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
      </section >

      {/* FAQ Section */}
      < section className="py-24 px-6 relative z-10" >
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
      </section >

      {/* Footer */}
      < footer className="py-12 px-6 border-t border-zinc-200/60 bg-white/40 backdrop-blur-md relative z-10" >
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
              <a href="#" className="hover:text-zinc-900 transition-colors cursor-pointer">Termos</a>
              <a href="#" className="hover:text-zinc-900 transition-colors cursor-pointer">Privacidade</a>
              <a href="mailto:contato@tatudoemdia.com.br" className="hover:text-zinc-900 transition-colors cursor-pointer">Suporte</a>
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
}
