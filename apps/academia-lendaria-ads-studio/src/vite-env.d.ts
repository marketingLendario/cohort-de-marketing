/// <reference types="vite/client" />

/**
 * Tipagem das env vars públicas do client (NFR14 — TS strict, sem `any`).
 * Apenas chaves públicas: anon key é público por design; service_role NUNCA
 * aparece no client (NFR5/NFR10).
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DEMO_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
