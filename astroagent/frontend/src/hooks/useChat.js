import { useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { createSession, streamChat } from '../utils/api'

export function useChat() {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeTools, setActiveTools] = useState([])
  const [error, setError] = useState(null)
  const [birthDetails, setBirthDetails] = useState(null)
  const streamingRef = useRef('')

  const initSession = useCallback(async () => {
    try {
      const { session_id } = await createSession()
      setSessionId(session_id)
      return session_id
    } catch (e) {
      setError('Could not connect to AstroAgent backend. Is it running on port 8000?')
      return null
    }
  }, [])

  const sendMessage = useCallback(async (text, bd = null) => {
    setError(null)
    let sid = sessionId
    if (!sid) {
      sid = await initSession()
      if (!sid) return
    }

    // Add user message
    const userMsg = { id: uuidv4(), role: 'user', content: text, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])

    // Placeholder for assistant streaming message
    const assistantId = uuidv4()
    streamingRef.current = ''
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
      ts: Date.now(),
    }])

    setIsStreaming(true)
    setActiveTools([])

    await streamChat({
      sessionId: sid,
      message: text,
      birthDetails: bd || birthDetails,
      onToken: (token) => {
        streamingRef.current += token
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: streamingRef.current } : m
        ))
      },
      onToolStart: (evt) => {
        setActiveTools(prev => [...prev, { name: evt.tool, status: 'running', input: evt.input }])
      },
      onToolEnd: (evt) => {
        setActiveTools(prev => prev.map(t =>
          t.name === evt.tool && t.status === 'running'
            ? { ...t, status: 'done' }
            : t
        ))
      },
      onDone: () => {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, streaming: false } : m
        ))
        setIsStreaming(false)
        setActiveTools([])
      },
      onError: (msg) => {
        setError(msg)
        setIsStreaming(false)
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, streaming: false, content: m.content || '✦ Something went wrong. Please try again.' }
            : m
        ))
      },
    })
  }, [sessionId, birthDetails, initSession])

  const saveBirthDetails = useCallback((details) => {
    setBirthDetails(details)
  }, [])

  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
    setBirthDetails(null)
    setActiveTools([])
    setError(null)
  }, [])

  return {
    messages,
    isStreaming,
    activeTools,
    error,
    birthDetails,
    sessionId,
    sendMessage,
    saveBirthDetails,
    clearChat,
    initSession,
  }
}
