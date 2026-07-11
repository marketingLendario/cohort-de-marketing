export type MonitorStatus = 'active' | 'paused';
export type DecisionKind = 'scale' | 'kill' | 'alert';

export interface MonitorDecision {
  id: string;
  time: string;
  kind: DecisionKind;
  target: string;
  trigger: string;
  expert: string;
  status: 'pending' | 'done';
}

export interface ApprovalQueueItem {
  id: string;
  action: string;
  impact: number;
  trigger: string;
  expert: string;
}

export interface PerformanceMonitorState {
  status: MonitorStatus;
  scaleOpen: boolean;
  queue: ApprovalQueueItem[];
  decisions: MonitorDecision[];
}

export const MONITOR_KPIS = [
  { label: 'CPA', value: 'R$ 42,80', delta: '-12%', good: true },
  { label: 'ROAS', value: '3,8x', delta: '+0,4', good: true },
  { label: 'CTR', value: '1,9%', delta: '+0,2', good: true },
  { label: 'Frequência', value: '2,1', delta: '+0,3', good: false },
  { label: 'Gasto / dia', value: 'R$ 670', delta: '0%', good: true },
];

export const SCALE_READINESS_CHECKS = [
  { label: 'ROAS ≥ 3,0 sustentado por 72h', ok: true },
  { label: 'CPA estável (variação < 15%)', ok: true },
  { label: 'Frequência < 3,0', ok: false },
  { label: 'Volume de conversões ≥ 50/semana', ok: true },
];

export function defaultPerformanceMonitorState(): PerformanceMonitorState {
  return {
    status: 'active',
    scaleOpen: false,
    queue: [
      {
        id: 'q1',
        action: 'Escalar budget do adset LAL 1% em +60%',
        impact: 62,
        trigger: 'ROAS 3,8x sustentado por 72h · CPA 18% abaixo do alvo',
        expert: 'scale-agent',
      },
    ],
    decisions: [
      { id: 'd1', time: '14:32', kind: 'scale', target: 'AD · LAL 1% · Feed', trigger: 'ROAS 3,8x > alvo 3,0x', expert: 'scale-agent', status: 'pending' },
      { id: 'd2', time: '13:05', kind: 'kill', target: 'AD · Broad · Feed', trigger: 'CPA R$ 142 · 2,1x acima do alvo', expert: 'kill-agent', status: 'done' },
      { id: 'd3', time: '11:48', kind: 'alert', target: 'AD · Interesse · Story', trigger: 'Frequência 3,4 · fadiga de criativo', expert: 'monitor', status: 'done' },
      { id: 'd4', time: '09:20', kind: 'scale', target: 'AD · LAL 3% · Square', trigger: 'CTR 2,1% · CPA estável', expert: 'scale-agent', status: 'done' },
    ],
  };
}

export function resolveApprovalQueue(
  state: PerformanceMonitorState,
  queueId: string,
  approved: boolean,
): PerformanceMonitorState {
  const item = state.queue.find((entry) => entry.id === queueId);
  if (!item) return state;
  return {
    ...state,
    queue: state.queue.filter((entry) => entry.id !== queueId),
    decisions: [
      {
        id: `human-${queueId}`,
        time: 'agora',
        kind: approved ? 'scale' : 'alert',
        target: item.action,
        trigger: approved ? 'Aprovado pelo operador' : 'Rejeitado pelo operador',
        expert: 'humano',
        status: 'done',
      },
      ...state.decisions,
    ],
  };
}
