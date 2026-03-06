-- ============================================
-- FIX: Desabilitar RLS para permitir acesso
-- do usuario autenticado (dono do sistema)
-- ============================================

-- Opcao 1: Desabilitar RLS completamente
-- (seguro porque o login ja protege o sistema)
ALTER TABLE mercados DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE itens_venda DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos DISABLE ROW LEVEL SECURITY;
