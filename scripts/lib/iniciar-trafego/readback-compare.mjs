/** Compara readback Studio contra handoff aprovado (fail-closed por campo real do schema). */

export const ANGLE_FIELD_KEYS = ['nome', 'dor', 'nivel_consciencia', 'locator', 'sourceHash'];

function normalizeMargemPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return n;
  return n <= 1 ? Math.round(n * 10000) / 100 : n;
}

function stableJson(value) {
  return JSON.stringify(value ?? null);
}

function normalizeTextBytes(value) {
  return String(value ?? '').replace(/\r\n/g, '\n');
}

export function compareAngles(handoffAngles, readbackAngles) {
  const expected = Array.isArray(handoffAngles) ? handoffAngles : [];
  const actual = Array.isArray(readbackAngles) ? readbackAngles : [];
  if (expected.length !== actual.length) {
    return `angles.count diverge (${actual.length} vs ${expected.length})`;
  }
  for (let i = 0; i < expected.length; i += 1) {
    const exp = expected[i] ?? {};
    const got = actual[i] ?? {};
    for (const key of ANGLE_FIELD_KEYS) {
      if (exp[key] == null || exp[key] === '') continue;
      if (String(got[key] ?? '') !== String(exp[key])) {
        return `angles[${i}].${key} diverge`;
      }
    }
  }
  return null;
}

