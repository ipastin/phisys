BEGIN;

-- Let the table owner reset statuses before their audit evidence is removed.
ALTER TABLE health.fact NO FORCE ROW LEVEL SECURITY;
ALTER TABLE health.sleep_verification_event NO FORCE ROW LEVEL SECURITY;

UPDATE health.fact f SET verification = 'unverified'
WHERE f.verification = 'user_verified' AND EXISTS (
  SELECT 1 FROM health.sleep_verification_event e
  WHERE e.person_id = f.person_id AND e.fact_id = f.id
);

ALTER TABLE health.fact FORCE ROW LEVEL SECURITY;

DO $$ DECLARE tab text; BEGIN
  FOREACH tab IN ARRAY ARRAY[
    'health.fact', 'health.provenance', 'health.conflict', 'source.source',
    'source.record', 'source.raw_record', 'source.quarantine'
  ] LOOP
    EXECUTE format('DROP POLICY person_scope_sleep_verifier ON %s', tab);
  END LOOP;
END $$;

REVOKE SELECT (id, person_id, concept_id, kind, state, effective, value, verification,
               verification_revision, epistemic),
  UPDATE (verification, verification_revision)
  ON health.fact FROM myphisys_sleep_verifier;
REVOKE SELECT (person_id, fact_id, raw_id, transformation)
  ON health.provenance FROM myphisys_sleep_verifier;
REVOKE SELECT (person_id, existing_fact_id, state)
  ON health.conflict FROM myphisys_sleep_verifier;
REVOKE SELECT (id, person_id, connector_id)
  ON source.source FROM myphisys_sleep_verifier;
REVOKE SELECT (id, person_id, source_id)
  ON source.record FROM myphisys_sleep_verifier;
REVOKE SELECT (id, person_id, record_id, version, operation)
  ON source.raw_record FROM myphisys_sleep_verifier;
REVOKE SELECT (id, person_id, raw_id)
  ON source.quarantine FROM myphisys_sleep_verifier;
REVOKE USAGE ON SCHEMA identity, health, source FROM myphisys_sleep_verifier;

DROP TABLE health.sleep_verification_event;
ALTER TABLE health.fact DROP COLUMN verification_revision;
DROP TABLE identity.person_owner;
-- The now-unprivileged cluster-wide role is retained, as with migration 0002.

COMMIT;
