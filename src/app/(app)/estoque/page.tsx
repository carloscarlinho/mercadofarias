"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getMercadoId, criarProduto, atualizarEstoque, deletarProduto } from "@/lib/actions";
import type { Produto } from "@/lib/types";

const filtros = ["Todos", "Baixo Estoque", "Vencidos"];

export default function EstoquePage() {
    const [mercadoId, setMercadoId] = useState("");
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [busca, setBusca] = useState("");
    const [filtroAtivo, setFiltroAtivo] = useState("Todos");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ nome: "", preco: "", estoque: "", estoque_minimo: "5", categoria: "", unidade: "Un", marca: "", validade: "" });
    const [saving, setSaving] = useState(false);

    const loadProdutos = useCallback(async () => {
        try {
            const supabase = createClient();
            const mid = await getMercadoId();
            setMercadoId(mid);
            if (!mid) return;
            const { data } = await supabase.from("produtos").select("*").eq("mercado_id", mid).order("nome");
            setProdutos((data || []) as Produto[]);
        } catch { /* tables might not exist */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadProdutos(); }, [loadProdutos]);

    const produtosFiltrados = produtos.filter((p) => {
        if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
        if (filtroAtivo === "Baixo Estoque" && p.estoque > p.estoque_minimo) return false;
        if (filtroAtivo === "Vencidos" && (!p.validade || new Date(p.validade) > new Date())) return false;
        return true;
    });

    const adjustStock = async (id: string, delta: number) => {
        const produto = produtos.find((p) => p.id === id);
        if (!produto) return;
        const novoEstoque = Math.max(0, produto.estoque + delta);
        setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, estoque: novoEstoque } : p)));
        try { await atualizarEstoque(id, novoEstoque); } catch { /* silent */ }
    };

    const handleSubmit = async () => {
        if (!formData.nome || !formData.preco) return;
        setSaving(true);
        try {
            await criarProduto({
                mercado_id: mercadoId,
                nome: formData.nome,
                preco: parseFloat(formData.preco),
                estoque: parseInt(formData.estoque || "0"),
                estoque_minimo: parseInt(formData.estoque_minimo || "5"),
                categoria: formData.categoria || undefined,
                unidade: formData.unidade || "Un",
                marca: formData.marca || undefined,
                validade: formData.validade || undefined,
            });
            setFormData({ nome: "", preco: "", estoque: "", estoque_minimo: "5", categoria: "", unidade: "Un", marca: "", validade: "" });
            setShowForm(false);
            loadProdutos();
        } catch { /* handle error */ } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remover este produto?")) return;
        try {
            await deletarProduto(id);
            setProdutos((prev) => prev.filter((p) => p.id !== id));
        } catch { /* handle error */ }
    };

    const getStatus = (p: Produto) => {
        if (p.validade && new Date(p.validade) <= new Date()) return "vencido";
        if (p.estoque <= p.estoque_minimo) return "baixo";
        return "normal";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-[#0ea5e9] animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            <header className="bg-white sticky top-0 z-20 px-4 pt-12 pb-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Estoque</h1>
                    <button onClick={() => setShowForm(true)} className="bg-[#0ea5e9]/10 text-[#0ea5e9] hover:bg-[#0ea5e9]/20 p-2 rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-[28px]">add</span>
                    </button>
                </div>
                <div className="relative w-full mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-[#64748b]">search</span>
                    </div>
                    <input className="block w-full pl-10 pr-4 py-3 bg-[#f8fafc] border-none rounded-xl text-[#0f172a] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#0ea5e9] text-base" placeholder="Buscar por nome..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                    {filtros.map((f) => (
                        <button key={f} onClick={() => setFiltroAtivo(f)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-sm transition-all active:scale-95 flex items-center gap-2 ${filtroAtivo === f ? "bg-[#0f172a] text-white" : "bg-white border border-slate-200 text-[#64748b]"}`}>
                            {f === "Baixo Estoque" && <span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block" />}
                            {f === "Vencidos" && <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block" />}
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-3">
                <div className="flex justify-between items-end px-1">
                    <h2 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider">Produtos ({produtosFiltrados.length})</h2>
                </div>

                {produtosFiltrados.length === 0 && (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                        <span className="material-symbols-outlined text-5xl text-[#94a3b8]">inventory_2</span>
                        <p className="text-[#64748b] mt-3 font-medium">Nenhum produto encontrado</p>
                        <button onClick={() => setShowForm(true)} className="mt-3 bg-[#0ea5e9] text-white px-6 py-2 rounded-xl font-semibold">Adicionar Produto</button>
                    </div>
                )}

                {produtosFiltrados.map((produto) => {
                    const status = getStatus(produto);
                    return (
                        <div key={produto.id} className={`bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm ${status === "baixo" ? "border-l-4 border-[#f59e0b]" : status === "vencido" ? "border-l-4 border-[#ef4444]" : ""}`}>
                            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-[#64748b] text-2xl">package_2</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-[#0f172a] text-base leading-tight truncate pr-2">{produto.nome}</h3>
                                    <span className="font-semibold text-[#0f172a] whitespace-nowrap">R$ {Number(produto.preco).toFixed(2).replace(".", ",")}</span>
                                </div>
                                {produto.marca && <p className="text-[#64748b] text-sm truncate">{produto.marca}</p>}
                                {status === "normal" && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                                            <button onClick={() => adjustStock(produto.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-[#64748b] hover:text-[#ef4444]">
                                                <span className="material-symbols-outlined text-[18px]">remove</span>
                                            </button>
                                            <span className="text-sm font-bold text-[#0f172a] w-8 text-center">{produto.estoque}</span>
                                            <button onClick={() => adjustStock(produto.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-[#64748b] hover:text-[#10b981]">
                                                <span className="material-symbols-outlined text-[18px]">add</span>
                                            </button>
                                        </div>
                                        <span className="text-xs text-[#64748b]">{produto.unidade || "Un"}</span>
                                        <button onClick={() => handleDelete(produto.id)} className="ml-auto text-[#94a3b8] hover:text-[#ef4444]">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                )}
                                {status === "baixo" && (
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-1.5 text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-md w-fit">
                                            <span className="material-symbols-outlined text-[16px]">warning</span>
                                            <span className="text-xs font-bold uppercase tracking-wide">Restam {produto.estoque}</span>
                                        </div>
                                        <button onClick={() => handleDelete(produto.id)} className="text-[#94a3b8] hover:text-[#ef4444]"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                    </div>
                                )}
                                {status === "vencido" && (
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-1.5 text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded-md w-fit">
                                            <span className="material-symbols-outlined text-[16px]">event_busy</span>
                                            <span className="text-xs font-bold uppercase tracking-wide">Venceu!</span>
                                        </div>
                                        <button onClick={() => handleDelete(produto.id)} className="text-[#94a3b8] hover:text-[#ef4444]"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* FAB */}
            <div className="fixed bottom-24 right-4 z-10">
                <button onClick={() => setShowForm(true)} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-2xl w-14 h-14 flex items-center justify-center shadow-lg shadow-sky-500/30 transition-all active:scale-95">
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>

            {/* Dialog Cadastro Produto */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold text-[#0f172a]">Novo Produto</h2>
                            <button onClick={() => setShowForm(false)} className="text-[#64748b]"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Nome *</label>
                                <input className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-[#0f172a] focus:ring-2 focus:ring-[#0ea5e9] border-none" placeholder="Ex: Arroz Tio João 5kg" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Preço (R$) *</label>
                                    <input type="number" step="0.01" className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-[#0f172a] focus:ring-2 focus:ring-[#0ea5e9] border-none" placeholder="0,00" value={formData.preco} onChange={(e) => setFormData({ ...formData, preco: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Estoque</label>
                                    <input type="number" className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-[#0f172a] focus:ring-2 focus:ring-[#0ea5e9] border-none" placeholder="0" value={formData.estoque} onChange={(e) => setFormData({ ...formData, estoque: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Unidade</label>
                                    <select className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-[#0f172a] focus:ring-2 focus:ring-[#0ea5e9] border-none" value={formData.unidade} onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}>
                                        <option>Un</option><option>Kg</option><option>Lt</option><option>Cx</option><option>Pct</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Est. Mínimo</label>
                                    <input type="number" className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-[#0f172a] focus:ring-2 focus:ring-[#0ea5e9] border-none" placeholder="5" value={formData.estoque_minimo} onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Marca</label>
                                    <input className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-[#0f172a] focus:ring-2 focus:ring-[#0ea5e9] border-none" placeholder="Ex: Nestlé" value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Validade</label>
                                    <input type="date" className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-[#0f172a] focus:ring-2 focus:ring-[#0ea5e9] border-none" value={formData.validade} onChange={(e) => setFormData({ ...formData, validade: e.target.value })} />
                                </div>
                            </div>
                            <button onClick={handleSubmit} disabled={saving || !formData.nome || !formData.preco} className="w-full bg-[#0ea5e9] disabled:bg-[#94a3b8] hover:bg-[#0284c7] text-white rounded-2xl py-4 font-bold text-base shadow-md shadow-sky-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                {saving ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">add_circle</span>}
                                {saving ? "Salvando..." : "Salvar Produto"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
