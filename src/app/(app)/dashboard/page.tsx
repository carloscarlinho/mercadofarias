"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getMercadoId } from "@/lib/actions";

export default function DashboardPage() {
    const [mercadoId, setMercadoId] = useState("");
    const [vendasDia, setVendasDia] = useState(0);
    const [numVendas, setNumVendas] = useState(0);
    const [faturamentoSemana, setFaturamentoSemana] = useState(0);
    const [faturamentoMes, setFaturamentoMes] = useState(0);
    const [fiadosPendentes, setFiadosPendentes] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const supabase = createClient();
            const mid = await getMercadoId();
            setMercadoId(mid);
            if (!mid) return;

            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            // Calcula o início da semana (Domingo)
            const inicioSemana = new Date(hoje);
            inicioSemana.setDate(hoje.getDate() - hoje.getDay());

            // Calcula o início do mês
            const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

            // Busca todas as vendas do mês (que já inclui as da semana e do dia)
            const { data: vendasDb } = await supabase
                .from("vendas")
                .select("total, created_at, tipo")
                .eq("mercado_id", mid)
                .gte("created_at", inicioMes.toISOString());

            const vendas = vendasDb || [];

            // Totais
            let totalDia = 0;
            let nVendasDia = 0;
            let totalSemana = 0;
            let totalMes = 0;

            vendas.forEach((v: { total: number | string; created_at: string }) => {
                const total = Number(v.total);
                const dataVenda = new Date(v.created_at);

                // Mês
                totalMes += total;

                // Semana
                if (dataVenda >= inicioSemana) {
                    totalSemana += total;
                }

                // Dia
                if (dataVenda >= hoje) {
                    totalDia += total;
                    nVendasDia++;
                }
            });

            setVendasDia(totalDia);
            setNumVendas(nVendasDia);
            setFaturamentoSemana(totalSemana);
            setFaturamentoMes(totalMes);

            // Fiados (Total devido pelos clientes)
            const { data: clientesDb } = await supabase
                .from("clientes")
                .select("id")
                .eq("mercado_id", mid);

            const clientesIds = (clientesDb || []).map((c: { id: string }) => c.id);

            if (clientesIds.length > 0) {
                // Soma todas as vendas fiadas
                const { data: vendasFiadas } = await supabase
                    .from("vendas")
                    .select("total")
                    .eq("mercado_id", mid)
                    .in("cliente_id", clientesIds)
                    .in("tipo", ["fiado", "parcial"]);

                const totalFiado = (vendasFiadas || []).reduce((acc: number, v: { total: number | string }) => acc + Number(v.total), 0);

                // Soma todos os pagamentos
                const { data: pagamentosDb } = await supabase
                    .from("pagamentos")
                    .select("valor")
                    .eq("mercado_id", mid)
                    .in("cliente_id", clientesIds);

                const totalPago = (pagamentosDb || []).reduce((acc: number, p: { valor: number | string }) => acc + Number(p.valor), 0);

                setFiadosPendentes(Math.max(0, totalFiado - totalPago));
            }

        } catch {
            // Error handling
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#0c1425] to-[#0f172a] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#0ea5e9]/20 rounded-full blur-[80px] animate-pulse pointer-events-none" />
                <div className="text-center z-10 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
                    <img
                        src="/logo.png"
                        alt="Mercado Farias"
                        className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-[0_0_30px_rgba(14,165,233,0.5)] mx-auto mb-4"
                    />
                    <div className="flex items-center justify-center gap-2 text-[#0ea5e9] font-medium tracking-widest text-sm uppercase">
                        <span className="w-2 h-2 rounded-full bg-[#0ea5e9] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-[#0ea5e9] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-[#0ea5e9] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24">
            {/* Header */}
            <header className="bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] px-5 pt-14 pb-8 rounded-b-3xl shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <img
                        src="/logo.png"
                        alt="Mercado Farias"
                        className="w-16 h-16 rounded-2xl object-cover shadow-md bg-white p-1"
                    />
                    <div>
                        <h1 className="text-2xl font-black text-[#0f172a]">Início</h1>
                        <p className="text-base text-[#64748b] font-medium">Mercado Farias</p>
                    </div>
                </div>

                {/* Vendas do Dia (DESTAQUE GIGANTE) */}
                <div className="bg-white rounded-3xl p-6 shadow-md border border-sky-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                        <span className="material-symbols-outlined text-[#0ea5e9] text-2xl">point_of_sale</span>
                        <span className="text-sm font-bold text-[#0ea5e9] uppercase tracking-wider">Vendas de Hoje</span>
                    </div>
                    <p className="text-4xl sm:text-5xl font-black text-[#0f172a] tracking-tight relative z-10">
                        R$ {vendasDia.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm font-bold text-[#64748b] mt-2 relative z-10">
                        {numVendas} {numVendas === 1 ? 'venda registrada' : 'vendas registradas'} hoje
                    </p>
                </div>
            </header>

            {/* Quick Actions GIGANTES */}
            <div className="px-5 mt-6">
                <div className="flex flex-col gap-4">
                    <a href="/caixa" className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-3xl py-6 px-6 flex items-center justify-between shadow-lg shadow-sky-200 transition-all active:scale-[0.98]">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl">shopping_cart_checkout</span>
                            </div>
                            <div>
                                <h2 className="font-black text-2xl">Nova Venda</h2>
                                <p className="text-sky-100 font-medium text-sm">Abrir o caixa</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-3xl opacity-50">chevron_right</span>
                    </a>

                    <a href="/clientes" className="w-full bg-white hover:bg-slate-50 text-[#0f172a] rounded-3xl py-6 px-6 flex items-center justify-between shadow-md border border-slate-100 transition-all active:scale-[0.98]">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl">groups</span>
                            </div>
                            <div>
                                <h2 className="font-black text-2xl">Fiados</h2>
                                <p className="text-[#64748b] font-medium text-sm">Ver devedores</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-[#94a3b8]">chevron_right</span>
                    </a>
                </div>
            </div>

            {/* Relatórios Financeiros Claros */}
            <section className="px-5 mt-8 mb-8">
                <h2 className="text-xl font-black text-[#0f172a] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0ea5e9]">query_stats</span>
                    Relatórios Simplificados
                </h2>

                <div className="space-y-4">
                    {/* Faturamento da Semana */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-3xl">calendar_view_week</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-[#64748b] uppercase">Faturamento (Semana)</p>
                            <p className="text-2xl font-black text-[#0f172a] mt-0.5">
                                R$ {faturamentoSemana.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Faturamento do Mês */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-3xl">calendar_month</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-[#64748b] uppercase">Faturamento (Mês)</p>
                            <p className="text-2xl font-black text-[#0f172a] mt-0.5">
                                R$ {faturamentoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Total em Fiados (A Receber) */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-5">
                        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-3xl">money_off</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-[#64748b] uppercase">Total em Fiados (A Receber)</p>
                            <p className="text-2xl font-black text-rose-600 mt-0.5">
                                R$ {fiadosPendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-[#94a3b8] mt-1 font-medium">Dinheiro "na rua"</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
