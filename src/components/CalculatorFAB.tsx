"use client";

import { useCalculator } from "./CalculatorContext";

export default function CalculatorFAB() {
    const { openCalculator, isOpen } = useCalculator();

    if (isOpen) return null;

    return (
        <button
            onClick={() => openCalculator()}
            className="fixed bottom-[100px] right-4 sm:right-6 sm:bottom-[100px] z-40 bg-[#0f172a] text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition-all hover:scale-105 flex items-center justify-center animate-in fade-in"
            aria-label="Abrir Calculadora"
        >
            <span className="material-symbols-outlined text-[24px]">calculate</span>
        </button>
    );
}
