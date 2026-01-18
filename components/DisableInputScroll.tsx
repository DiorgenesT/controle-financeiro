"use client";

import { useEffect } from "react";

export function DisableInputScroll() {
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" &&
                (target as HTMLInputElement).type === "number" &&
                document.activeElement === target
            ) {
                (target as HTMLInputElement).blur();
            }
        };

        window.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            window.removeEventListener("wheel", handleWheel);
        };
    }, []);

    return null;
}
