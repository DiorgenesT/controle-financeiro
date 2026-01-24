import * as React from "react";

interface ResetPasswordEmailProps {
    resetUrl: string;
    email: string;
}

export const ResetPasswordEmail: React.FC<ResetPasswordEmailProps> = ({
    resetUrl,
    email,
}) => (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1 style={{ color: "#10b981", margin: "0", fontSize: "28px" }}>
                🔐 Recuperação de Senha
            </h1>
        </div>

        <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
            <p style={{ fontSize: "16px", color: "#374151", margin: "0 0 16px 0" }}>
                Olá! Recebemos uma solicitação para redefinir a senha da conta associada ao email <strong>{email}</strong>.
            </p>

            <p style={{ fontSize: "16px", color: "#374151", margin: "0" }}>
                Clique no botão abaixo para criar uma nova senha:
            </p>
        </div>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <a
                href={resetUrl}
                style={{
                    display: "inline-block",
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    padding: "16px 40px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "16px",
                }}
            >
                Redefinir Minha Senha
            </a>
        </div>

        <div style={{ backgroundColor: "#fef3c7", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
            <p style={{ margin: "0", fontSize: "14px", color: "#92400e" }}>
                ⚠️ <strong>Importante:</strong> Este link expira em 1 hora. Se você não solicitou a redefinição de senha, ignore este email.
            </p>
        </div>

        <div style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#6b7280" }}>
                Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:
            </p>
            <p style={{ margin: "0", fontSize: "12px", color: "#374151", wordBreak: "break-all" }}>
                {resetUrl}
            </p>
        </div>

        <div style={{ textAlign: "center", borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
            <p style={{ margin: "0", fontSize: "12px", color: "#9ca3af" }}>
                Se você não solicitou esta recuperação, sua conta está segura. Nenhuma ação é necessária.
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>
                © {new Date().getFullYear()} Tudo Em Dia - Todos os direitos reservados
            </p>
        </div>
    </div>
);
