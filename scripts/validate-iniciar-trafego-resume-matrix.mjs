#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  RUN_STATES,
  ensureRunState,
  loadRunState,
  resolveResumeAction,
  transitionRunState,
} from './lib/iniciar-trafego/run-state.mjs';

const temp = mkdtempSync(join(tmpdir(), 'traffic-resume-matrix-'));
try {
  for (const state of RUN_STATES) {
    const project = join(temp, state.toLowerCase());
    ensureRunState(project, `project-${state}`);
    const transitioned = transitionRunState(project, {
      state,
      lock: null,
      note: `crash-probe:${state}`,
    });
    const reloaded = loadRunState(project);
    assert.equal(reloaded.state, state);
    assert.equal(reloaded.runId, transitioned.runId);
    assert.equal(reloaded.projectRoot, project);
    assert.equal(reloaded.resumableAction, resolveResumeAction(state));
    assert.equal(reloaded.stateHistory.at(-1).state, state);
  }
  console.log(`validate-iniciar-trafego-resume-matrix: PASS (${RUN_STATES.length} estados persistidos e recarregados)`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
