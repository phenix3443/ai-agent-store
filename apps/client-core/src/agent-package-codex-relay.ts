export interface CodexRelayRequestBody {
  model?: unknown
  instructions?: unknown
  input?: unknown
  stream?: unknown
}

export function sanitizeCodexResponsesRequest(
  payload: Record<string, unknown>
): CodexRelayRequestBody {
  const sanitized: CodexRelayRequestBody = {}

  if ('model' in payload) sanitized.model = payload.model
  if ('instructions' in payload) sanitized.instructions = payload.instructions
  if ('input' in payload) sanitized.input = payload.input
  if ('stream' in payload) sanitized.stream = payload.stream

  return sanitized
}
