-- =============================================
-- CondoOps - RESET PARA PRODUÇÃO
-- Execute este SQL no Supabase SQL Editor
-- Data: 2026-03-11
-- =============================================
-- ⚠️  ATENÇÃO: Este script remove TODOS os dados de teste
-- e prepara o sistema para uso em produção pelo cliente.
-- =============================================

-- 1. Limpar TODAS as tabelas (na ordem correta para respeitar foreign keys)
-- Primeiro: tabelas que referenciam system_users
TRUNCATE TABLE public.notifications RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.tickets RESTART IDENTITY CASCADE;

-- Depois: tabelas independentes
TRUNCATE TABLE public.inspections RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.equipments RESTART IDENTITY CASCADE;

-- Por último: tabela de usuários (referenciada por outras)
TRUNCATE TABLE public.system_users RESTART IDENTITY CASCADE;

-- =============================================
-- 2. Criar APENAS o usuário administrador inicial
-- O cliente deve alterar a senha após o primeiro login!
-- =============================================
INSERT INTO public.system_users (id, name, email, password, role, status, permissions, initials)
VALUES (
  'USR-001',
  'Administrador',
  'admin@condoops.com.br',
  'admin123',
  'Administrador',
  'active',
  ARRAY['dashboard','tickets','inspections','maintenance','financial','settings'],
  'AD'
);

-- =============================================
-- Verificação: Confirmar que o reset foi bem sucedido
-- =============================================
SELECT 'system_users' AS tabela, COUNT(*) AS registros FROM public.system_users
UNION ALL
SELECT 'tickets', COUNT(*) FROM public.tickets
UNION ALL
SELECT 'equipments', COUNT(*) FROM public.equipments
UNION ALL
SELECT 'inspections', COUNT(*) FROM public.inspections
UNION ALL
SELECT 'transactions', COUNT(*) FROM public.transactions
UNION ALL
SELECT 'notifications', COUNT(*) FROM public.notifications;
