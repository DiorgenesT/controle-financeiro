import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
            <div className="text-center space-y-8 max-w-md">
                {/* Glitch Effect 404 */}
                <div className="relative">
                    <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-9xl font-black text-emerald-500/20 blur-sm transform translate-x-1 translate-y-1">
                            404
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Página não encontrada</h2>
                    <p className="text-muted-foreground">
                        Ops! Parece que você se perdeu nas suas finanças. A página que você está procurando não existe ou foi movida.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Voltar ao Início
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Ir para o Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
