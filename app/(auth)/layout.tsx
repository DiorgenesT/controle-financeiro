import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f0d] p-4 relative overflow-hidden">
            {/* Gradiente principal dramático */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-[#0a0f0d] to-teal-950" />

            {/* Orbs de luz animados */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/20 blur-[150px] animate-pulse" />
            <div className="absolute bottom-[-30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-teal-400/15 blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute top-[40%] right-[5%] w-[300px] h-[300px] rounded-full bg-emerald-400/10 blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
            <div className="absolute top-[20%] left-[60%] w-[200px] h-[200px] rounded-full bg-cyan-500/10 blur-[60px] animate-pulse" style={{ animationDelay: "0.5s" }} />

            {/* Grid pattern sutil */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Linhas decorativas */}
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent" />
            <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-teal-500/10 to-transparent" />

            <div className="relative z-10 w-full max-w-md">
                {children}
            </div>
        </div>
    );
}
