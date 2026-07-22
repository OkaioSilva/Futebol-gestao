-- Reset minimal: apaga todas as transações e limpa o estado derivado
-- Risco: histórico financeiro será removido. Execute com cautela.

BEGIN;

-- Apaga todo o histórico de lançamentos
DELETE FROM public.transactions;

-- Reseta o estado dos jogadores (remove last_transaction e marca como não pago)
UPDATE public.players
SET last_transaction_id = NULL,
    status = 'nao_pago',
    updated_at = now(),
    updated_by = NULL;

-- Limpa convites pendentes (opcional)
DELETE FROM public.admin_invites;

COMMIT;
