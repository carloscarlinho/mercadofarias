import BottomNav from "@/components/BottomNav";
import { CalculatorProvider } from "@/components/CalculatorContext";
import Calculator from "@/components/Calculator";
import CalculatorFAB from "@/components/CalculatorFAB";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CalculatorProvider>
            <div className="min-h-screen bg-[#f8fafc] flex flex-col">
                <main className="flex-1 pb-[80px]">{children}</main>
                <CalculatorFAB />
                <Calculator />
                <BottomNav />
            </div>
        </CalculatorProvider>
    );
}