export function compareReadbackToHandoff(handoff, readback, expectedReceipt = null) {
  const errors = [];
  if (!readback?.ok) errors.push('readback.ok !== true');
  if (readback?.schemaVersion !== '1.0.0') errors.push('schemaVersion invalido');
  if (!readback?.entities) errors.push('entities ausentes');
  if (!handoff?.panelHash) errors.push('handoff.panelHash ausente');
  if (!readback?.hashes?.panelHash) errors.push('readback.hashes.panelHash ausente');
  if (!readback?.hashes?.artifactHash) errors.push('readback.hashes.artifactHash ausente');
  if (handoff?.panelHash && readback?.hashes?.panelHash && readback.hashes.panelHash !== handoff.panelHash) {
    errors.push('panelHash diverge');
  }
  if (!readback?.hashes?.proposalHash) errors.push('readback.hashes.proposalHash ausente');
  if (handoff?.proposalHash && readback?.hashes?.proposalHash !== handoff.proposalHash) {
    errors.push('proposalHash diverge');
  }
  if (handoff?.panelHash && readback?.hashes?.artifactHash && readback.hashes.artifactHash !== handoff.panelHash) {
    errors.push('artifactHash diverge do panelHash esperado');
  }

  const checks = [
    ['proposalId', handoff.proposalId, readback?.proposalId ?? readback?.domainSnapshot?.proposalId],
    ['sourceProjectId', handoff.sourceProjectId, readback?.sourceProjectId],
    ['sourceProjectSlug', handoff.sourceProjectSlug, readback?.sourceProjectSlug],
    ['publishedUrl', handoff.publishedUrl ?? '', readback?.publishedUrl ?? ''],
    ['panelPath', handoff.panelPath ?? '', readback?.panelPath ?? ''],
  ];

  for (const [label, expected, actual] of checks) {
    if (expected == null || expected === '') continue;
    if (String(actual ?? '') !== String(expected)) {
      errors.push(`${label} diverge (${actual ?? '∅'} vs ${expected})`);
    }
  }

  if (!readback?.deepLink || String(readback.deepLink).trim() === '') {
    errors.push('deepLink ausente');
  } else if (
    readback?.entities?.marketingProjectId
    && !String(readback.deepLink).includes(String(readback.entities.marketingProjectId))
  ) {
    errors.push('deepLink nao referencia entities.marketingProjectId');
  }

  if (expectedReceipt?.receiptId && readback?.receiptId !== expectedReceipt.receiptId) {
    errors.push('receiptId diverge do receipt imutavel');
  } else if (handoff.proposalId && readback?.receiptId && !String(readback.receiptId).includes(handoff.proposalId)) {
    errors.push('receiptId nao referencia proposalId');
  }

  const entityKeys = ['marketingProjectId', 'briefRevisionId', 'campaignId', 'campaignPlanRevisionId', 'unitEconomicsId'];
  for (const key of entityKeys) {
    const id = readback?.entities?.[key];
    if (!id || String(id).trim() === '') errors.push(`entities.${key} vazio`);
    const expectedId = expectedReceipt?.entities?.[key];
    if (expectedId && String(id) !== String(expectedId)) {
      errors.push(`entities.${key} diverge do receipt imutavel`);
    }
  }
  const artifactIds = readback?.entities?.artifactIds;
  if (!Array.isArray(artifactIds) || artifactIds.length === 0) {
    errors.push('entities.artifactIds vazio');
  } else if (handoff.receiptArtifactId && !artifactIds.map(String).includes(String(handoff.receiptArtifactId))) {
    errors.push('entities.artifactIds nao inclui artifact do receipt');
  }
  if (
    expectedReceipt?.entities?.artifactIds
    && stableJson(artifactIds?.map(String)) !== stableJson(expectedReceipt.entities.artifactIds.map(String))
  ) {
    errors.push('entities.artifactIds diverge do receipt imutavel');
  }

  const angleCount = Array.isArray(handoff.angles) ? handoff.angles.length : 0;
  if (readback?.angleCount != null && Number(readback.angleCount) !== angleCount) {
    errors.push(`angleCount diverge (${readback.angleCount} vs ${angleCount})`);
  }

  const angleErr = compareAngles(handoff.angles, readback.angles);
  if (angleErr) errors.push(angleErr);

  if (
    handoff.panelContent != null
    && normalizeTextBytes(readback?.panelContent) !== normalizeTextBytes(handoff.panelContent)
  ) {
    errors.push('panelContent diverge');
  }

  if (
    handoff.insumosYaml != null
    && normalizeTextBytes(readback?.insumosYaml) !== normalizeTextBytes(handoff.insumosYaml)
  ) {
    errors.push('insumosYaml diverge');
  }

  if (handoff.economics && readback?.economics) {
    for (const key of ['ticket', 'margem_pct']) {
      const expected = handoff.economics[key];
      const actual = readback.economics[key];
      if (expected == null) continue;
      if (key === 'margem_pct') {
        if (normalizeMargemPct(actual) !== normalizeMargemPct(expected)) {
          errors.push(`economics.${key} diverge (${actual} vs ${expected})`);
        }
        continue;
      }
      if (Number(actual) !== Number(expected)) {
        errors.push(`economics.${key} diverge (${actual} vs ${expected})`);
      }
    }
  } else if (handoff.economics && !readback?.economics) {
    errors.push('economics ausentes no readback');
  }

  if (!readback?.campaignPlan || typeof readback.campaignPlan !== 'object') {
    errors.push('campaignPlan ausente');
  } else if (handoff.campaignPlan && stableJson(handoff.campaignPlan) !== stableJson(readback.campaignPlan)) {
    errors.push('campaignPlan diverge');
  }

  if (!readback?.entityVersions || typeof readback.entityVersions !== 'object') {
    errors.push('entityVersions ausente');
  } else if (handoff.entityVersions) {
    for (const key of Object.keys(handoff.entityVersions)) {
      if (handoff.entityVersions[key] == null) continue;
      if (Number(readback.entityVersions[key]) !== Number(handoff.entityVersions[key])) {
        errors.push(`entityVersions.${key} diverge`);
      }
    }
  }
  if (
    expectedReceipt?.entityVersions
    && stableJson(readback?.entityVersions) !== stableJson(expectedReceipt.entityVersions)
  ) {
    errors.push('entityVersions diverge do receipt imutavel');
  }

  if (expectedReceipt?.deepLink && readback?.deepLink !== expectedReceipt.deepLink) {
    errors.push('deepLink diverge do receipt imutavel');
  }

  return { ok: errors.length === 0, errors };
}
