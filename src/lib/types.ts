// ============================================
// G.M.C - Database Types
// ============================================

export interface Mercado {
  id: string;
  nome: string;
  logo_url?: string;
  cor_primaria: string;
  telefone?: string;
  created_at: string;
}

export interface Cliente {
  id: string;
  mercado_id: string;
  nome: string;
  telefone?: string;
  observacoes?: string;
  created_at: string;
  // Computed
  saldo_devedor?: number;
}

export interface Produto {
  id: string;
  mercado_id: string;
  nome: string;
  preco: number;
  estoque: number;
  estoque_minimo: number;
  validade?: string;
  categoria?: string;
  imagem_url?: string;
  unidade?: string;
  marca?: string;
  created_at: string;
}

export interface Venda {
  id: string;
  mercado_id: string;
  cliente_id?: string;
  total: number;
  tipo: 'pago' | 'fiado' | 'parcial';
  sinal: number;
  forma_pagamento?: string;
  created_at: string;
  // Relations
  cliente?: Cliente;
  itens?: ItemVenda[];
}

export interface ItemVenda {
  id: string;
  venda_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  // Relations
  produto?: Produto;
}

export interface Pagamento {
  id: string;
  mercado_id: string;
  cliente_id: string;
  valor: number;
  forma_pagamento: string;
  created_at: string;
  // Relations
  cliente?: Cliente;
}

// ============================================
// Cart/PDV Types
// ============================================

export interface CartItem {
  produto: Produto;
  quantidade: number;
}

export interface CartState {
  items: CartItem[];
  cliente_id?: string;
  cliente_nome?: string;
  total: number;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  vendas_dia: number;
  num_vendas: number;
  ticket_medio: number;
  variacao_vendas: number;
}

export interface AlertaEstoque {
  produto: Produto;
  tipo: 'baixo' | 'vencido' | 'vencendo';
}
