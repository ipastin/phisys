BEGIN;

DO $$
DECLARE
  tab text;
  analytics_role name;
BEGIN
  SELECT role_name INTO STRICT analytics_role
    FROM pg_catalog.pg_policies
    CROSS JOIN LATERAL unnest(roles) AS policy_role(role_name)
    WHERE schemaname = 'health' AND tablename = 'fact'
      AND policyname = 'person_scope_analytics'
      AND role_name IN ('phisys_analytics', 'myphisys_analytics');

  FOREACH tab IN ARRAY ARRAY[
    'health.fact', 'health.provenance', 'health.conflict',
    'source.source', 'source.record', 'source.raw_record', 'source.quarantine'
  ] LOOP
    EXECUTE format('DROP POLICY person_scope_analytics ON %s', tab);
  END LOOP;

  EXECUTE format('REVOKE SELECT (id, person_id, concept_id, state, effective, value, verification, epistemic)
  ON health.fact FROM %I', analytics_role);
  EXECUTE format('REVOKE SELECT (person_id, fact_id, raw_id, transformation)
  ON health.provenance FROM %I', analytics_role);
  EXECUTE format('REVOKE SELECT (person_id, existing_fact_id, state)
  ON health.conflict FROM %I', analytics_role);
  EXECUTE format('REVOKE SELECT (id, person_id, connector_id)
  ON source.source FROM %I', analytics_role);
  EXECUTE format('REVOKE SELECT (id, person_id, source_id)
  ON source.record FROM %I', analytics_role);
  EXECUTE format('REVOKE SELECT (id, person_id, record_id, version, operation)
  ON source.raw_record FROM %I', analytics_role);
  EXECUTE format('REVOKE SELECT (id, person_id, raw_id)
  ON source.quarantine FROM %I', analytics_role);
  EXECUTE format('REVOKE USAGE ON SCHEMA health, source FROM %I', analytics_role);
END $$;

-- shortcut: roles are cluster-wide; retain this unprivileged role on rollback.

COMMIT;
