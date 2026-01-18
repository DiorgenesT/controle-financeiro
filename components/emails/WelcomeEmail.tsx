"use client";

import * as React from "react";

interface WelcomeEmailProps {
    email: string;
    password: string;
    loginUrl: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
    email,
    password,
    loginUrl,
}) => (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1 style={{ color: "#10b981", margin: "0", fontSize: "28px" }}>
                🎉 Bem-vindo ao Tudo Em Dia!
            </h1>
        </div>

        <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
            <p style={{ fontSize: "16px", color: "#374151", margin: "0 0 16px 0" }}>
                Olá! Sua conta foi criada com sucesso. Agora você pode começar a organizar suas finanças!
            </p>

            <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", padding: "16px", border: "1px solid #d1fae5" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#6b7280" }}>
                    <strong>Suas credenciais de acesso:</strong>
                </p>
                <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#374151" }}>
                    <strong>Email:</strong> {email}
                </p>
                <p style={{ margin: "0", fontSize: "14px", color: "#374151" }}>
                    <strong>Senha temporária:</strong>{" "}
                    <span style={{ fontFamily: "monospace", backgroundColor: "#fef3c7", padding: "2px 6px", borderRadius: "4px" }}>
                        {password}
                    </span>
                </p>
            </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <a
                href={loginUrl}
                style={{
                    display: "inline-block",
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    padding: "14px 32px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "16px",
                }}
            >
                Acessar Minha Conta
            </a>
        </div>

        <div style={{ backgroundColor: "#fef3c7", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
            <p style={{ margin: "0", fontSize: "14px", color: "#92400e" }}>
                ⚠️ <strong>Importante:</strong> Por segurança, você será solicitado a alterar sua senha no primeiro acesso.
            </p>
        </div>

        <div style={{ textAlign: "center", borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
            <p style={{ margin: "0", fontSize: "12px", color: "#9ca3af" }}>
                Se você não solicitou esta conta, por favor ignore este email.
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>
                © {new Date().getFullYear()} Tudo Em Dia - Todos os direitos reservados
            </p>
        </div>
    </div>
);
