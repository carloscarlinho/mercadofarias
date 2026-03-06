"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { createClient } from "@/lib/supabase";

// Tipos para as tabelas
type ProdutoRelatorio = {
    id: string;
    nome: string;
    preco: number;
    estoque: number;
    estoque_minimo: number;
    categoria: string;
};

type ClienteRelatorio = {
    id: string;
    nome: string;
    telefone: string;
    saldo_devedor: number;
    ultima_compra: string;
};

export default function PlanilhasPage() {
    const [activeTab, setActiveTab] = useState<"estoque" | "clientes">("estoque");
    const [produtos, setProdutos] = useState<ProdutoRelatorio[]>([]);
    const [clientes, setClientes] = useState<ClienteRelatorio[]>([]);
    const [loading, setLoading] = useState(true);

    // Colunas do Estoque
    const colunasProduto: ColumnDef<ProdutoRelatorio>[] = [
        {
            accessorKey: "nome",
            header: "Produto",
        },
        {
            accessorKey: "categoria",
            header: "Categoria",
            cell: ({ row }) => row.original.categoria || "-",
        },
        {
            accessorKey: "preco",
            header: "Preço",
            cell: ({ row }) =>
                new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                }).format(row.original.preco),
        },
        {
            accessorKey: "estoque",
            header: "Qtd. Atual",
            cell: ({ row }) => {
                const isBaixo = row.original.estoque <= row.original.estoque_minimo;
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isBaixo ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {row.original.estoque} un
                    </span>
                );
            },
        },
        {
            accessorKey: "estoque_minimo",
            header: "Estoque Mínimo",
        },
    ];

    // Colunas de Clientes
    const colunasCliente: ColumnDef<ClienteRelatorio>[] = [
        {
            accessorKey: "nome",
            header: "Cliente",
        },
        {
            accessorKey: "telefone",
            header: "Telefone",
            cell: ({ row }) => row.original.telefone || "-",
        },
        {
            accessorKey: "saldo_devedor",
            header: "Saldo Devedor",
            cell: ({ row }) => {
                const saldo = row.original.saldo_devedor;
                return (
                    <span className={`font-medium ${saldo > 0 ? "text-red-600" : "text-slate-600"}`}>
                        {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        }).format(saldo)}
                    </span>
                );
            },
        },
    ];

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const supabase = createClient();

            // Buscar Produtos
            if (activeTab === "estoque") {
                const { data, error } = await supabase
                    .from("produtos")
                    .select("id, nome, preco, estoque, estoque_minimo, categoria")
                    .order("nome");

                if (!error && data) {
                    setProdutos(data);
                }
            }

            // Buscar Clientes com Saldo
            if (activeTab === "clientes") {
                const { data: clientesData } = await supabase
                    .from("clientes")
                    .select("id, nome, telefone")
                    .order("nome");

                if (clientesData) {
                    // Simplificado: Busca todas as vendas e pagamentos para calcular o saldo de todos
                    // Numa aplicação real muito grande, usaríamos uma view ou função no Supabase
                    const { data: vendas } = await supabase.from("vendas").select("cliente_id, total, sinal").eq("tipo", "fiado");
                    const { data: parciais } = await supabase.from("vendas").select("cliente_id, total, sinal").eq("tipo", "parcial");
                    const { data: pagamentos } = await supabase.from("pagamentos").select("cliente_id, valor");

                    const saldos: Record<string, number> = {};

                    vendas?.forEach((v: { cliente_id: string | null; total: number; sinal: number | null }) => {
                        if (v.cliente_id) saldos[v.cliente_id] = (saldos[v.cliente_id] || 0) + (v.total - (v.sinal || 0));
                    });
                    parciais?.forEach((v: { cliente_id: string | null; total: number; sinal: number | null }) => {
                        if (v.cliente_id) saldos[v.cliente_id] = (saldos[v.cliente_id] || 0) + (v.total - (v.sinal || 0));
                    });
                    pagamentos?.forEach((p: { cliente_id: string | null; valor: number }) => {
                        if (p.cliente_id) saldos[p.cliente_id] = (saldos[p.cliente_id] || 0) - p.valor;
                    });

                    const clientesFormatados = clientesData.map((c: { id: string; nome: string; telefone: string | null }) => ({
                        ...c,
                        saldo_devedor: saldos[c.id] || 0,
                        ultima_compra: "-", // Placeholder
                    }));

                    setClientes(clientesFormatados);
                }
            }

            setLoading(false);
        }

        fetchData();
    }, [activeTab]);

    return (
        <div className="pb-24">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">Planilhas e Relatórios</h1>
                        <p className="text-sm text-[#64748b] mt-1">Visualize seus dados em tabela e exporte para Excel.</p>
                    </div>
                    <img src="/logo.png" alt="Mercado Farias" className="w-10 h-10 rounded-xl object-cover" />
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mt-4 w-full sm:w-max">
                    <button
                        onClick={() => setActiveTab("estoque")}
                        className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "estoque" ? "bg-white text-[#0ea5e9] shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"
                            }`}
                    >
                        Estoque
                    </button>
                    <button
                        onClick={() => setActiveTab("clientes")}
                        className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "clientes" ? "bg-white text-[#0ea5e9] shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"
                            }`}
                    >
                        Clientes
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="p-4 sm:p-6 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <span className="material-symbols-outlined animate-spin text-4xl text-[#0ea5e9]">progress_activity</span>
                        <p className="text-slate-500 mt-4 font-medium">Carregando dados...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        {activeTab === "estoque" ? (
                            <DataTable
                                columns={colunasProduto}
                                data={produtos}
                                searchColumn="nome"
                                searchPlaceholder="Buscar produto por nome..."
                                filename="Relatorio_Estoque"
                            />
                        ) : (
                            <DataTable
                                columns={colunasCliente}
                                data={clientes}
                                searchColumn="nome"
                                searchPlaceholder="Buscar cliente..."
                                filename="Relatorio_Devedores"
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
