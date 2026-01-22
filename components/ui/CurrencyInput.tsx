import React, { useState, useEffect, forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: string | number;
    onChange: (value: string) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onChange, className, ...props }, ref) => {
        const [displayValue, setDisplayValue] = useState("");

        // Formata o valor inicial
        useEffect(() => {
            if (value === "" || value === undefined) {
                setDisplayValue("");
                return;
            }

            const numValue = typeof value === "string" ? parseFloat(value) : value;
            if (isNaN(numValue)) {
                setDisplayValue("");
                return;
            }

            // Formata para R$ X.XXX,XX
            const formatted = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
            }).format(numValue);

            setDisplayValue(formatted);
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;

            // Remove tudo que não é dígito
            const digits = inputValue.replace(/\D/g, "");

            if (digits === "") {
                setDisplayValue("");
                onChange("");
                return;
            }

            // Converte para número (divide por 100 para considerar centavos)
            const numberValue = parseInt(digits) / 100;

            // Formata para exibição
            const formatted = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
            }).format(numberValue);

            setDisplayValue(formatted);

            // Retorna o valor numérico como string para o pai (ex: "1000.50")
            onChange(numberValue.toFixed(2));
        };

        return (
            <Input
                {...props}
                ref={ref}
                value={displayValue}
                onChange={handleChange}
                className={className}
                placeholder="R$ 0,00"
                inputMode="numeric"
            />
        );
    }
);

CurrencyInput.displayName = "CurrencyInput";
