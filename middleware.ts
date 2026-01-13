import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas que não requerem autenticação
const publicRoutes = ["/", "/login", "/cadastro", "/esqueci-senha", "/planos"];

// Rotas de autenticação
const authRoutes = ["/login", "/cadastro", "/esqueci-senha", "/alterar-senha"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Verificar se é uma rota de API ou arquivo estático
    if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Obter token do cookie (o Firebase Auth gerencia isso no client-side)
    // Note: Para proteção completa server-side, você precisaria usar Firebase Admin SDK
    // Aqui fazemos uma verificação básica que será complementada pelo client-side

    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith("/planos")
    );

    const isAuthRoute = authRoutes.some(route =>
        pathname === route || pathname.startsWith(route)
    );

    // Permitir acesso às rotas públicas e de auth
    if (isPublicRoute || isAuthRoute) {
        return NextResponse.next();
    }

    // Para rotas protegidas, o controle real é feito no client-side
    // O middleware permite passar, mas os componentes verificam a autenticação
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
