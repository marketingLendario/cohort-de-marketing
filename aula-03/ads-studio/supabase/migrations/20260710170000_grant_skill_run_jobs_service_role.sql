-- The backend worker uses the service_role client for the durable journal.
-- RLS bypass does not replace table privileges, so grant the DML explicitly.
grant select, insert, update, delete on public.skill_run_jobs to service_role;
