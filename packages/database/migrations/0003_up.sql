BEGIN;

CREATE TABLE identity.person_owner (
  issuer text NOT NULL,
  subject uuid NOT NULL,
  person_id uuid NOT NULL UNIQUE REFERENCES identity.person(id),
  disabled_at timestamptz,
  PRIMARY KEY (issuer, subject)
);

ALTER TABLE health.fact ADD COLUMN verification_revision bigint NOT NULL DEFAULT 0
  CHECK (verification_revision >= 0);

CREATE TABLE health.sleep_verification_event (
  person_id uuid NOT NULL,
  fact_id uuid NOT NULL,
  from_revision bigint NOT NULL CHECK (from_revision >= 0),
  issuer text NOT NULL,
  subject uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('confirm', 'revoke')),
  policy_version text NOT NULL,
  revision_fingerprint text NOT NULL,
  supports jsonb NOT NULL CHECK (jsonb_typeof(supports) = 'array'),
  decided_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (person_id, fact_id, from_revision),
  FOREIGN KEY (person_id, fact_id) REFERENCES health.fact(person_id, id)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'myphisys_sleep_verifier') THEN
    CREATE ROLE myphisys_sleep_verifier NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA identity, health, source TO myphisys_sleep_verifier;
GRANT SELECT (issuer, subject, person_id, disabled_at)
  ON identity.person_owner TO myphisys_sleep_verifier;
-- FOR SHARE needs a column UPDATE grant. WITH CHECK disallows changes to the link.
GRANT UPDATE (disabled_at) ON identity.person_owner TO myphisys_sleep_verifier;
GRANT SELECT (id, person_id, concept_id, kind, state, effective, value, verification,
              verification_revision, epistemic)
  ON health.fact TO myphisys_sleep_verifier;
GRANT UPDATE (verification, verification_revision) ON health.fact TO myphisys_sleep_verifier;
GRANT SELECT (person_id, fact_id, from_revision, action, revision_fingerprint),
  INSERT (person_id, fact_id, from_revision, issuer, subject, action, policy_version,
          revision_fingerprint, supports)
  ON health.sleep_verification_event TO myphisys_sleep_verifier;
GRANT SELECT (person_id, fact_id, raw_id, transformation)
  ON health.provenance TO myphisys_sleep_verifier;
GRANT SELECT (person_id, existing_fact_id, state)
  ON health.conflict TO myphisys_sleep_verifier;
GRANT SELECT (id, person_id, connector_id)
  ON source.source TO myphisys_sleep_verifier;
GRANT SELECT (id, person_id, source_id)
  ON source.record TO myphisys_sleep_verifier;
GRANT SELECT (id, person_id, record_id, version, operation)
  ON source.raw_record TO myphisys_sleep_verifier;
GRANT SELECT (id, person_id, raw_id)
  ON source.quarantine TO myphisys_sleep_verifier;

ALTER TABLE identity.person_owner ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.person_owner FORCE ROW LEVEL SECURITY;
CREATE POLICY actor_scope_sleep_verifier ON identity.person_owner
  FOR SELECT TO myphisys_sleep_verifier
  USING (issuer = current_setting('app.verification_issuer', true)
    AND subject = nullif(current_setting('app.verification_subject', true), '')::uuid);
CREATE POLICY actor_lock_sleep_verifier ON identity.person_owner
  FOR UPDATE TO myphisys_sleep_verifier
  USING (issuer = current_setting('app.verification_issuer', true)
    AND subject = nullif(current_setting('app.verification_subject', true), '')::uuid)
  WITH CHECK (false);

CREATE POLICY person_scope_sleep_verifier ON health.fact TO myphisys_sleep_verifier
  USING (person_id = nullif(current_setting('app.person_id', true), '')::uuid
    AND concept_id = 'sleep_duration' AND kind = 'observation' AND state = 'current'
    AND epistemic = 'user_reported' AND effective->>'kind' = 'local_date'
    AND verification IN ('unverified', 'user_verified'));

ALTER TABLE health.sleep_verification_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.sleep_verification_event FORCE ROW LEVEL SECURITY;
CREATE POLICY person_scope_sleep_verifier ON health.sleep_verification_event
  TO myphisys_sleep_verifier
  USING (person_id = nullif(current_setting('app.person_id', true), '')::uuid
    AND issuer = current_setting('app.verification_issuer', true)
    AND subject = nullif(current_setting('app.verification_subject', true), '')::uuid);

DO $$ DECLARE tab text; BEGIN
  FOREACH tab IN ARRAY ARRAY[
    'health.provenance', 'health.conflict', 'source.source', 'source.record',
    'source.raw_record', 'source.quarantine'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY person_scope_sleep_verifier ON %s FOR SELECT TO myphisys_sleep_verifier USING (person_id = nullif(current_setting(''app.person_id'', true), '''')::uuid)',
      tab
    );
  END LOOP;
END $$;

COMMIT;
