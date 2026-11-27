BEGIN;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'phisys_analytics'
      AND (rolcanlogin OR rolsuper OR rolcreaterole OR rolcreatedb OR rolreplication OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'Role phisys_analytics must be a non-login capability role';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'phisys_analytics') THEN
    CREATE ROLE phisys_analytics NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA health, source TO phisys_analytics;
GRANT SELECT (id, person_id, concept_id, state, effective, value, verification, epistemic)
  ON health.fact TO phisys_analytics;
GRANT SELECT (person_id, fact_id, raw_id, transformation)
  ON health.provenance TO phisys_analytics;
GRANT SELECT (person_id, existing_fact_id, state)
  ON health.conflict TO phisys_analytics;
GRANT SELECT (id, person_id, connector_id)
  ON source.source TO phisys_analytics;
GRANT SELECT (id, person_id, source_id)
  ON source.record TO phisys_analytics;
GRANT SELECT (id, person_id, record_id, version, operation)
  ON source.raw_record TO phisys_analytics;
GRANT SELECT (id, person_id, raw_id)
  ON source.quarantine TO phisys_analytics;

DO $$ DECLARE tab text; BEGIN
  FOREACH tab IN ARRAY ARRAY[
    'health.fact', 'health.provenance', 'health.conflict',
    'source.source', 'source.record', 'source.raw_record', 'source.quarantine'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY person_scope_analytics ON %s FOR SELECT TO phisys_analytics USING (person_id = nullif(current_setting(''app.person_id'', true), '''')::uuid)',
      tab
    );
  END LOOP;
END $$;

COMMIT;
