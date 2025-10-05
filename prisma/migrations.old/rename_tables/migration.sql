-- Renommer avec le nom correct (D majuscule) - idempotent
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Demolead') THEN
    ALTER TABLE "Demolead" RENAME TO "sys_demo_lead";
  END IF;
END $$;
