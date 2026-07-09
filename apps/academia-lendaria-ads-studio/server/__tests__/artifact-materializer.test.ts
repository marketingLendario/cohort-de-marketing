/**
 * STORY-8.W1.3 — testes do materializador atômico de artefatos.
 *
 * Cobre (AC6): markdown, JSON/YAML, idempotência, conflito, path traversal,
 * symlink escape e rollback sem corromper o arquivo canônico. Também exercita
 * o gate de integridade (expectedHash), o evento de auditoria serializável
 * (AC4) e a validação de slug (AC2).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, realpath, rm, stat, symlink, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ARTIFACT_WRITE_SCHEMA_VERSION,
  ArtifactMaterializerError,
  materializeArtifact,
  type ArtifactWriteRequest,
} from '../artifact-materializer.js';

const FIXED_NOW = () => new Date('2026-07-09T00:00:00.000Z');
const sha256 = (content: string) => createHash('sha256').update(content, 'utf8').digest('hex');

let projectsRoot: string;

beforeEach(async () => {
  projectsRoot = await mkdtemp(join(tmpdir(), 'artifact-materializer-'));
});

afterEach(async () => {
  // Restaura permissões que algum teste possa ter tornado read-only antes de limpar.
  await chmod(projectsRoot, 0o755).catch(() => {});
  await rm(projectsRoot, { recursive: true, force: true });
});

function request(overrides: Partial<ArtifactWriteRequest> = {}): ArtifactWriteRequest {
  return {
    schemaVersion: ARTIFACT_WRITE_SCHEMA_VERSION,
    projectSlug: 'cliente-x',
    relativePath: 'briefing.md',
    format: 'markdown',
    content: '# Briefing\n\nConteúdo canônico.\n',
    runId: 'run-001',
    ...overrides,
  };
}

describe('materializeArtifact — escrita canônica (AC3/AC4)', () => {
  it('grava markdown atomicamente e retorna before/after + auditoria', async () => {
    const req = request();
    const res = await materializeArtifact(req, { projectsRoot, now: FIXED_NOW });

    expect(res.outcome).toBe('written');
    expect(res.hashBefore).toBeNull();
    expect(res.hashAfter).toBe(sha256(req.content));
    expect(res.bytesWritten).toBe(Buffer.byteLength(req.content, 'utf8'));

    const written = await readFile(join(projectsRoot, 'cliente-x', 'briefing.md'), 'utf8');
    expect(written).toBe(req.content);

    expect(res.audit).toEqual({
      event: 'artifact.materialize',
      schemaVersion: ARTIFACT_WRITE_SCHEMA_VERSION,
      projectSlug: 'cliente-x',
      relativePath: 'briefing.md',
      runId: 'run-001',
      format: 'markdown',
      outcome: 'written',
      hashBefore: null,
      hashAfter: sha256(req.content),
      bytesWritten: Buffer.byteLength(req.content, 'utf8'),
      timestamp: '2026-07-09T00:00:00.000Z',
    });
    // Evento é serializável sem perda.
    expect(JSON.parse(JSON.stringify(res.audit))).toEqual(res.audit);
  });

  it('cria diretórios intermediários dentro de projetos/{slug}/', async () => {
    const req = request({ relativePath: 'campanhas/2026/plano.md' });
    const res = await materializeArtifact(req, { projectsRoot, now: FIXED_NOW });
    expect(res.outcome).toBe('written');
    const written = await readFile(join(projectsRoot, 'cliente-x', 'campanhas', '2026', 'plano.md'), 'utf8');
    expect(written).toBe(req.content);
  });

  it('não escreve fora de projetos/{slug}/ (a raiz do write é o projeto)', async () => {
    const req = request();
    const res = await materializeArtifact(req, { projectsRoot, now: FIXED_NOW });
    const realRoot = await realpath(join(projectsRoot, 'cliente-x'));
    expect(res.absolutePath.startsWith(realRoot)).toBe(true);
  });
});

describe('materializeArtifact — formatos JSON/YAML (AC6)', () => {
  it('grava JSON válido', async () => {
    const content = JSON.stringify({ ok: true, itens: [1, 2, 3] }, null, 2);
    const res = await materializeArtifact(
      request({ relativePath: 'dados.json', format: 'json', content }),
      { projectsRoot, now: FIXED_NOW },
    );
    expect(res.outcome).toBe('written');
  });

  it('rejeita conteúdo JSON inválido antes de qualquer escrita', async () => {
    await expect(
      materializeArtifact(
        request({ relativePath: 'dados.json', format: 'json', content: '{ inválido' }),
        { projectsRoot, now: FIXED_NOW },
      ),
    ).rejects.toMatchObject({ code: 'invalid-content' });
    // Nada foi criado.
    await expect(stat(join(projectsRoot, 'cliente-x', 'dados.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('grava YAML válido', async () => {
    const res = await materializeArtifact(
      request({ relativePath: 'config.yaml', format: 'yaml', content: 'chave: valor\nlista:\n  - a\n  - b\n' }),
      { projectsRoot, now: FIXED_NOW },
    );
    expect(res.outcome).toBe('written');
  });

  it('rejeita conteúdo YAML inválido', async () => {
    await expect(
      materializeArtifact(
        request({ relativePath: 'config.yaml', format: 'yaml', content: 'chave: "valor sem fechar' }),
        { projectsRoot, now: FIXED_NOW },
      ),
    ).rejects.toMatchObject({ code: 'invalid-content' });
  });
});

describe('materializeArtifact — idempotência e conflito (AC5)', () => {
  it('mesma escrita duas vezes é no-op na segunda (unchanged)', async () => {
    const req = request();
    const first = await materializeArtifact(req, { projectsRoot, now: FIXED_NOW });
    expect(first.outcome).toBe('written');

    const second = await materializeArtifact(req, { projectsRoot, now: FIXED_NOW });
    expect(second.outcome).toBe('unchanged');
    expect(second.bytesWritten).toBe(0);
    expect(second.hashBefore).toBe(second.hashAfter);
  });

  it('conteúdo divergente sem revisão explícita retorna conflito e NÃO altera o canônico', async () => {
    const original = request();
    await materializeArtifact(original, { projectsRoot, now: FIXED_NOW });

    const divergent = request({ content: '# Briefing\n\nOutro conteúdo.\n' });
    const res = await materializeArtifact(divergent, { projectsRoot, now: FIXED_NOW });

    expect(res.outcome).toBe('conflict');
    expect(res.bytesWritten).toBe(0);
    expect(res.hashBefore).toBe(sha256(original.content));
    expect(res.hashAfter).toBe(sha256(divergent.content));

    // Arquivo canônico permanece o original.
    const onDisk = await readFile(join(projectsRoot, 'cliente-x', 'briefing.md'), 'utf8');
    expect(onDisk).toBe(original.content);
  });

  it('revisão explícita (onConflict: overwrite) substitui atomicamente', async () => {
    const original = request();
    await materializeArtifact(original, { projectsRoot, now: FIXED_NOW });

    const divergent = request({ content: '# Briefing\n\nRevisado.\n', onConflict: 'overwrite' });
    const res = await materializeArtifact(divergent, { projectsRoot, now: FIXED_NOW });

    expect(res.outcome).toBe('written');
    expect(res.hashBefore).toBe(sha256(original.content));
    const onDisk = await readFile(join(projectsRoot, 'cliente-x', 'briefing.md'), 'utf8');
    expect(onDisk).toBe(divergent.content);
  });
});

describe('materializeArtifact — gate de integridade expectedHash (AC1/AC4)', () => {
  it('aceita quando expectedHash bate com o SHA-256 do conteúdo', async () => {
    const content = 'conteúdo verificável';
    const res = await materializeArtifact(
      request({ relativePath: 'v.txt', format: 'text', content, expectedHash: sha256(content) }),
      { projectsRoot, now: FIXED_NOW },
    );
    expect(res.outcome).toBe('written');
  });

  it('recusa quando expectedHash diverge do conteúdo', async () => {
    await expect(
      materializeArtifact(
        request({ relativePath: 'v.txt', format: 'text', content: 'x', expectedHash: sha256('y') }),
        { projectsRoot, now: FIXED_NOW },
      ),
    ).rejects.toMatchObject({ code: 'hash-mismatch' });
  });
});

describe('materializeArtifact — defesas de caminho (AC2)', () => {
  it('rejeita slug inválido (maiúsculas/barra/traversal)', async () => {
    for (const projectSlug of ['UPPER', 'a/b', '../escape', 'ponto.', '']) {
      await expect(
        materializeArtifact(request({ projectSlug }), { projectsRoot, now: FIXED_NOW }),
      ).rejects.toMatchObject({ code: 'invalid-slug' });
    }
  });

  it('rejeita path traversal com ".."', async () => {
    await expect(
      materializeArtifact(
        request({ relativePath: '../../etc/passwd' }),
        { projectsRoot, now: FIXED_NOW },
      ),
    ).rejects.toMatchObject({ code: 'invalid-relative-path' });
  });

  it('rejeita caminho relativo absoluto', async () => {
    await expect(
      materializeArtifact(
        request({ relativePath: '/etc/passwd' }),
        { projectsRoot, now: FIXED_NOW },
      ),
    ).rejects.toMatchObject({ code: 'invalid-relative-path' });
  });

  it('rejeita escape via symlink em diretório ancestral', async () => {
    const projectRoot = join(projectsRoot, 'cliente-x');
    await mkdir(projectRoot, { recursive: true });
    const outside = join(projectsRoot, 'outside');
    await mkdir(outside, { recursive: true });
    // projetos/cliente-x/link -> ../outside
    await symlink(outside, join(projectRoot, 'link'));

    await expect(
      materializeArtifact(
        request({ relativePath: 'link/evil.md' }),
        { projectsRoot, now: FIXED_NOW },
      ),
    ).rejects.toMatchObject({ code: 'symlink-escape' });

    // Nada foi escrito no alvo do symlink.
    await expect(stat(join(outside, 'evil.md'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejeita escape quando o próprio alvo é symlink', async () => {
    const projectRoot = join(projectsRoot, 'cliente-x');
    await mkdir(projectRoot, { recursive: true });
    const outside = join(projectsRoot, 'outside');
    await mkdir(outside, { recursive: true });
    const outsideTarget = join(outside, 'target.md');
    await writeFile(outsideTarget, 'intocável', 'utf8');
    // projetos/cliente-x/direct.md -> ../outside/target.md
    await symlink(outsideTarget, join(projectRoot, 'direct.md'));

    await expect(
      materializeArtifact(
        request({ relativePath: 'direct.md' }),
        { projectsRoot, now: FIXED_NOW },
      ),
    ).rejects.toMatchObject({ code: 'symlink-escape' });

    // O arquivo apontado pelo symlink não foi alterado.
    expect(await readFile(outsideTarget, 'utf8')).toBe('intocável');
  });
});

describe('materializeArtifact — rollback sem corromper o canônico (AC3)', () => {
  const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;

  it.skipIf(isRoot)('falha na escrita não deixa arquivo parcial nem corrompe o canônico', async () => {
    // Cria o arquivo canônico.
    const original = request();
    await materializeArtifact(original, { projectsRoot, now: FIXED_NOW });
    const realProjectRoot = await realpath(join(projectsRoot, 'cliente-x'));

    // Torna o diretório read-only → a escrita do arquivo temporário falha (EACCES).
    await chmod(realProjectRoot, 0o555);
    try {
      const divergent = request({ content: '# Briefing\n\nTentativa que deve falhar.\n', onConflict: 'overwrite' });
      await expect(
        materializeArtifact(divergent, { projectsRoot, now: FIXED_NOW }),
      ).rejects.toMatchObject({ code: 'write-failed' });
    } finally {
      await chmod(realProjectRoot, 0o755);
    }

    // Canônico intacto.
    const onDisk = await readFile(join(realProjectRoot, 'briefing.md'), 'utf8');
    expect(onDisk).toBe(original.content);

    // Nenhum arquivo temporário remanescente.
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(realProjectRoot);
    expect(entries.filter((name) => name.includes('.tmp'))).toEqual([]);
  });
});

describe('materializeArtifact — versão de schema (AC1)', () => {
  it('rejeita schemaVersion não suportada', async () => {
    await expect(
      materializeArtifact(
        // @ts-expect-error — versão inválida proposital
        request({ schemaVersion: '2.0.0' }),
        { projectsRoot, now: FIXED_NOW },
      ),
    ).rejects.toMatchObject({ code: 'invalid-schema-version' });
  });

  it('a classe de erro expõe code tipado', () => {
    const err = new ArtifactMaterializerError('path-escape', 'demo');
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('path-escape');
  });
});
