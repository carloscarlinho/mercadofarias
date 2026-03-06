"use client";

import { useState, useEffect } from "react";
import { useCalculator } from "./CalculatorContext";

export default function Calculator() {
    const { isOpen, closeCalculator, submitResult, initialValue } = useCalculator();
    const [display, setDisplay] = useState(initialValue || "0");
    const [equation, setEquation] = useState("");

    // Reset display when opened with a new value
    useEffect(() => {
        if (isOpen) {
            setDisplay(initialValue || "0");
            setEquation("");
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleNumber = (num: string) => {
        setDisplay((prev) => {
            if (prev === "0" && num !== ".") return num;
            if (prev === "Erro") return num;
            if (num === "." && prev.includes(".")) return prev;
            return prev + num;
        });
    };

    const handleOperator = (op: string) => {
        if (display === "Erro") return;
        setEquation(display + " " + op + " ");
        setDisplay("0");
    };

    const calculate = () => {
        if (!equation || display === "Erro") return;
        try {
            // Usando Function no lugar de eval para um pouco mais de segurança na string
            const fullEquation = equation + display;
            const result = new Function("return " + fullEquation)();

            // Limita as casas decimais para evitar floats longos
            const formattedResult = Number.isInteger(result)
                ? result.toString()
                : parseFloat(result.toFixed(4)).toString();

            setDisplay(formattedResult);
            setEquation("");
        } catch (e) {
            setDisplay("Erro");
            setEquation("");
        }
    };

    const handleDelete = () => {
        setDisplay((prev) => {
            if (prev.length <= 1 || prev === "Erro") return "0";
            return prev.slice(0, -1);
        });
    };

    const handleClear = () => {
        setDisplay("0");
        setEquation("");
    };

    const handleConfirm = () => {
        if (display !== "Erro") {
            submitResult(display);
        }
    };

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className="fixed inset-0 bg-black/20 z-40 sm:hidden"
                onClick={closeCalculator}
            />

            <div className="fixed bottom-[90px] right-4 sm:right-6 sm:bottom-6 z-50 w-[300px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5">

                {/* Header */}
                <div className="bg-slate-50 flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="font-semibold tracking-tight text-slate-700 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">calculate</span>
                        Calculadora
                    </span>
                    <button
                        onClick={closeCalculator}
                        className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Display */}
                <div className="p-4 bg-white border-b border-slate-100">
                    <div className="text-right text-sm text-slate-400 h-5 mb-1 font-mono">
                        {equation}
                    </div>
                    <div className="text-right text-3xl text-slate-800 font-semibold tracking-tight h-10 overflow-hidden truncate">
                        {display}
                    </div>
                </div>

                {/* Keypad */}
                <div className="p-2 bg-slate-50">
                    <div className="grid grid-cols-4 gap-2">
                        {/* Row 1 */}
                        <button onClick={handleClear} className="col-span-2 p-3 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition-colors">C</button>
                        <button onClick={handleDelete} className="p-3 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors flex justify-center items-center"><span className="material-symbols-outlined text-[20px]">backspace</span></button>
                        <button onClick={() => handleOperator('/')} className="p-3 rounded-xl bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition-colors text-lg">÷</button>

                        {/* Row 2 */}
                        <button onClick={() => handleNumber('7')} className="p-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-lg">7</button>
                        <button onClick={() => handleNumber('8')} className="p-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-lg">8</button>
                        <button onClick={() => handleNumber('9')} className="p-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-lg">9</button>
                        <button onClick={() => handleOperator('*')} className="p-3 rounded-xl bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition-colors text-lg">×</button>

                        {/* Row 3 */}
                        <button onClick={() => handleNumber('4')} className="p-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-lg">4</button>
                        <button onClick={() => handleNumber('5')} className="p-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-lg">5</button>
                        <button onClick={() => handleNumber('6')} className="p-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-lg">6</button>
                        <button onClick={() => handleOperator('-')} className="p-3 rounded-xl bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition-colors text-lg">−</button>

                        {/* Row 4 */}
                        <button onClick={() => handleNumber('1')} className="p-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-lg">1</button>
                        <button onClick={() => handleNumber('2')} className="p-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-lg">2</button>
                        <button onClick={() => handleNumber('3')} className="p-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-lg">3</button>
                        <button onClick={() => handleOperator('+')} className="p-3 rounded-xl bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition-colors text-lg">+</button>

                        {/* Row 5 */}
                        <button onClick={() => handleNumber('0')} className="col-span-2 p-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-lg">0</button>
                        <button onClick={() => handleNumber('.')} className="p-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors text-lg">,</button>
                        <button onClick={calculate} className="p-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm text-lg">=</button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200">
                        <button
                            onClick={handleConfirm}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                            Usar Valor
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
}
