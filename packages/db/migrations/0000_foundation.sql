-- M0 foundation. Business tables start in M1.

-- Schema for reporting SQL views (RPT-*, populated from M9).
CREATE SCHEMA IF NOT EXISTS reporting;
--> statement-breakpoint

-- UUIDv7 for server-side defaults (CLAUDE.md rule 3). Clients may supply their own v7 ids.
-- Layout: 48-bit Unix ms timestamp | version 7 | 12 random bits | variant 10 | 62 random bits.
-- Randomness comes from gen_random_uuid() (core since PG13), so pgcrypto is not required.
CREATE OR REPLACE FUNCTION public.uuid_generate_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
DECLARE
  b bytea := substring(int8send((extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3)
             || substring(uuid_send(gen_random_uuid()) FROM 7 FOR 10);
BEGIN
  b := set_byte(b, 6, (get_byte(b, 6) & 15) | 112);  -- version 7
  b := set_byte(b, 8, (get_byte(b, 8) & 63) | 128);  -- RFC 4122 variant
  RETURN encode(b, 'hex')::uuid;
END
$$;
