"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { getMercadoId } from "@/lib/actions";

export default function DashboardPage() {
    const [mercadoId, setMercadoId] = useState("");
    const [vendasDia, setVendasDia] = useState(0);
    const [numVendas, setNumVendas] = useState(0);
    const [ticketMedio, setTicketMedio] = useState(0);
    const [alertasEstoque, setAlertasEstoque] = useState<Produto[]>([]);
    const [alertasValidade, setAlertasValidade] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const supabase = createClient();
            const mid = await getMercadoId();
            setMercadoId(mid);
            if (!mid) return;

            // Vendas do dia
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const { data: vendas } = await supabase
                .from("vendas")
                .select("total")
                .eq("mercado_id", mid)
                .gte("created_at", hoje.toISOString());

            const totalDia = (vendas || []).reduce((a: number, v: { total: number }) => a + Number(v.total), 0);
            const nVendas = vendas?.length || 0;
            setVendasDia(totalDia);
            setNumVendas(nVendas);
            setTicketMedio(nVendas > 0 ? totalDia / nVendas : 0);

            // Alertas estoque baixo - filtrando no client side
            const { data: produtos } = await supabase
                .from("produtos")
                .select("*")
                .eq("mercado_id", mid);

            const baixoEstoque = (produtos || []).filter(
                (p: Produto) => p.estoque <= p.estoque_minimo
            );
            setAlertasEstoque(baixoEstoque);

            // Validade próxima (30 dias)
            const em30dias = new Date();
            em30dias.setDate(em30dias.getDate() + 30);
            const vencendo = (produtos || []).filter(
                (p: Produto) => p.validade && new Date(p.validade) <= em30dias
            );
            setAlertasValidade(vencendo);
        } catch {
            // Tables might not exist yet
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined text-5xl text-[#0ea5e9] animate-spin">progress_activity</span>
                    <p className="text-[#64748b] mt-3 font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <header className="bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] px-5 pt-14 pb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#0ea5e9] flex items-center justify-center shadow-md shadow-sky-200">
                            <span className="material-symbols-outlined text-white text-xl">storefront</span>
                        </div>
                        <div>
                            <p className="text-sm text-[#64748b] font-medium">Mercado Farias</p>
                            <h1 className="text-xl font-bold text-[#0f172a]">Bom dia, Farias</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-sm hover:bg-white transition-colors">
                            <span className="material-symbols-outlined text-[#64748b]">notifications</span>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center text-white text-sm font-bold shadow-md shadow-sky-200">
                            MF
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-[#0ea5e9] text-lg">point_of_sale</span>
                            <span className="text-xs font-semibold text-[#0ea5e9] uppercase tracking-wider">Vendas do Dia</span>
                        </div>
                        <p className="text-2xl font-bold text-[#0f172a]">
                            R$ {vendasDia.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-[#0ea5e9] text-lg">receipt_long</span>
                            <span className="text-xs font-semibold text-[#0ea5e9] uppercase tracking-wider">Nº de Vendas</span>
                        </div>
                        <p className="text-2xl font-bold text-[#0f172a]">{numVendas}</p>
                        <p className="text-xs text-[#64748b] font-medium mt-1">
                            Ticket Médio: R$ {ticketMedio.toFixed(2).replace(".", ",")}
                        </p>
                    </div>
                </div>
            </header>

            {/* Quick Actions */}
            <div className="px-5 pt-5">
                <div className="flex gap-3">
                    <a href="/caixa" className="flex-1 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-2xl py-4 px-5 flex items-center gap-3 shadow-md shadow-sky-200 transition-all active:scale-[0.98]">
                        <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                        <span className="font-bold text-base">Nova Venda</span>
                    </a>
                    <a href="/estoque" className="flex-1 bg-white hover:bg-slate-50 text-[#0f172a] rounded-2xl py-4 px-5 flex items-center gap-3 shadow-sm border border-slate-100 transition-all active:scale-[0.98]">
                        <span className="material-symbols-outlined text-2xl text-[#64748b]">inventory_2</span>
                        <span className="font-bold text-base">Estoque</span>
                    </a>
                </div>
            </div>

            {/* Alertas de Estoque */}
            <section className="px-5 mt-7">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#f59e0b]">warning</span>
                        <h2 className="text-base font-bold text-[#0f172a]">Alertas de Estoque</h2>
                    </div>
                    <a href="/estoque" className="text-[#0ea5e9] text-sm font-bold uppercase tracking-wide">Ver Todos</a>
                </div>
                {alertasEstoque.length === 0 ? (
                    <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
                        <span className="material-symbols-outlined text-[#10b981] text-3xl">check_circle</span>
                        <p className="text-[#64748b] mt-1 text-sm">Estoque em dia!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {alertasEstoque.slice(0, 3).map((p) => (
                            <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[#64748b]">package_2</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#0f172a]">{p.nome}</p>
                                        <p className="text-sm text-[#f59e0b] font-medium">Apenas {p.estoque} unidades</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Validade Próxima */}
            <section className="px-5 mt-7 pb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#ef4444]">event_busy</span>
                        <h2 className="text-base font-bold text-[#0f172a]">Validade Próxima</h2>
                    </div>
                </div>
                {alertasValidade.length === 0 ? (
                    <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
                        <span className="material-symbols-outlined text-[#10b981] text-3xl">check_circle</span>
                        <p className="text-[#64748b] mt-1 text-sm">Nenhum produto vencendo!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {alertasValidade.map((p) => {
                            const dias = p.validade ? Math.ceil((new Date(p.validade).getTime() - Date.now()) / 86400000) : 0;
                            return (
                                <div key={p.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border-l-4 border-[#f59e0b]">
                                    <div className="flex-1">
                                        <p className="font-semibold text-[#0f172a]">{p.nome}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="material-symbols-outlined text-[#64748b] text-sm">calendar_today</span>
                                            <p className="text-sm text-[#64748b]">
                                                {dias <= 0
                                                    ? "Vencido!"
                                                    : `Vence em ${dias} dia${dias > 1 ? "s" : ""}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
