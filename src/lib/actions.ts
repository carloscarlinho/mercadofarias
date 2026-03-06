import { createClient } from './supabase';
import type { Produto, Cliente, Venda, ItemVenda, Pagamento } from './types';

function getSupabase() {
    return createClient();
}

// ============================================
// MERCADO
// ============================================

export async function getMercadoId(): Promise<string> {
    const { data, error } = await getSupabase()
        .from('mercados')
        .select('id')
        .limit(1);

    if (error) {
        console.error("Erro ao buscar mercado:", error);
    }

    return data && data.length > 0 ? data[0].id : '';
}

// ============================================
// PRODUTOS
// ============================================

export async function getProdutos(mercadoId: string) {
    const { data, error } = await getSupabase()
        .from('produtos')
        .select('*')
        .eq('mercado_id', mercadoId)
        .order('nome');
    if (error) throw error;
    return data as Produto[];
}

export async function criarProduto(produto: Partial<Produto>) {
    const { data, error } = await getSupabase()
        .from('produtos')
        .insert(produto)
        .select()
        .single();
    if (error) throw error;
    return data as Produto;
}

export async function atualizarProduto(id: string, updates: Partial<Produto>) {
    const { data, error } = await getSupabase()
        .from('produtos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Produto;
}

export async function deletarProduto(id: string) {
    const { error } = await getSupabase().from('produtos').delete().eq('id', id);
    if (error) throw error;
}

export async function atualizarEstoque(id: string, novoEstoque: number) {
    const { error } = await getSupabase()
        .from('produtos')
        .update({ estoque: novoEstoque })
        .eq('id', id);
    if (error) throw error;
}

// ============================================
// CLIENTES
// ============================================

export async function getClientes(mercadoId: string) {
    const { data, error } = await getSupabase()
        .from('clientes')
        .select('*')
        .eq('mercado_id', mercadoId)
        .order('nome');
    if (error) throw error;
    return data as Cliente[];
}

export async function getCliente(id: string) {
    const { data, error } = await getSupabase()
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data as Cliente;
}

export async function criarCliente(cliente: Partial<Cliente>) {
    const { data, error } = await getSupabase()
        .from('clientes')
        .insert(cliente)
        .select()
        .single();
    if (error) throw error;
    return data as Cliente;
}

export async function atualizarCliente(id: string, updates: Partial<Cliente>) {
    const { data, error } = await getSupabase()
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Cliente;
}

export async function deletarCliente(id: string) {
    const { error } = await getSupabase().from('clientes').delete().eq('id', id);
    if (error) throw error;
}

// ============================================
// VENDAS
// ============================================

export async function registrarVenda(
    mercadoId: string,
    clienteId: string | null,
    itens: { produto_id: string; quantidade: number; preco_unitario: number }[],
    total: number,
    tipo: 'pago' | 'fiado' | 'parcial',
    sinal: number,
    formaPagamento: string
) {
    // 1. Criar venda
    const { data: venda, error: vendaError } = await getSupabase()
        .from('vendas')
        .insert({
            mercado_id: mercadoId,
            cliente_id: clienteId,
            total,
            tipo,
            sinal,
            forma_pagamento: formaPagamento,
        })
        .select()
        .single();
    if (vendaError) throw vendaError;

    // 2. Criar itens da venda
    const itensVenda = itens.map((item) => ({
        venda_id: venda.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
    }));
    const { error: itensError } = await getSupabase().from('itens_venda').insert(itensVenda);
    if (itensError) throw itensError;

    // 3. Baixar estoque de cada produto
    for (const item of itens) {
        const { data: produto } = await getSupabase()
            .from('produtos')
            .select('estoque')
            .eq('id', item.produto_id)
            .single();
        if (produto) {
            await getSupabase()
                .from('produtos')
                .update({ estoque: Math.max(0, produto.estoque - item.quantidade) })
                .eq('id', item.produto_id);
        }
    }

    return venda as Venda;
}

export async function getVendasDoDia(mercadoId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const { data, error } = await getSupabase()
        .from('vendas')
        .select('*')
        .eq('mercado_id', mercadoId)
        .gte('created_at', hoje.toISOString())
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Venda[];
}

// ============================================
// PAGAMENTOS
// ============================================

export async function registrarPagamento(
    mercadoId: string,
    clienteId: string,
    valor: number,
    formaPagamento: string
) {
    const { data, error } = await getSupabase()
        .from('pagamentos')
        .insert({
            mercado_id: mercadoId,
            cliente_id: clienteId,
            valor,
            forma_pagamento: formaPagamento,
        })
        .select()
        .single();
    if (error) throw error;
    return data as Pagamento;
}

// ============================================
// EXTRATO DO CLIENTE (vendas fiado + pagamentos)
// ============================================

export async function getExtratoCliente(clienteId: string) {
    // Vendas fiado do cliente
    const { data: vendas } = await getSupabase()
        .from('vendas')
        .select('*, itens_venda(*, produtos(nome))')
        .eq('cliente_id', clienteId)
        .in('tipo', ['fiado', 'parcial'])
        .order('created_at', { ascending: false });

    // Pagamentos do cliente
    const { data: pagamentos } = await getSupabase()
        .from('pagamentos')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

    return { vendas: vendas || [], pagamentos: pagamentos || [] };
}

export async function getSaldoDevedor(clienteId: string): Promise<number> {
    // Total fiado (soma dos fiados)
    const { data: vendas } = await getSupabase()
        .from('vendas')
        .select('total, sinal, tipo')
        .eq('cliente_id', clienteId)
        .in('tipo', ['fiado', 'parcial']);

    const totalFiado = (vendas || []).reduce((acc: number, v: { tipo: string; total: number; sinal: number }) => {
        if (v.tipo === 'fiado') return acc + Number(v.total);
        if (v.tipo === 'parcial') return acc + (Number(v.total) - Number(v.sinal));
        return acc;
    }, 0);

    // Total pagamentos
    const { data: pagamentos } = await getSupabase()
        .from('pagamentos')
        .select('valor')
        .eq('cliente_id', clienteId);

    const totalPago = (pagamentos || []).reduce((acc: number, p: { valor: number }) => acc + Number(p.valor), 0);

    return Math.max(0, totalFiado - totalPago);
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats(mercadoId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Vendas do dia
    const { data: vendasHoje } = await getSupabase()
        .from('vendas')
        .select('total')
        .eq('mercado_id', mercadoId)
        .gte('created_at', hoje.toISOString());

    const vendas_dia = (vendasHoje || []).reduce((acc: number, v: { total: number }) => acc + Number(v.total), 0);
    const num_vendas = vendasHoje?.length || 0;
    const ticket_medio = num_vendas > 0 ? vendas_dia / num_vendas : 0;

    // Produtos com estoque baixo
    const { data: estoqueBaixo } = await getSupabase()
        .from('produtos')
        .select('*')
        .eq('mercado_id', mercadoId)
        .filter('estoque', 'lte', 'estoque_minimo');

    // Produtos vencendo em 30 dias
    const em30dias = new Date();
    em30dias.setDate(em30dias.getDate() + 30);
    const { data: vencendo } = await getSupabase()
        .from('produtos')
        .select('*')
        .eq('mercado_id', mercadoId)
        .not('validade', 'is', null)
        .lte('validade', em30dias.toISOString().split('T')[0]);

    return {
        vendas_dia,
        num_vendas,
        ticket_medio,
        alertas_estoque: estoqueBaixo || [],
        alertas_validade: vencendo || [],
    };
}
