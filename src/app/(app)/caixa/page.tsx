"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getMercadoId, getClientes, registrarVenda } from "@/lib/actions";
import type { Produto, Cliente } from "@/lib/types";

interface CartItem {
    id: string;
    nome: string;
    preco: number;
    quantidade: number;
    unidade: string;
}

export default function CaixaPage() {
    const [mercadoId, setMercadoId] = useState("");
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [busca, setBusca] = useState("");
    const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
    const [clienteNome, setClienteNome] = useState("Cliente Balcão");
    const [showClientes, setShowClientes] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processando, setProcessando] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const supabase = createClient();
            const mid = await getMercadoId();
            setMercadoId(mid);
            if (!mid) return;
            const { data: prods } = await supabase.from("produtos").select("*").eq("mercado_id", mid).order("nome");
            setProdutos((prods || []) as Produto[]);
            const cls = await getClientes(mid);
            setClientes(cls);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const addToCart = (produto: Produto) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === produto.id);
            if (existing) return prev.map((i) => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
            return [...prev, { id: produto.id, nome: produto.nome, preco: Number(produto.preco), quantidade: 1, unidade: produto.unidade || "Un" }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart((prev) => {
            const item = prev.find(i => i.id === id);
            if (item && item.quantidade > 1) return prev.map(i => i.id === id ? { ...i, quantidade: i.quantidade - 1 } : i);
            return prev.filter(i => i.id !== id);
        });
    };

    const totalItens = cart.reduce((acc, i) => acc + i.quantidade, 0);
    const totalValor = cart.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
    const getQtdInCart = (id: string) => cart.find((i) => i.id === id)?.quantidade || 0;

    const categorias = ["Todos", ...new Set(produtos.map(p => p.categoria).filter((c): c is string => !!c))];

    const produtosFiltrados = produtos.filter((p) => {
        if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
        if (categoriaAtiva !== "Todos" && p.categoria !== categoriaAtiva) return false;
        return true;
    });

    const finalizarVenda = async (tipo: 'pago' | 'fiado') => {
        if (cart.length === 0) return;
        if (tipo === 'fiado' && !clienteSelecionado) {
            alert("Selecione um cliente para vendas fiado!");
            return;
        }
        setProcessando(true);
        try {
            await registrarVenda(
                mercadoId,
                clienteSelecionado,
                cart.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco })),
                totalValor,
                tipo,
                tipo === 'pago' ? totalValor : 0,
                tipo === 'pago' ? 'dinheiro' : ''
            );
            setCart([]);
            alert(`✅ Venda de R$ ${totalValor.toFixed(2).replace(".", ",")} registrada com sucesso!`);
            loadData();
        } catch (e) {
            alert("Erro ao registrar venda");
        } finally { setProcessando(false); }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><span className="material-symbols-outlined text-5xl text-[#0ea5e9] animate-spin">progress_activity</span></div>;
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            <header className="bg-white sticky top-0 z-20 px-4 pt-12 pb-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Mercado Farias" className="w-10 h-10 rounded-xl object-cover" />
                        <h1 className="text-lg font-bold text-[#0f172a]">Mercado Farias</h1>
                    </div>
                </div>
                <button onClick={() => setShowClientes(true)} className="w-full bg-[#f1f5f9] rounded-2xl px-4 py-3 flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0ea5e9]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#0ea5e9] text-lg">person</span>
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-[#64748b] uppercase font-semibold tracking-wider">Cliente Atual</p>
                            <p className="font-bold text-[#0f172a]">{clienteNome}</p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-[#64748b]">expand_more</span>
                </button>
                <div className="relative w-full mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="material-symbols-outlined text-[#64748b] text-xl">search</span></div>
                    <input className="block w-full pl-10 pr-4 py-3 bg-[#f1f5f9] border-none rounded-xl text-[#0f172a] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#0ea5e9] text-sm" placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                    {categorias.map((cat) => (
                        <button key={cat} onClick={() => setCategoriaAtiva(cat)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${categoriaAtiva === cat ? "bg-[#0f172a] text-white shadow-sm" : "bg-white border border-slate-200 text-[#64748b]"}`}>{cat}</button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 py-4 pb-40">
                {produtos.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                        <span className="material-symbols-outlined text-5xl text-[#94a3b8]">inventory_2</span>
                        <p className="text-[#64748b] mt-3">Cadastre produtos no Estoque primeiro</p>
                        <a href="/estoque" className="mt-3 inline-block bg-[#0ea5e9] text-white px-6 py-2 rounded-xl font-semibold">Ir para Estoque</a>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        {produtosFiltrados.map((produto) => {
                            const qtd = getQtdInCart(produto.id);
                            return (
                                <button key={produto.id} onClick={() => addToCart(produto)} className={`relative bg-white rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform border ${qtd > 0 ? "border-[#0ea5e9] ring-2 ring-[#0ea5e9]/20" : "border-transparent"}`}>
                                    {qtd > 0 && <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0ea5e9] text-white text-xs font-bold flex items-center justify-center shadow-md">{qtd}</div>}
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><span className="material-symbols-outlined text-[#64748b]">package_2</span></div>
                                    <p className="text-sm font-semibold text-[#0f172a] text-center leading-tight">{produto.nome}</p>
                                    <p className="text-[10px] text-[#64748b]">{produto.unidade || "Un"}</p>
                                    <p className="text-sm font-bold text-[#0ea5e9]">R$ {Number(produto.preco).toFixed(2).replace(".", ",")}</p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Cart Bar */}
            {totalItens > 0 && (
                <div className="fixed bottom-[80px] left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-20 shadow-[0_-4px_20px_-5px_rgb(0_0_0/0.1)]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center"><span className="material-symbols-outlined text-[#0ea5e9] text-lg">shopping_cart</span></div>
                            <div>
                                <p className="text-[10px] text-[#64748b] uppercase font-semibold tracking-wider">Itens no Carrinho</p>
                                <p className="text-sm font-bold text-[#0f172a]">{totalItens} unidades</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-[#64748b] uppercase font-semibold tracking-wider">Total</p>
                            <p className="text-xl font-bold text-[#0ea5e9]">R$ {totalValor.toFixed(2).replace(".", ",")}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button disabled={processando} onClick={() => finalizarVenda('pago')} className="bg-[#0ea5e9] disabled:bg-[#94a3b8] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold text-sm shadow-md shadow-sky-200 transition-all active:scale-[0.98]">
                            <span className="material-symbols-outlined text-xl">payments</span>Pago
                        </button>
                        <button disabled={processando} onClick={() => finalizarVenda('fiado')} className="bg-white disabled:bg-slate-100 text-[#0f172a] rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold text-sm border border-slate-200 transition-all active:scale-[0.98]">
                            <span className="material-symbols-outlined text-xl text-[#64748b]">credit_score</span>Fiado
                        </button>
                    </div>
                </div>
            )}

            {/* Select Cliente Modal */}
            {showClientes && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[70vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#0f172a]">Selecionar Cliente</h2>
                            <button onClick={() => setShowClientes(false)}><span className="material-symbols-outlined text-[#64748b]">close</span></button>
                        </div>
                        <button onClick={() => { setClienteSelecionado(null); setClienteNome("Cliente Balcão"); setShowClientes(false); }} className="w-full bg-[#f1f5f9] rounded-xl px-4 py-3 text-left mb-2 hover:bg-slate-200 transition-colors">
                            <p className="font-bold text-[#0f172a]">👤 Cliente Balcão</p>
                            <p className="text-xs text-[#64748b]">Sem cadastro (venda avulsa)</p>
                        </button>
                        {clientes.map((c) => (
                            <button key={c.id} onClick={() => { setClienteSelecionado(c.id); setClienteNome(c.nome); setShowClientes(false); }} className="w-full bg-white rounded-xl px-4 py-3 text-left mb-2 hover:bg-slate-50 transition-colors border border-slate-100">
                                <p className="font-bold text-[#0f172a]">{c.nome}</p>
                                {c.telefone && <p className="text-xs text-[#64748b]">{c.telefone}</p>}
                            </button>
                        ))}
                        {clientes.length === 0 && (
                            <p className="text-center text-[#64748b] py-4">Nenhum cliente cadastrado.<br /><a href="/clientes" className="text-[#0ea5e9] font-bold">Cadastrar →</a></p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
