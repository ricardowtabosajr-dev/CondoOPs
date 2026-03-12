-- =============================================
-- CondoOps - Setup Completo do Banco de Dados
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. Tabela de Usuários do Sistema
CREATE TABLE IF NOT EXISTS public.system_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Operador',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  permissions TEXT[] NOT NULL DEFAULT ARRAY['dashboard'],
  initials TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Chamados (Tickets)
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  inspection_id TEXT, -- Vínculo com a inspeção que gerou o chamado
  created_by TEXT REFERENCES public.system_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de Equipamentos (Manutenção)
CREATE TABLE IF NOT EXISTS public.equipments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'critical')),
  last_maintenance DATE,
  next_maintenance DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de Inspeções
CREATE TABLE IF NOT EXISTS public.inspections (
  id TEXT PRIMARY KEY,
  inspector TEXT NOT NULL,
  type TEXT NOT NULL,
  periodicity TEXT DEFAULT 'Mensal',
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  score INTEGER NOT NULL DEFAULT 0,
  areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela de Transações Financeiras
CREATE TABLE IF NOT EXISTS public.transactions (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  created_by TEXT REFERENCES public.system_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabela de Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  action_by TEXT NOT NULL,
  action_by_role TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  target_role TEXT DEFAULT 'Administrador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Dados Iniciais
-- =============================================

-- Usuários padrão
INSERT INTO public.system_users (id, name, email, password, role, status, permissions, initials) VALUES
  ('USR-001', 'Síndico Admin', 'admin@condovistaazul.com', 'admin123', 'Administrador', 'active', ARRAY['dashboard','tickets','inspections','maintenance','financial','settings'], 'SA'),
  ('USR-002', 'Carlos Silva', 'carlos@condovistaazul.com', '123456', 'Zelador', 'active', ARRAY['dashboard','tickets','maintenance'], 'CS'),
  ('USR-003', 'Maria Souza', 'maria@condovistaazul.com', '123456', 'Financeiro', 'active', ARRAY['dashboard','financial'], 'MS')
ON CONFLICT (id) DO NOTHING;

-- Chamados de exemplo
INSERT INTO public.tickets (id, title, description, status, priority) VALUES
  ('CH-001', 'Vazamento no apartamento 302', 'Morador reportou vazamento no banheiro', 'open', 'high'),
  ('CH-002', 'Lâmpada queimada — Hall B', 'Substituição necessária no corredor do Bloco B', 'open', 'medium')
ON CONFLICT (id) DO NOTHING;

-- Equipamentos de exemplo
INSERT INTO public.equipments (id, name, category, status, last_maintenance, next_maintenance) VALUES
  ('EQ-001', 'Bomba de Recalque #1', 'Hidráulica', 'operational', '2024-01-15', '2024-04-15'),
  ('EQ-002', 'Elevador Social A', 'Elevadores', 'maintenance', '2024-01-10', '2024-02-10'),
  ('EQ-003', 'Gerador Central', 'Elétrica', 'operational', '2024-01-20', '2024-04-20'),
  ('EQ-004', 'Central de CFTV', 'Segurança', 'critical', '2023-12-01', '2024-01-01')
ON CONFLICT (id) DO NOTHING;

-- Inspeções de exemplo
INSERT INTO public.inspections (id, inspector, type, periodicity, date, status, score, areas) VALUES
  ('INS-001', 'Carlos Silva', 'Diária', 'Diária', '15 Jan 2024', 'completed', 95, ARRAY['Hall','Elevadores','Garagem']),
  ('INS-002', 'Carlos Silva', 'Semanal', 'Semanal', '14 Jan 2024', 'completed', 88, ARRAY['Piscina','Salão','Jardim']),
  ('INS-003', 'Maria Souza', 'Mensal', 'Mensal', '10 Jan 2024', 'completed', 92, ARRAY['Reservatórios','Bombas']),
  ('INS-004', 'Carlos Silva', 'Diária', 'Diária', '16 Jan 2024', 'draft', 0, ARRAY['Hall','Portaria']),
  ('INS-005', 'Carlos Silva', 'Semanal', 'Semanal', '17 Jan 2024', 'draft', 0, ARRAY['Elétrica','Hidráulica'])
ON CONFLICT (id) DO NOTHING;

-- Transações financeiras de exemplo
INSERT INTO public.transactions (date, description, category, value, type) VALUES
  ('10 Jan', 'Manutenção Elevadores', 'Corretiva', '- R$ 2.800,00', 'out'),
  ('08 Jan', 'Contrato Limpeza', 'Fixo', '- R$ 4.500,00', 'out'),
  ('05 Jan', 'Taxa Condominial', 'Receita', '+ R$ 14.200,00', 'in'),
  ('03 Jan', 'Material Hidráulico', 'Preventiva', '- R$ 950,00', 'out'),
  ('01 Jan', 'Aluguel Salão Festas', 'Receita', '+ R$ 500,00', 'in');

-- =============================================
-- Habilitar Realtime nas tabelas de notificações
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =============================================
-- Row Level Security (RLS) - Políticas básicas
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (para a aplicação funcionar via anon key)
-- Em produção, integre com Supabase Auth para políticas mais restritivas

CREATE POLICY "Permitir leitura para todos" ON public.system_users FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.system_users FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura para todos" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.tickets FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura para todos" ON public.equipments FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.equipments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura para todos" ON public.inspections FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.inspections FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura para todos" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura para todos" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
