"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CalculatorContextType {
    isOpen: boolean;
    openCalculator: (initialValue?: string, onResultCallback?: (result: string) => void) => void;
    closeCalculator: () => void;
    submitResult: (result: string) => void;
    initialValue: string;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export function CalculatorProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialValue, setInitialValue] = useState("");
    const [callback, setCallback] = useState<((result: string) => void) | null>(null);

    const openCalculator = (value = "", onResultCallback?: (result: string) => void) => {
        setInitialValue(value);
        if (onResultCallback) {
            setCallback(() => onResultCallback);
        } else {
            setCallback(null);
        }
        setIsOpen(true);
    };

    const closeCalculator = () => {
        setIsOpen(false);
        setInitialValue("");
        setCallback(null);
    };

    const submitResult = (result: string) => {
        if (callback) {
            callback(result);
        }
        closeCalculator();
    };

    return (
        <CalculatorContext.Provider
            value={{
                isOpen,
                openCalculator,
                closeCalculator,
                submitResult,
                initialValue,
            }}
        >
            {children}
        </CalculatorContext.Provider>
    );
}

export function useCalculator() {
    const context = useContext(CalculatorContext);
    if (context === undefined) {
        throw new Error("useCalculator must be used within a CalculatorProvider");
    }
    return context;
}
