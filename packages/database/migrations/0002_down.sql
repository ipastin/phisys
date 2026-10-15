BEGIN;

DO $$ DECLARE tab text; BEGIN
  FOREACH tab IN ARRAY ARRAY[
    'health.fact', 'health.provenance', 'health.conflict',
    'source.source', 'source.record', 'source.raw_record', 'source.quarantine'
  ] LOOP
    EXECUTE format('DROP POLICY person_scope_analytics ON %s', tab);
  END LOOP;
END $$;

REVOKE SELECT (id, person_id, concept_id, state, effective, value, verification, epistemic)
  ON health.fact FROM myphisys_analytics;
REVOKE SELECT (person_id, fact_id, raw_id, transformation)
  ON health.provenance FROM myphisys_analytics;
REVOKE SELECT (person_id, existing_fact_id, state)
  ON health.conflict FROM myphisys_analytics;
REVOKE SELECT (id, person_id, connector_id)
  ON source.source FROM myphisys_analytics;
REVOKE SELECT (id, person_id, source_id)
  ON source.record FROM myphisys_analytics;
REVOKE SELECT (id, person_id, record_id, version, operation)
  ON source.raw_record FROM myphisys_analytics;
REVOKE SELECT (id, person_id, raw_id)
  ON source.quarantine FROM myphisys_analytics;
REVOKE USAGE ON SCHEMA health, source FROM myphisys_analytics;
-- shortcut: roles are cluster-wide; retain this unprivileged role on rollback.

COMMIT;
