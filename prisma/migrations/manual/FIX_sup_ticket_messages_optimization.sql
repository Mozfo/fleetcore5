-- ============================================================================
-- FIX: sup_ticket_messages policy optimization
-- ============================================================================
-- Issue: La policy sup_ticket_messages n'a pas été optimisée lors de la
--        migration principale (47 policies)
-- Cause: PostgreSQL n'a pas appliqué le DROP/CREATE (erreur silencieuse?)
-- Solution: DROP + CREATE manuel avec optimisation
-- ============================================================================

-- Vérification AVANT (devrait retourner current_setting sans SELECT)
SELECT
  'AVANT FIX' as moment,
  policyname,
  qual
FROM pg_policies
WHERE policyname = 'tenant_isolation_sup_ticket_messages';

-- DROP la policy existante
DROP POLICY IF EXISTS tenant_isolation_sup_ticket_messages ON public.sup_ticket_messages;

-- CREATE avec optimisation (SELECT current_setting)
CREATE POLICY tenant_isolation_sup_ticket_messages ON public.sup_ticket_messages
FOR ALL TO authenticated
USING ((EXISTS ( SELECT 1
   FROM sup_tickets t
  WHERE ((t.id = sup_ticket_messages.ticket_id) AND (t.tenant_id = (SELECT current_setting('app.current_tenant_id'::text, true))::uuid)))))
WITH CHECK ((EXISTS ( SELECT 1
   FROM sup_tickets t
  WHERE ((t.id = sup_ticket_messages.ticket_id) AND (t.tenant_id = (SELECT current_setting('app.current_tenant_id'::text, true))::uuid)))));

-- Vérification APRÈS (devrait retourner SELECT current_setting)
SELECT
  'APRÈS FIX' as moment,
  policyname,
  qual,
  CASE
    WHEN qual LIKE '%SELECT current_setting%' THEN '✅ OPTIMISÉ'
    ELSE '❌ TOUJOURS PAS OPTIMISÉ'
  END as status
FROM pg_policies
WHERE policyname = 'tenant_isolation_sup_ticket_messages';

-- ============================================================================
-- Résultat attendu:
-- AVANT: qual contient "current_setting(...))::uuid)" (sans SELECT)
-- APRÈS: qual contient "SELECT current_setting(...))::uuid)" (avec SELECT)
-- Status: ✅ OPTIMISÉ
-- ============================================================================
