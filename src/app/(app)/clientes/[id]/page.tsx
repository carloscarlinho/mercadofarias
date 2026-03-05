"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getCliente, getSaldoDevedor, getExtratoCliente, registrarPagamento, getMercadoId } from "@/lib/actions";
import type { Cliente } from "@/lib/types";
import { useParams } from "next/navigation";

export default function FichaClientePage() {
    const params = useParams();
    const clienteId = params.id as string;
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [saldo, setSaldo] = useState(0);
    const [extrato, setExtrato] = useState<{ vendas: any[]; pagamentos: any[] }>({ vendas: [], pagamentos: [] });
    const [loading, setLoading] = useState(true);
    const [showPagamento, setShowPagamento] = useState(false);
    const [valorPagamento, setValorPagamento] = useState("");
    const [formaPgto, setFormaPgto] = useState("dinheiro");
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const c = await getCliente(clienteId);
            setCliente(c);
            const s = await getSaldoDevedor(clienteId);
            setSaldo(s);
            const ext = await getExtratoCliente(clienteId);
            setExtrato(ext);
        } catch { } finally { setLoading(false); }
    }, [clienteId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handlePagamento = async () => {
        const valor = parseFloat(valorPagamento);
        if (!valor || valor <= 0) return;
        setSaving(true);
        try {
            const mid = await getMercadoId();
            await registrarPagamento(mid, clienteId, valor, formaPgto);
            setShowPagamento(false);
            setValorPagamento("");
            alert(`✅ Pagamento de R$ ${valor.toFixed(2).replace(".", ",")} registrado!`);
            loadData();
        } catch { alert("Erro ao salvar"); } finally { setSaving(false); }
    };

    // Merge and sort extrato items
    const timelineItems = [
        ...extrato.vendas.map((v: any) => ({
            id: v.id, data: v.created_at, tipo: "compra" as const,
            valor: v.tipo === 'parcial' ? Number(v.total) - Number(v.sinal) : Number(v.total),
            descricao: "COMPRA MERCADORIA",
            itens: v.itens_venda?.map((i: any) => `${i.quantidade}x ${i.produtos?.nome || 'Produto'} R$ ${Number(i.preco_unitario).toFixed(2).replace(".", ",")}`) || [],
        })),
        ...extrato.pagamentos.map((p: any) => ({
            id: p.id, data: p.created_at, tipo: "pagamento" as const,
            valor: Number(p.valor), descricao: "PAGAMENTO",
            forma: p.forma_pagamento,
        })),
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    const formatDate = (d: string) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const getIniciais = (nome: string) => nome?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "??";

    if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><span className="material-symbols-outlined text-5xl text-[#0ea5e9] animate-spin">progress_activity</span></div>;
    if (!cliente) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><p>Cliente não encontrado</p></div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            <header className="bg-white px-4 pt-12 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/clientes" className="text-[#64748b]"><span className="material-symbols-outlined text-2xl">arrow_back</span></a>
                        <h1 className="text-lg font-bold text-[#0f172a]">Ficha do Cliente</h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-28">
                <div className="bg-white px-5 pt-6 pb-6">
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-2xl font-bold">{getIniciais(cliente.nome)}</div>
                        <h2 className="text-xl font-bold text-[#0f172a] mt-3">{cliente.nome}</h2>
                        {cliente.telefone && (
                            <div className="flex items-center gap-1.5 mt-1 text-[#64748b]">
                                <span className="material-symbols-outlined text-lg">phone</span>
                                <p className="text-sm">{cliente.telefone}</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-5 bg-gradient-to-r from-[#ef4444]/5 to-[#f59e0b]/5 rounded-2xl p-5 text-center border border-[#ef4444]/10">
                        <p className="text-xs font-bold text-[#ef4444] uppercase tracking-wider mb-1">Saldo Devedor</p>
                        <p className="text-4xl font-bold text-[#ef4444]">R$ {saldo.toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div className="flex items-center justify-center gap-8 mt-6">
                        {cliente.telefone && (
                            <>
                                <a href={`https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-2xl bg-[#f1f5f9] flex items-center justify-center"><span className="material-symbols-outlined text-xl text-[#25d366]">chat</span></div>
                                    <span className="text-xs text-[#64748b] font-medium">WhatsApp</span>
                                </a>
                                <a href={`tel:${cliente.telefone}`} className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-2xl bg-[#f1f5f9] flex items-center justify-center"><span className="material-symbols-outlined text-xl text-[#0ea5e9]">call</span></div>
                                    <span className="text-xs text-[#64748b] font-medium">Ligar</span>
                                </a>
                            </>
                        )}
                    </div>
                </div>

                <section className="px-5 mt-4">
                    <h3 className="text-lg font-bold text-[#0f172a] mb-4">Extrato Detalhado</h3>
                    {timelineItems.length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                            <span className="material-symbols-outlined text-4xl text-[#94a3b8]">receipt_long</span>
                            <p className="text-[#64748b] mt-2">Nenhuma movimentação</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {timelineItems.map((item) => (
                                <div key={item.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${item.tipo === "compra" ? "border-[#ef4444]" : "border-[#10b981]"}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-bold text-[#64748b] uppercase tracking-wide">{item.descricao}</p>
                                        <p className={`font-bold text-base ${item.tipo === "compra" ? "text-[#ef4444]" : "text-[#10b981]"}`}>
                                            {item.tipo === "compra" ? "+" : "-"} R$ {item.valor.toFixed(2).replace(".", ",")}
                                        </p>
                                    </div>
                                    {"itens" in item && item.itens?.length > 0 && (
                                        <div className="mt-2 space-y-0.5">{item.itens.map((it: string, i: number) => <p key={i} className="text-xs text-[#64748b]">- {it}</p>)}</div>
                                    )}
                                    {"forma" in item && item.forma && <p className="text-xs text-[#64748b] mt-1">Via: {item.forma}</p>}
                                    <p className="text-[10px] text-[#94a3b8] mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span>{formatDate(item.data)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Bottom Actions */}
            <div className="fixed bottom-[80px] left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-20 shadow-[0_-4px_20px_-5px_rgb(0_0_0/0.1)]">
                <div className="grid grid-cols-2 gap-3">
                    <a href="/caixa" className="border-2 border-[#ef4444] text-[#ef4444] rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold text-sm hover:bg-[#ef4444]/5 active:scale-[0.98]">
                        <span className="material-symbols-outlined text-xl">add_shopping_cart</span>Nova Venda
                    </a>
                    <button onClick={() => setShowPagamento(true)} className="bg-[#10b981] hover:bg-[#059669] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold text-sm shadow-md shadow-emerald-200 active:scale-[0.98]">
                        <span className="material-symbols-outlined text-xl">payments</span>Receber
                    </button>
                </div>
            </div>

            {/* Pagamento Modal */}
            {showPagamento && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold text-[#0f172a]">Receber Pagamento</h2>
                            <button onClick={() => setShowPagamento(false)}><span className="material-symbols-outlined text-[#64748b]">close</span></button>
                        </div>
                        <p className="text-sm text-[#64748b] mb-4">Saldo devedor: <strong className="text-[#ef4444]">R$ {saldo.toFixed(2).replace(".", ",")}</strong></p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Valor (R$)</label>
                                <input type="number" step="0.01" className="w-full bg-[#f8fafc] rounded-xl px-4 py-4 text-2xl font-bold text-[#0f172a] focus:ring-2 focus:ring-[#10b981] border-none" placeholder="0,00" value={valorPagamento} onChange={(e) => setValorPagamento(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-2 block">Forma</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[{ id: "dinheiro", icon: "payments", label: "Dinheiro" }, { id: "cartao", icon: "credit_card", label: "Cartão" }, { id: "pix", icon: "qr_code_2", label: "Pix" }].map((f) => (
                                        <button key={f.id} onClick={() => setFormaPgto(f.id)} className={`py-3 rounded-xl flex flex-col items-center gap-1 text-sm font-semibold ${formaPgto === f.id ? "bg-[#10b981]/10 text-[#10b981] border-2 border-[#10b981]" : "bg-white text-[#64748b] border border-slate-200"}`}>
                                            <span className="material-symbols-outlined">{f.icon}</span>{f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handlePagamento} disabled={saving || !valorPagamento} className="w-full bg-[#10b981] disabled:bg-[#94a3b8] text-white rounded-2xl py-4 font-bold text-base shadow-md shadow-emerald-200 flex items-center justify-center gap-2">
                                {saving ? <><span className="material-symbols-outlined animate-spin">progress_activity</span>Salvando...</> : <><span className="material-symbols-outlined">check_circle</span>Confirmar Pagamento</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
