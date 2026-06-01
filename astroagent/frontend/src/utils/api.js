const BASE_URL = '/api'

export async function createSession() {
  const res = await fetch(`${BASE_URL}/session/new`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

export async function getSession(sessionId) {
  const res = await fetch(`${BASE_URL}/session/${sessionId}`)
  if (!res.ok) return null
  return res.json()
}

/**
 * Stream a chat message. Calls onToken, onTool, onDone, onError callbacks.
 */
export async function streamChat({ sessionId, message, birthDetails, onToken, onToolStart, onToolEnd, onDone, onError }) {
  const body = {
    session_id: sessionId,
    message,
    birth_details: birthDetails || null,
  }

  try {
    const res = await fetch(`${BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      onError?.(err)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue
        try {
          const event = JSON.parse(raw)
          if (event.type === 'token') onToken?.(event.content)
          else if (event.type === 'tool_start') onToolStart?.(event)
          else if (event.type === 'tool_end') onToolEnd?.(event)
          else if (event.type === 'done') onDone?.()
          else if (event.type === 'error') onError?.(event.message)
        } catch (_) {}
      }
    }
    onDone?.()
  } catch (err) {
    onError?.(err.message || 'Connection error')
  }
}
