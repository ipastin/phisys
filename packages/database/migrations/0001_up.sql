BEGIN;

CREATE SCHEMA identity;
CREATE SCHEMA source;
CREATE SCHEMA health;
CREATE SCHEMA jobs;

CREATE TABLE identity.person (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT person_uuidv7 CHECK (substring(id::text, 15, 1) = '7')
);

CREATE TABLE source.source (
  id uuid PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES identity.person(id),
  connector_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, id),
  UNIQUE (person_id, connector_id),
  CONSTRAINT source_uuidv7 CHECK (substring(id::text, 15, 1) = '7')
);

CREATE TABLE source.record (
  id uuid PRIMARY KEY,
  person_id uuid NOT NULL,
  source_id uuid NOT NULL,
  external_record_id text NOT NULL,
  UNIQUE (person_id, id),
  UNIQUE (person_id, source_id, external_record_id),
  FOREIGN KEY (person_id, source_id) REFERENCES source.source(person_id, id),
  CONSTRAINT record_uuidv7 CHECK (substring(id::text, 15, 1) = '7')
);

CREATE TABLE source.raw_record (
  id uuid PRIMARY KEY,
  person_id uuid NOT NULL,
  record_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  operation text NOT NULL CHECK (operation IN ('upsert', 'delete', 'unknown')),
  payload jsonb NOT NULL,
  content_hash text NOT NULL,
  recorded_at timestamptz,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, id),
  UNIQUE (person_id, record_id, version, content_hash),
  FOREIGN KEY (person_id, record_id) REFERENCES source.record(person_id, id),
  CONSTRAINT raw_uuidv7 CHECK (substring(id::text, 15, 1) = '7')
);

CREATE FUNCTION source.reject_raw_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Raw records are immutable';
END $$;
CREATE TRIGGER raw_immutable BEFORE UPDATE OR DELETE ON source.raw_record
  FOR EACH ROW EXECUTE FUNCTION source.reject_raw_mutation();

CREATE TABLE source.quarantine (
  id uuid PRIMARY KEY,
  person_id uuid NOT NULL,
  raw_id uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, raw_id),
  FOREIGN KEY (person_id, raw_id) REFERENCES source.raw_record(person_id, id)
);

CREATE TABLE health.concept (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('observation', 'symptom'))
);

CREATE TABLE health.fact (
  id uuid PRIMARY KEY,
  person_id uuid NOT NULL,
  concept_id text NOT NULL REFERENCES health.concept(id),
  kind text NOT NULL CHECK (kind IN ('observation', 'symptom')),
  value jsonb NOT NULL,
  effective jsonb NOT NULL,
  recorded_at timestamptz NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  epistemic text NOT NULL CHECK (epistemic IN ('source_recorded', 'user_reported', 'normalized', 'calculated', 'disputed', 'unknown')),
  verification text NOT NULL CHECK (verification IN ('source_verified', 'user_verified', 'system_verified', 'unverified')),
  state text NOT NULL CHECK (state IN ('current', 'superseded', 'invalidated', 'needs_review')),
  event_key text,
  supersedes_id uuid,
  origin_raw_id uuid NOT NULL,
  UNIQUE (person_id, id),
  FOREIGN KEY (person_id, supersedes_id) REFERENCES health.fact(person_id, id),
  FOREIGN KEY (person_id, origin_raw_id) REFERENCES source.raw_record(person_id, id),
  CONSTRAINT fact_uuidv7 CHECK (substring(id::text, 15, 1) = '7')
);
CREATE UNIQUE INDEX one_current_event ON health.fact(person_id, event_key)
  WHERE event_key IS NOT NULL AND state = 'current';

CREATE TABLE health.provenance (
  person_id uuid NOT NULL,
  fact_id uuid NOT NULL,
  raw_id uuid NOT NULL,
  transformation text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (person_id, fact_id, raw_id),
  FOREIGN KEY (person_id, fact_id) REFERENCES health.fact(person_id, id),
  FOREIGN KEY (person_id, raw_id) REFERENCES source.raw_record(person_id, id)
);

CREATE TABLE health.conflict (
  id uuid PRIMARY KEY,
  person_id uuid NOT NULL,
  event_key text NOT NULL,
  existing_fact_id uuid NOT NULL,
  incoming_raw_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('value_conflict', 'status_conflict', 'date_conflict', 'source_conflict', 'identity_conflict', 'semantic_conflict')),
  state text NOT NULL DEFAULT 'unresolved' CHECK (state IN ('unresolved', 'resolved')),
  FOREIGN KEY (person_id, existing_fact_id) REFERENCES health.fact(person_id, id),
  FOREIGN KEY (person_id, incoming_raw_id) REFERENCES source.raw_record(person_id, id)
);

CREATE TABLE health.event (
  person_id uuid NOT NULL,
  fact_id uuid NOT NULL,
  kind text NOT NULL,
  effective jsonb NOT NULL,
  PRIMARY KEY (person_id, fact_id),
  FOREIGN KEY (person_id, fact_id) REFERENCES health.fact(person_id, id)
);

CREATE TABLE jobs.outbox (
  id uuid PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES identity.person(id),
  event_key text NOT NULL,
  type text NOT NULL,
  ref_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, event_key)
);

INSERT INTO health.concept (id, kind) VALUES
  ('sleep_duration', 'observation'), ('heart_rate', 'observation'),
  ('steps', 'observation'), ('weight', 'observation'),
  ('systolic_bp', 'observation'), ('diastolic_bp', 'observation'),
  ('glucose', 'observation'), ('body_temperature', 'observation'),
  ('symptom', 'symptom');

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'myphisys_connector') THEN CREATE ROLE myphisys_connector NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'myphisys_domain') THEN CREATE ROLE myphisys_domain NOLOGIN; END IF;
END $$;
GRANT USAGE ON SCHEMA identity, source, health, jobs TO myphisys_domain;
GRANT USAGE ON SCHEMA identity, source TO myphisys_connector;
GRANT SELECT ON identity.person TO myphisys_connector, myphisys_domain;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA source TO myphisys_connector;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA source TO myphisys_domain;
GRANT SELECT ON health.concept TO myphisys_domain;
GRANT SELECT, INSERT, UPDATE ON health.fact TO myphisys_domain;
GRANT SELECT, INSERT ON health.provenance, health.conflict, health.event TO myphisys_domain;
GRANT SELECT, INSERT ON jobs.outbox TO myphisys_domain;

ALTER TABLE identity.person ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.person FORCE ROW LEVEL SECURITY;
CREATE POLICY person_scope ON identity.person FOR ALL TO myphisys_connector, myphisys_domain
  USING (id = nullif(current_setting('app.person_id', true), '')::uuid)
  WITH CHECK (id = nullif(current_setting('app.person_id', true), '')::uuid);

DO $$ DECLARE tab text; BEGIN
  FOREACH tab IN ARRAY ARRAY['source.source', 'source.record', 'source.raw_record', 'source.quarantine', 'health.fact', 'health.provenance', 'health.conflict', 'health.event', 'jobs.outbox'] LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tab);
    EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', tab);
    EXECUTE format('CREATE POLICY person_scope ON %s FOR ALL TO myphisys_connector, myphisys_domain USING (person_id = nullif(current_setting(''app.person_id'', true), '''')::uuid) WITH CHECK (person_id = nullif(current_setting(''app.person_id'', true), '''')::uuid)', tab);
  END LOOP;
END $$;

COMMIT;
