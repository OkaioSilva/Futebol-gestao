-- Reset completo do conteúdo gerenciado pela aplicação (não apaga esquema/roles)
-- ATENÇÃO: isso remove jogadores, transações, convites e perfis — use apenas se souber o que faz.

BEGIN;

DELETE FROM public.transactions;
DELETE FROM public.players;
DELETE FROM public.admin_invites;
DELETE FROM public.profiles;
DELETE FROM public.game_days;

-- Re-cria os dias com os valores seeds padrão (ajuste se precisar)
INSERT INTO public.game_days (slug, name, monthly_fee) VALUES
  ('terca',  'Terça-feira',  50.00),
  ('quarta', 'Quarta-feira', 50.00)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
