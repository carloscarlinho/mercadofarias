"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { getMercadoId, criarCliente, getSaldoDevedor, deletarCliente } from "@/lib/actions";
import type { Cliente } from "@/lib/types";

const cores = ["bg-rose-100 text-rose-600", "bg-blue-100 text-blue-600", "bg-emerald-100 text-emerald-600", "bg-purple-100 text-purple-600", "bg-amber-100 text-amber-600"];

export default function ClientesPage() {
    const [mercadoId, setMercadoId] = useState("");
    const [clientes, setClientes] = useState<(Cliente & { saldo_devedor: number })[]>([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ nome: "", telefone: "", observacoes: "" });
    const [saving, setSaving] = useState(false);

    const loadClientes = useCallback(async () => {
        try {
            const supabase = createClient();
            const mid = await getMercadoId();
            setMercadoId(mid);
            if (!mid) return;
            const { data } = await supabase.from("clientes").select("*").eq("mercado_id", mid).order("nome");
            const clientesComSaldo = await Promise.all(
                (data || []).map(async (c: Cliente) => ({ ...c, saldo_devedor: await getSaldoDevedor(c.id) }))
            );
            setClientes(clientesComSaldo as (Cliente & { saldo_devedor: number })[]);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadClientes(); }, [loadClientes]);

    const handleSubmit = async () => {
        if (!formData.nome) return;
        setSaving(true);
        try {
            await criarCliente({ mercado_id: mercadoId, nome: formData.nome, telefone: formData.telefone || undefined, observacoes: formData.observacoes || undefined });
            setFormData({ nome: "", telefone: "", observacoes: "" });
            setShowForm(false);
            loadClientes();
        } catch { } finally { setSaving(false); }
    };

    const handleDelete = async (id: string, nome: string) => {
        if (!confirm(`Remover ${nome}?`)) return;
        try { await deletarCliente(id); setClientes(prev => prev.filter(c => c.id !== id)); } catch { }
    };

    const clientesFiltrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));
    const totalFiado = clientes.reduce((acc, c) => acc + c.saldo_devedor, 0);
    const getIniciais = (nome: string) => nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><span className="material-symbols-outlined text-5xl text-[#0ea5e9] animate-spin">progress_activity</span></div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            <header className="bg-white sticky top-0 z-20 px-4 pt-12 pb-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Clientes</h1>
                    <button onClick={() => setShowForm(true)} className="bg-[#0ea5e9]/10 text-[#0ea5e9] hover:bg-[#0ea5e9]/20 p-2 rounded-xl"><span className="material-symbols-outlined text-[28px]">person_add</span></button>
                </div>
                <div className="bg-gradient-to-r from-[#ef4444]/10 to-[#f59e0b]/10 rounded-2xl p-4 mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Total em Fiado</p>
                        <p className="text-2xl font-bold text-[#ef4444]">R$ {totalFiado.toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 flex items-center justify-center"><span className="material-symbols-outlined text-[#ef4444]">account_balance_wallet</span></div>
                </div>
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="material-symbols-outlined text-[#64748b] text-xl">search</span></div>
                    <input className="block w-full pl-10 pr-4 py-3 bg-[#f8fafc] border-none rounded-xl text-[#0f172a] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#0ea5e9] text-sm" placeholder="Buscar cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                <h2 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider px-1 mb-2">{clientesFiltrados.length} clientes</h2>
                {clientesFiltrados.length === 0 && !busca && (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                        <span className="material-symbols-outlined text-5xl text-[#94a3b8]">group</span>
                        <p className="text-[#64748b] mt-3 font-medium">Nenhum cliente cadastrado</p>
                        <button onClick={() => setShowForm(true)} className="mt-3 bg-[#0ea5e9] text-white px-6 py-2 rounded-xl font-semibold">Cadastrar Cliente</button>
                    </div>
                )}
                {clientesFiltrados.map((cliente, i) => (
                    <div key={cliente.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                        <Link href={`/clientes/${cliente.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-full ${cores[i % cores.length]} flex items-center justify-center font-bold text-lg flex-shrink-0`}>{getIniciais(cliente.nome)}</div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#0f172a] text-base">{cliente.nome}</h3>
                                {cliente.telefone && <p className="text-sm text-[#64748b]">{cliente.telefone}</p>}
                            </div>
                        </Link>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {cliente.saldo_devedor > 0 ? (
                                <div className="text-right">
                                    <p className="text-xs text-[#64748b] uppercase font-semibold">Deve</p>
                                    <p className="text-base font-bold text-[#ef4444]">R$ {cliente.saldo_devedor.toFixed(2).replace(".", ",")}</p>
                                </div>
                            ) : (
                                <span className="bg-[#10b981]/10 text-[#10b981] text-xs font-bold px-3 py-1 rounded-full">Em dia</span>
                            )}
                            <button onClick={() => handleDelete(cliente.id, cliente.nome)} className="text-[#94a3b8] hover:text-[#ef4444] ml-1"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </div>
                    </div>
                ))}
            </main>

            <div className="fixed bottom-24 right-4 z-10">
                <button onClick={() => setShowForm(true)} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-2xl w-14 h-14 flex items-center justify-center shadow-lg shadow-sky-500/30 active:scale-95"><span className="material-symbols-outlined text-3xl">person_add</span></button>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold text-[#0f172a]">Novo Cliente</h2>
                            <button onClick={() => setShowForm(false)}><span className="material-symbols-outlined text-[#64748b]">close</span></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Nome *</label>
                                <input className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-[#0f172a] focus:ring-2 focus:ring-[#0ea5e9] border-none" placeholder="Ex: Dona Maria" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Telefone</label>
                                <input className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-[#0f172a] focus:ring-2 focus:ring-[#0ea5e9] border-none" placeholder="(11) 99999-9999" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#0f172a] mb-1 block">Observações</label>
                                <textarea className="w-full bg-[#f8fafc] rounded-xl px-4 py-3 text-[#0f172a] focus:ring-2 focus:ring-[#0ea5e9] border-none" rows={2} placeholder="Anotações..." value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} />
                            </div>
                            <button onClick={handleSubmit} disabled={saving || !formData.nome} className="w-full bg-[#0ea5e9] disabled:bg-[#94a3b8] text-white rounded-2xl py-4 font-bold text-base shadow-md shadow-sky-200 flex items-center justify-center gap-2">
                                {saving ? <><span className="material-symbols-outlined animate-spin">progress_activity</span>Salvando...</> : <><span className="material-symbols-outlined">person_add</span>Cadastrar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
