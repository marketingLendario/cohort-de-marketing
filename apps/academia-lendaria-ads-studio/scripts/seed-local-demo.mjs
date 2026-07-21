import { createTrafficPilotFixture, TRAFFIC_PILOT } from '../e2e/fixtures/traffic-pilot/fixture.mjs';

const DEMO_EMAIL = 'demo@academialendaria.local';
const DEMO_PASSWORD = 'adsfactory';

const fixture = await createTrafficPilotFixture();
const listed = await fixture.admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listed.error) throw new Error(`Falha listando usuários locais: ${listed.error.message}`);

const existing = listed.data.users.find((candidate) => candidate.email === DEMO_EMAIL);
const userResult = existing
  ? await fixture.admin.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD, email_confirm: true })
  : await fixture.admin.auth.admin.createUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true });
if (userResult.error || !userResult.data.user) {
  throw new Error(`Falha preparando usuário demo: ${userResult.error?.message ?? 'usuário ausente'}`);
}

const membership = await fixture.admin.from('workspace_members').upsert({
  workspace_id: TRAFFIC_PILOT.workspaceId,
  user_id: userResult.data.user.id,
  role: 'owner',
  created_at: new Date().toISOString(),
}, { onConflict: 'workspace_id,user_id' });
if (membership.error) throw new Error(`Falha vinculando usuário demo: ${membership.error.message}`);

process.stdout.write(`${JSON.stringify({
  ok: true,
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  projectId: TRAFFIC_PILOT.projectId,
  campaignId: TRAFFIC_PILOT.campaignId,
}, null, 2)}\n`);
