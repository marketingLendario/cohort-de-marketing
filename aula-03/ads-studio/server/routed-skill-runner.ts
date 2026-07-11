import type { LocalSkillRunner, LocalSkillRunInput, LocalSkillRunOptions, LocalSkillRunResult } from './local-skill-runner.js'
import { CREATIVE_FACTORY_SKILL_ID } from './creative-factory/runner.js'
import { isVisualProductionSkill, VisualProductionLocalRunner } from './visual-production/runner.js'

export class RoutedLocalSkillRunner implements LocalSkillRunner {
  private readonly defaultRunner: LocalSkillRunner
  private readonly creativeRunner: LocalSkillRunner
  private readonly visualRunner: LocalSkillRunner

  constructor(defaultRunner: LocalSkillRunner, creativeRunner: LocalSkillRunner) {
    this.defaultRunner = defaultRunner
    this.creativeRunner = creativeRunner
    this.visualRunner = new VisualProductionLocalRunner(defaultRunner, creativeRunner)
  }

  run(skillId: string, input: LocalSkillRunInput, options?: LocalSkillRunOptions): Promise<LocalSkillRunResult> {
    if (skillId === CREATIVE_FACTORY_SKILL_ID) return this.creativeRunner.run(skillId, input, options)
    if (isVisualProductionSkill(skillId)) return this.visualRunner.run(skillId, input, options)
    return this.defaultRunner.run(skillId, input, options)
  }
}
