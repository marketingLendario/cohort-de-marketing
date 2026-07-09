/**
 * Job-stream event protocol.
 *
 * Generalized from `apps/squad-engine/src/websocket/events.ts` (STORY-AL-ADS-0c.4 pilot).
 *
 * The transport (Redis buffer + pub/sub, see `session-stream.ts`) is fully generic
 * over the event shape: it serializes/deserializes any JSON-shaped event. The concrete
 * event union below is the squad-engine session protocol, kept here so squad-engine
 * consumes the package as a drop-in. Other consumers (e.g. the Ads Studio worker) can
 * define their own union and pass it as the generic parameter to the stream functions.
 */

/**
 * Minimal contract every job-stream event must satisfy: a discriminant `type` string
 * and a JSON-serializable `payload`. Transport functions are generic over this.
 */
export interface JobEventBase {
  type: string
  payload: Record<string, unknown>
}

// --- Concrete squad-engine session protocol (first consumer) -----------------

export interface WsEventStarted {
  type: 'started'
  payload: {
    sessionId: string
    taskId: string
    entityId: string | null
    timestamp: string
  }
}

export interface WsEventMessage {
  type: 'message'
  payload: {
    role: 'assistant'
    content: string
    timestamp: string
  }
}

export interface WsEventToolCall {
  type: 'tool_call'
  payload: {
    tool: string
    input: Record<string, unknown>
    callId: string
    timestamp: string
  }
}

export interface WsEventToolResult {
  type: 'tool_result'
  payload: {
    callId: string
    output: Record<string, unknown>
    duration_ms: number
    timestamp: string
  }
}

export interface WsEventCompleted {
  type: 'completed'
  payload: {
    sessionId: string
    taskId: string
    status: 'completed' | 'error'
    artifact?: Record<string, unknown>
    timestamp: string
  }
}

export type WsEvent =
  | WsEventStarted
  | WsEventMessage
  | WsEventToolCall
  | WsEventToolResult
  | WsEventCompleted
