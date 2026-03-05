-- ============================================
-- G.M.C - Migration SQL
-- Execute no Supabase SQL Editor
-- ============================================

-- Mercados
CREATE TABLE IF NOT EXISTS mercados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#0ea5e9',
  telefone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mercado_id UUID REFERENCES mercados(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mercado_id UUID REFERENCES mercados(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  estoque INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 5,
  validade DATE,
  categoria TEXT,
  unidade TEXT DEFAULT 'Un',
  marca TEXT,
  imagem_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendas
CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mercado_id UUID REFERENCES mercados(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  tipo TEXT CHECK (tipo IN ('pago', 'fiado', 'parcial')),
  sinal DECIMAL(10,2) DEFAULT 0,
  forma_pagamento TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Itens da Venda
CREATE TABLE IF NOT EXISTS itens_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- Pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mercado_id UUID REFERENCES mercados(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id),
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Desabilitar RLS (sem login necessário)
-- ============================================
ALTER TABLE mercados ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (anon pode tudo)
CREATE POLICY "anon_all_mercados" ON mercados FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_clientes" ON clientes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_produtos" ON produtos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_vendas" ON vendas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_itens_venda" ON itens_venda FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_pagamentos" ON pagamentos FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- Dados iniciais
-- ============================================
INSERT INTO mercados (nome, telefone)
VALUES ('Mercado Farias', '(11) 99999-9999');
