import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase RLS-aware (AC1/AC2/AC3 — STORY-AL-ADS-1.2).
 *
 * Opera SOB A IDENTIDADE DO USUÁRIO: anon key (público por design) + o JWT da
 * sessão do usuário, que `supabase-js` injeta automaticamente em cada request
 * após `auth.signInWithPassword`. Assim a RLS (`auth.uid()` × `workspace_members`)
 * aplica no backend — dados de outro spoke nunca retornam (R7, prova @db-sage 6/6).
 *
 * NUNCA service_role aqui (NFR5/NFR10 — segredos só backend). O isolamento NÃO é
 * reimplementado no front: ele vem da RLS. O front apenas passa o contexto
 * (workspace_id ativo) e roda como o usuário autenticado.
 *
 * REUSE: `@sinkra/supabase-client` foi avaliado (DEFER em STORY-AL-ADS-0c.4) e
 * não existe no monorepo — usamos `@supabase/supabase-js` direto com este wrapper.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Falha cedo e clara em vez de um 401 opaco em runtime.
  throw new Error(
    '[supabase] VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios. ' +
      'Copie .env.example para .env e preencha (anon key é público; service_role NUNCA).',
  );
}

/**
 * Singleton: `persistSession` mantém o usuário logado entre reloads;
 * `autoRefreshToken` renova o JWT antes de expirar. O JWT da sessão é anexado
 * a toda query, fazendo a RLS rodar sob a identidade do usuário.
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
