"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/dashboard", icon: "home", label: "Início" },
    { href: "/caixa", icon: "point_of_sale", label: "Caixa" },
    { href: "/estoque", icon: "inventory_2", label: "Estoque" },
    { href: "/clientes", icon: "group", label: "Clientes" },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 h-[80px] flex items-center justify-around z-30 pb-2 shadow-[0_-4px_20px_-5px_rgb(0_0_0/0.05)]">
            {navItems.map((item) => {
                const isActive =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center gap-1 w-16 group transition-colors ${isActive ? "text-[#0ea5e9]" : "text-[#64748b] hover:text-[#0ea5e9]"
                            }`}
                    >
                        <div className="h-8 flex items-center justify-center relative">
                            <span
                                className={`material-symbols-outlined text-[24px] ${isActive ? "font-semibold" : ""
                                    }`}
                                style={isActive ? { fontVariationSettings: '"FILL" 1' } : {}}
                            >
                                {item.icon}
                            </span>
                        </div>
                        <span
                            className={`text-xs tracking-wide ${isActive ? "font-bold" : "font-medium"
                                }`}
                        >
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
