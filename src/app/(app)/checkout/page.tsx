"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const totalVenda = parseFloat(searchParams.get("total") || "150");
    const tipoInicial = searchParams.get("tipo") || "pago";

    const [tipoPagamento, setTipoPagamento] = useState<"total" | "parcial">(
        tipoInicial === "fiado" ? "parcial" : "total"
    );
    const [sinal, setSinal] = useState(tipoPagamento === "parcial" ? 50 : totalVenda);
    const [formaPagamento, setFormaPagamento] = useState("dinheiro");

    const restanteFiado = Math.max(0, totalVenda - sinal);

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <header className="bg-white px-4 pt-12 pb-5">
                <div className="flex items-center gap-4">
                    <a href="/caixa" className="text-[#64748b]">
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </a>
                    <h1 className="text-xl font-bold text-[#0f172a]">
                        Checkout - Mercado Farias
                    </h1>
                </div>
            </header>

            <main className="px-5 py-6 space-y-6">
                {/* Resumo do Pedido */}
                <section>
                    <h2 className="text-xl font-bold text-[#0f172a] mb-4">Resumo do Pedido</h2>
                    <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-sm text-[#64748b] font-medium">Total da Venda</p>
                            <p className="text-3xl font-bold text-[#0ea5e9]">
                                R$ {totalVenda.toFixed(2).replace(".", ",")}
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-[#0ea5e9]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#0ea5e9] text-3xl">
                                shopping_bag
                            </span>
                        </div>
                    </div>
                </section>

                {/* Tipo de Pagamento */}
                <section>
                    <h3 className="text-lg font-bold text-[#0f172a] mb-3">Tipo de Pagamento</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setTipoPagamento("total"); setSinal(totalVenda); }}
                            className={`py-3 rounded-2xl text-sm font-bold transition-all ${tipoPagamento === "total"
                                    ? "bg-[#0f172a] text-white"
                                    : "bg-white text-[#64748b] border border-slate-200"
                                }`}
                        >
                            Pagamento Total
                        </button>
                        <button
                            onClick={() => { setTipoPagamento("parcial"); setSinal(50); }}
                            className={`py-3 rounded-2xl text-sm font-bold transition-all ${tipoPagamento === "parcial"
                                    ? "bg-[#0ea5e9] text-white"
                                    : "bg-white text-[#64748b] border border-slate-200"
                                }`}
                        >
                            Fiado / Parcial
                        </button>
                    </div>
                </section>

                {/* Sinal / Entrada */}
                {tipoPagamento === "parcial" && (
                    <section className="bg-white rounded-2xl p-5 shadow-sm border-2 border-[#0ea5e9]/20">
                        <p className="text-sm font-semibold text-[#0ea5e9] mb-3">Sinal / Entrada (R$)</p>
                        <div className="flex items-center gap-2 border-2 border-[#0ea5e9]/30 rounded-xl px-4 py-3">
                            <span className="text-[#64748b] text-lg font-semibold">R$</span>
                            <input
                                type="number"
                                value={sinal}
                                onChange={(e) => setSinal(Math.max(0, Math.min(totalVenda, parseFloat(e.target.value) || 0)))}
                                className="flex-1 text-3xl font-bold text-[#0f172a] border-none focus:ring-0 bg-transparent p-0"
                                step="0.01"
                            />
                        </div>
                        <div className="mt-3 flex items-center gap-2 bg-[#f1f5f9] rounded-xl px-4 py-3">
                            <span className="material-symbols-outlined text-[#f59e0b]">credit_score</span>
                            <span className="text-sm text-[#0f172a]">
                                Restante para o Fiado:{" "}
                                <strong className="text-[#0f172a]">
                                    R$ {restanteFiado.toFixed(2).replace(".", ",")}
                                </strong>
                            </span>
                        </div>
                    </section>
                )}

                {/* Forma de Pagamento */}
                <section>
                    <h3 className="text-lg font-bold text-[#0f172a] mb-3">
                        Forma de Pagamento {tipoPagamento === "parcial" ? "da Entrada" : ""}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: "dinheiro", icon: "payments", label: "Dinheiro" },
                            { id: "cartao", icon: "credit_card", label: "Cartão" },
                            { id: "pix", icon: "qr_code_2", label: "Pix" },
                        ].map((forma) => (
                            <button
                                key={forma.id}
                                onClick={() => setFormaPagamento(forma.id)}
                                className={`py-4 rounded-2xl flex flex-col items-center gap-2 text-sm font-semibold transition-all ${formaPagamento === forma.id
                                        ? "bg-[#0ea5e9]/10 text-[#0ea5e9] border-2 border-[#0ea5e9]"
                                        : "bg-white text-[#64748b] border border-slate-200"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-2xl">{forma.icon}</span>
                                {forma.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Confirmar Venda */}
                <button className="w-full bg-[#10b981] hover:bg-[#059669] text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-base shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]">
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                    Confirmar Venda
                </button>

                {tipoPagamento === "parcial" && restanteFiado > 0 && (
                    <p className="text-center text-sm text-[#64748b]">
                        O valor de R$ {restanteFiado.toFixed(2).replace(".", ",")} será registrado na conta do
                        cliente.
                    </p>
                )}
            </main>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><span className="material-symbols-outlined text-4xl text-[#0ea5e9] animate-spin">progress_activity</span></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
