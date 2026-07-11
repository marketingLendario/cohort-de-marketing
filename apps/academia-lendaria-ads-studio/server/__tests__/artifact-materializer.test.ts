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
  canonicalizeProjectArtifactPath,
  materializeArtifact,
  readSafeArtifactFile,
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
  it('aceita o alias projetos/{slug}/arquivo e o reduz ao caminho do projeto', async () => {
    const req = request({ relativePath: 'projetos/cliente-x/briefing.md' });
    const res = await materializeArtifact(req, { projectsRoot, now: FIXED_NOW });

    expect(res.relativePath).toBe('briefing.md');
    expect(res.audit.relativePath).toBe('briefing.md');
    expect(await readFile(join(projectsRoot, 'cliente-x', 'briefing.md'), 'utf8')).toBe(req.content);
    await expect(stat(join(projectsRoot, 'cliente-x', 'projetos'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejeita alias de outro projeto antes de escrever', () => {
    expect(() => canonicalizeProjectArtifactPath('cliente-x', 'projetos/outro-cliente/briefing.md')).toThrow(
      expect.objectContaining({ code: 'invalid-relative-path' }),
    );
  });

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

  it('W23-RG2-P1-01 rejeita o diretório do slug como symlink sem escrever fora da raiz', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'artifact-materializer-outside-'));
    try {
      const outsideTarget = join(outside, 'escaped.md');
      await writeFile(outsideTarget, 'intocável', 'utf8');
      await symlink(outside, join(projectsRoot, 'cliente-x'));

      await expect(
        materializeArtifact(
          request({ relativePath: 'escaped.md', content: 'não pode escrever fora' }),
          { projectsRoot, now: FIXED_NOW },
        ),
      ).rejects.toMatchObject({ code: 'symlink-escape' });

      expect(await readFile(outsideTarget, 'utf8')).toBe('intocável');
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('mantém permitido um projectsRoot que seja mount/symlink', async () => {
    const mountedRoot = await mkdtemp(join(tmpdir(), 'artifact-materializer-mounted-'));
    const projectsRootLink = join(projectsRoot, 'projects-mount');
    await symlink(mountedRoot, projectsRootLink);
    try {
      const result = await materializeArtifact(request(), { projectsRoot: projectsRootLink, now: FIXED_NOW });

      expect(result.outcome).toBe('written');
      expect(await readFile(join(mountedRoot, 'cliente-x', 'briefing.md'), 'utf8')).toBe(request().content);
    } finally {
      await rm(mountedRoot, { recursive: true, force: true });
    }
  });

  it('W23-RG4 reancora writes sequenciais em diretórios irmãos na mesma sessão', async () => {
    const first = request({ projectSlug: 'victim', relativePath: 'a/x.md', content: 'A' });
    const second = request({ projectSlug: 'victim', relativePath: 'b/y.md', content: 'B' });

    await expect(materializeArtifact(first, { projectsRoot, now: FIXED_NOW })).resolves.toMatchObject({ outcome: 'written' });
    await expect(materializeArtifact(second, { projectsRoot, now: FIXED_NOW })).resolves.toMatchObject({ outcome: 'written' });

    expect(await readFile(join(projectsRoot, 'victim', 'a', 'x.md'), 'utf8')).toBe('A');
    expect(await readFile(join(projectsRoot, 'victim', 'b', 'y.md'), 'utf8')).toBe('B');
    await expect(stat(join(projectsRoot, 'victim', 'a', 'b', 'y.md'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('W23-RG4 reancora reads sequenciais em diretórios irmãos na mesma sessão', async () => {
    const projectRoot = join(projectsRoot, 'victim');
    await mkdir(join(projectRoot, 'a'), { recursive: true });
    await mkdir(join(projectRoot, 'b'), { recursive: true });
    await writeFile(join(projectRoot, 'a', 'x.md'), 'A', 'utf8');
    await writeFile(join(projectRoot, 'b', 'y.md'), 'B', 'utf8');

    await expect(readSafeArtifactFile(projectsRoot, 'victim', 'a/x.md')).resolves.toBe('A');
    await expect(readSafeArtifactFile(projectsRoot, 'victim', 'b/y.md')).resolves.toBe('B');
  });

  it('W23-RG4 read de parent inexistente retorna null e não cria diretórios', async () => {
    await mkdir(join(projectsRoot, 'victim'), { recursive: true });

    await expect(readSafeArtifactFile(projectsRoot, 'victim', 'missing/child.md')).resolves.toBeNull();
    await expect(stat(join(projectsRoot, 'victim', 'missing'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('W23-RG4 invalida a sessão após falha e permite operação válida seguinte', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'artifact-materializer-session-outside-'));
    const projectRoot = join(projectsRoot, 'victim');
    await mkdir(projectRoot, { recursive: true });
    await symlink(outside, join(projectRoot, 'blocked'));

    await expect(
      materializeArtifact(
        request({ projectSlug: 'victim', relativePath: 'blocked/fail.md', content: 'não escrever' }),
        { projectsRoot, now: FIXED_NOW },
      ),
    ).rejects.toMatchObject({ code: 'symlink-escape' });

    await rm(join(projectRoot, 'blocked'), { force: true });
    await expect(
      materializeArtifact(
        request({ projectSlug: 'victim', relativePath: 'valid/after-failure.md', content: 'válido' }),
        { projectsRoot, now: FIXED_NOW },
      ),
    ).resolves.toMatchObject({ outcome: 'written' });
    expect(await readFile(join(projectRoot, 'valid', 'after-failure.md'), 'utf8')).toBe('válido');
    await rm(outside, { recursive: true, force: true });
  });

  it('W23-RG4 timer/reuse preserva o worker em uso e reusa a sessão limpa', async () => {
    const operations = await Promise.all(
      Array.from({ length: 200 }, (_, index) =>
        materializeArtifact(
          request({ projectSlug: 'victim', relativePath: `batch/${index}.txt`, content: `batch-${index}` }),
          { projectsRoot, now: FIXED_NOW },
        ),
      ),
    );
    expect(operations.every(({ outcome }) => outcome === 'written')).toBe(true);

    await expect(
      materializeArtifact(
        request({ projectSlug: 'victim', relativePath: 'after/batch.txt', content: 'after' }),
        { projectsRoot, now: FIXED_NOW },
      ),
    ).resolves.toMatchObject({ outcome: 'written' });
  }, 20_000);

  it('W23-RG4 não atravessa intermediário trocado por symlink externo ou interno', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'artifact-materializer-intermediate-outside-'));
    const projectRoot = join(projectsRoot, 'victim');
    const outsideTarget = join(outside, 'target.md');
    const internalTarget = join(projectRoot, 'other', 'target.md');
    const swapped = join(projectRoot, 'swapped');
    await mkdir(join(projectRoot, 'other'), { recursive: true });
    await writeFile(outsideTarget, 'SAFE-OUTSIDE', 'utf8');
    await writeFile(internalTarget, 'SAFE-INTERNAL', 'utf8');
    await mkdir(swapped, { recursive: true });
    await materializeArtifact(
      request({ projectSlug: 'victim', relativePath: 'swapped/warm.md', content: 'warm', onConflict: 'overwrite' }),
      { projectsRoot, now: FIXED_NOW },
    );

    let stop = false;
    const swapper = (async () => {
      while (!stop) {
        await rm(swapped, { recursive: true, force: true }).catch(() => undefined);
        if (stop) break;
        await mkdir(swapped, { recursive: true }).catch(() => undefined);
        await rm(swapped, { recursive: true, force: true }).catch(() => undefined);
        if (stop) break;
        await symlink(outside, swapped).catch(() => undefined);
        await rm(swapped, { recursive: true, force: true }).catch(() => undefined);
        if (stop) break;
        await symlink(join(projectRoot, 'other'), swapped).catch(() => undefined);
      }
    })();

    try {
      await Promise.all(
        Array.from({ length: 400 }, (_, index) =>
          materializeArtifact(
            request({ projectSlug: 'victim', relativePath: 'swapped/target.md', content: `ATTACK-${index}`, onConflict: 'overwrite' }),
            { projectsRoot, now: FIXED_NOW },
          ).catch(() => undefined),
        ),
      );
    } finally {
      stop = true;
      await swapper;
    }

    expect(await readFile(outsideTarget, 'utf8')).toBe('SAFE-OUTSIDE');
    expect(await readFile(internalTarget, 'utf8')).toBe('SAFE-INTERNAL');
    await rm(outside, { recursive: true, force: true });
  }, 20_000);

  it('W23-RG4 read não vaza quando intermediário vira symlink externo ou interno', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'artifact-materializer-read-intermediate-outside-'));
    const projectRoot = join(projectsRoot, 'victim');
    const swapped = join(projectRoot, 'swapped');
    await mkdir(join(projectRoot, 'other'), { recursive: true });
    await writeFile(join(outside, 'secret.md'), 'SECRET-OUTSIDE', 'utf8');
    await writeFile(join(projectRoot, 'other', 'secret.md'), 'SECRET-INTERNAL', 'utf8');
    await mkdir(swapped, { recursive: true });
    await writeFile(join(swapped, 'secret.md'), 'SECRET-INSIDE', 'utf8');
    await expect(readSafeArtifactFile(projectsRoot, 'victim', 'swapped/secret.md')).resolves.toBe('SECRET-INSIDE');

    let stop = false;
    const swapper = (async () => {
      while (!stop) {
        await rm(swapped, { recursive: true, force: true }).catch(() => undefined);
        if (stop) break;
        await mkdir(swapped, { recursive: true }).catch(() => undefined);
        await writeFile(join(swapped, 'secret.md'), 'SECRET-INSIDE', 'utf8').catch(() => undefined);
        await rm(swapped, { recursive: true, force: true }).catch(() => undefined);
        if (stop) break;
        await symlink(outside, swapped).catch(() => undefined);
        await rm(swapped, { recursive: true, force: true }).catch(() => undefined);
        if (stop) break;
        await symlink(join(projectRoot, 'other'), swapped).catch(() => undefined);
      }
    })();

    let reads: Array<string | null> = [];
    try {
      reads = await Promise.all(
        Array.from({ length: 400 }, () => readSafeArtifactFile(projectsRoot, 'victim', 'swapped/secret.md').catch(() => null)),
      );
    } finally {
      stop = true;
      await swapper;
      await rm(outside, { recursive: true, force: true });
    }

    expect(reads).not.toContain('SECRET-OUTSIDE');
    expect(reads).not.toContain('SECRET-INTERNAL');
  }, 20_000);

  it('W23-RG3-P1-01 concorrência: fixa a identidade e nunca escreve no alvo externo', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'artifact-materializer-race-outside-'));
    const slugRoot = join(projectsRoot, 'victim');
    const outsideTarget = join(outside, 'attack.md');
    await writeFile(outsideTarget, 'SAFE-OUTSIDE', 'utf8');
    await mkdir(slugRoot, { recursive: true });
    await materializeArtifact(
      request({ projectSlug: 'victim', relativePath: 'attack.md', content: 'INSIDE', onConflict: 'overwrite' }),
      { projectsRoot, now: FIXED_NOW },
    );
    let stop = false;
    const swapper = (async () => {
      while (!stop) {
        await rm(slugRoot, { recursive: true, force: true }).catch(() => undefined);
        if (stop) break;
        await mkdir(slugRoot, { recursive: true }).catch(() => undefined);
        await rm(slugRoot, { recursive: true, force: true }).catch(() => undefined);
        if (stop) break;
        await symlink(outside, slugRoot).catch(() => undefined);
      }
    })();
    let external = false;
    try {
      await Promise.all(
        Array.from({ length: 400 }, () =>
          materializeArtifact(
            request({ projectSlug: 'victim', relativePath: 'attack.md', content: 'ATTACK-19', onConflict: 'overwrite' }),
            { projectsRoot, now: FIXED_NOW },
          ).catch(() => undefined),
        ),
      );
      external = (await readFile(outsideTarget, 'utf8')) !== 'SAFE-OUTSIDE';
    } finally {
      stop = true;
      await swapper;
      await rm(outside, { recursive: true, force: true });
    }
    expect(external).toBe(false);
  }, 20_000);

  it('W23-RG3-P1-01 concorrência: plan/read não vaza conteúdo do symlink externo', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'artifact-materializer-read-race-outside-'));
    const slugRoot = join(projectsRoot, 'victim');
    const outsideTarget = join(outside, 'secret.md');
    await writeFile(outsideTarget, 'SECRET-OUTSIDE', 'utf8');
    await mkdir(slugRoot, { recursive: true });
    await writeFile(join(slugRoot, 'secret.md'), 'INSIDE', 'utf8');
    expect(await readSafeArtifactFile(projectsRoot, 'victim', 'secret.md')).toBe('INSIDE');
    let stop = false;
    const swapper = (async () => {
      while (!stop) {
        await rm(slugRoot, { recursive: true, force: true }).catch(() => undefined);
        if (stop) break;
        await mkdir(slugRoot, { recursive: true }).catch(() => undefined);
        await writeFile(join(slugRoot, 'secret.md'), 'INSIDE', 'utf8').catch(() => undefined);
        await rm(slugRoot, { recursive: true, force: true }).catch(() => undefined);
        if (stop) break;
        await symlink(outside, slugRoot).catch(() => undefined);
      }
    })();
    const reads: Array<string | null> = [];
    try {
      reads.push(
        ...(await Promise.all(
          Array.from({ length: 400 }, () => readSafeArtifactFile(projectsRoot, 'victim', 'secret.md').catch(() => null)),
        )),
      );
    } finally {
      stop = true;
      await swapper;
      await rm(outside, { recursive: true, force: true });
    }
    expect(reads.includes('SECRET-OUTSIDE')).toBe(false);
  }, 20_000);
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
