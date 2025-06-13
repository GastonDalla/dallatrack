import { ofetch } from 'ofetch'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'routine' | 'exercise' | 'analysis' | 'general'
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  lastMessageAt: Date
}

export interface ChatResponse {
  chats: ChatSession[]
}

export async function fetchAIChats(limit: number = 20): Promise<ChatResponse> {
  const response = await ofetch<ChatResponse>(`/api/ai/chats?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  return {
    chats: response.chats.map(chat => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      lastMessageAt: new Date(chat.lastMessageAt),
      messages: chat.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }))
  }
}

export async function createAIChat(title?: string, messages?: Message[]): Promise<ChatSession> {
  const response = await ofetch<ChatSession>('/api/ai/chats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      action: 'create',
      title: title || 'Nueva Conversación',
      messages: messages || []
    }
  })

  return {
    ...response,
    createdAt: new Date(response.createdAt),
    lastMessageAt: new Date(response.lastMessageAt),
    messages: response.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }))
  }
}

export async function updateAIChat(
  id: string, 
  title: string, 
  messages: Message[]
): Promise<ChatSession> {
  const response = await ofetch<ChatSession>('/api/ai/chats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      action: 'update',
      id,
      title,
      messages
    }
  })

  return {
    ...response,
    createdAt: new Date(response.createdAt),
    lastMessageAt: new Date(response.lastMessageAt),
    messages: response.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }))
  }
}

export async function deleteAIChat(id: string): Promise<{ success: boolean }> {
  const response = await ofetch<{ success: boolean }>(`/api/ai/chats/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return response
}

export function generateChatTitle(firstMessage: string): string {
  const keywords = firstMessage.toLowerCase()
  
  if (keywords.includes('rutina') || keywords.includes('entrenamiento')) {
    return 'Rutina de Entrenamiento'
  } else if (keywords.includes('ejercicio') || keywords.includes('forma')) {
    return 'Consejos de Ejercicio'
  } else if (keywords.includes('nutrición') || keywords.includes('dieta')) {
    return 'Guía Nutricional'
  } else if (keywords.includes('progreso') || keywords.includes('análisis')) {
    return 'Análisis de Progreso'
  } else if (keywords.includes('peso') || keywords.includes('músculo')) {
    return 'Consulta Fitness'
  } else {
    
    const words = firstMessage.trim().split(' ').slice(0, 4)
    const title = words.join(' ')
    return title.length > 30 ? title.slice(0, 30) + '...' : title
  }
} 