-- The BFF and fixture harness use the service_role client for backend-only
-- repository access. RLS bypass does not replace table privileges.
grant select, insert, update, delete on
  public.workspaces,
  public.workspace_members,
  public.marketing_projects,
  public.project_brief_revisions,
  public.project_artifacts,
  public.campaign_plan_revisions,
  public.ads_weekly_panels,
  public.ads_weekly_panel_events,
  public.human_decisions
to service_role;
