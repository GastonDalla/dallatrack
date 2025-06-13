"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Brain, 
  Bot, 
  User, 
  Send, 
  Loader2, 
  Sparkles, 
  MessageCircle,
  Target,
  Dumbbell,
  TrendingUp,
  Calendar,
  Zap,
  Lightbulb,
  Clipboard,
  Trash2,
  Plus,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Edit2,
  Check,
  X as XIcon
} from 'lucide-react'
import { useTranslations } from '@/contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useChat } from '@ai-sdk/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  fetchAIChats, 
  createAIChat, 
  updateAIChat, 
  deleteAIChat,
  generateChatTitle,
  type Message,
  type ChatSession 
} from '@/lib/ai-chat'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import React from 'react'

export function AIPageClient() {
  const t = useTranslations()
  const router = useRouter()
  const { toast } = useToast()
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [editTitleDialogOpen, setEditTitleDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<ChatSession | null>(null)
  const [editTitleValue, setEditTitleValue] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(241, 245, 249, 0.1);
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(100, 116, 139, 0.3);
        border-radius: 3px;
        transition: background 0.2s ease;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 116, 139, 0.6);
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload,
    setMessages
  } = useChat({
    api: '/api/ai',
    onFinish: async (message) => {
      if (currentSessionId && messages.length > 0) {
        const allMessages = [...messages, message]
        const title = allMessages.length <= 2 
          ? generateChatTitle(allMessages[0]?.content || '') 
          : sessions.find(s => s.id === currentSessionId)?.title || 'Nueva Conversación'

        try {
          await updateChatMutation.mutateAsync({
            id: currentSessionId,
            title,
            messages: allMessages.map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date()
            }))
          })
        } catch (error) {
          console.error('Error saving conversation:', error)
        }
      }
    },
    onError: (error) => {
      console.error('Chat error:', error)
      toast({
        title: "Error",
        description: t.ai.errorSendingMessage,
        variant: "destructive"
      })
    }
  })

  const { 
    data: chatsData, 
    isLoading: isLoadingChats, 
    error: chatsError 
  } = useQuery({
    queryKey: ['ai-chats'],
    queryFn: () => fetchAIChats(30),
    retry: 2,
    staleTime: 30000, 
    gcTime: 300000, 
    refetchOnWindowFocus: false, 
    refetchOnMount: false 
  })

  const sessions = chatsData?.chats || []

  const createChatMutation = useMutation({
    mutationFn: ({ title, messages }: { title?: string; messages?: Message[] }) => 
      createAIChat(title, messages),
    onSuccess: (newSession) => {
      queryClient.setQueryData(['ai-chats'], (old: any) => ({
        chats: [newSession, ...(old?.chats || [])]
      }))
      setCurrentSessionId(newSession.id)
      setMessages([])
      setSidebarOpen(false) 
      toast({
        title: "Éxito",
        description: t.ai.conversationCreated
      })
    },
    onError: (error) => {
      console.error('Error creating chat:', error)
      toast({
        title: "Error",
        description: t.ai.errorCreatingConversation,
        variant: "destructive"
      })
    }
  })

  const updateChatMutation = useMutation({
    mutationFn: ({ id, title, messages }: { id: string; title: string; messages: Message[] }) =>
      updateAIChat(id, title, messages),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(['ai-chats'], (old: any) => ({
        chats: (old?.chats || []).map((chat: ChatSession) => 
          chat.id === updatedSession.id ? updatedSession : chat
        )
      }))
    },
    onError: (error) => {
      console.error('Error updating chat:', error)
      toast({
        title: "Error",
        description: t.ai.errorSavingConversation,
        variant: "destructive"
      })
    }
  })

  const deleteChatMutation = useMutation({
    mutationFn: deleteAIChat,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['ai-chats'], (old: any) => ({
        chats: (old?.chats || []).filter((chat: ChatSession) => chat.id !== deletedId)
      }))
      if (currentSessionId === deletedId) {
        setCurrentSessionId(null)
        setMessages([])
      }
      toast({
        title: "Éxito",
        description: t.ai.conversationDeleted
      })
    },
    onError: (error) => {
      console.error('Error deleting chat:', error)
      toast({
        title: "Error",
        description: t.ai.errorDeletingConversation,
        variant: "destructive"
      })
    }
  })

  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await fetch(`/api/ai/chats/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar título')
      }

      return response.json()
    },
    onSuccess: (updatedSession) => {
      const sessionWithDates = {
        ...updatedSession,
        createdAt: updatedSession.createdAt ? new Date(updatedSession.createdAt) : new Date(),
        lastMessageAt: updatedSession.lastMessageAt ? new Date(updatedSession.lastMessageAt) : new Date(),
        messages: (updatedSession.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }))
      }

      queryClient.setQueryData(['ai-chats'], (old: any) => ({
        chats: (old?.chats || []).map((chat: ChatSession) => 
          chat.id === updatedSession.id ? sessionWithDates : chat
        )
      }))
      setEditTitleDialogOpen(false)
      setEditingSession(null)
      setEditTitleValue('')
      toast({
        title: "Éxito",
        description: t.ai.titleUpdated
      })
    },
    onError: (error) => {
      console.error('Error updating title:', error)
      toast({
        title: "Error",
        description: t.ai.errorSavingConversation,
        variant: "destructive"
      })
    }
  })

  const handleCreateNewSession = useCallback(() => {
    createChatMutation.mutate({ title: t.ai.newConversation })
  }, [createChatMutation, t.ai.newConversation])

  const handleLoadSession = useCallback((session: ChatSession) => {
    setCurrentSessionId(session.id)
    setMessages(session.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.timestamp
    })))
    setSidebarOpen(false)
  }, [setMessages])

  const handleDeleteSession = useCallback((sessionId: string) => {
    setSessionToDelete(sessionId)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteCurrentSession = useCallback(() => {
    if (currentSessionId) {
      setSessionToDelete(currentSessionId)
      setDeleteDialogOpen(true)
    }
  }, [currentSessionId])

  const confirmDeleteSession = useCallback(() => {
    if (sessionToDelete) {
      deleteChatMutation.mutate(sessionToDelete)
      setDeleteDialogOpen(false)
      setSessionToDelete(null)
    }
  }, [sessionToDelete, deleteChatMutation])

  const cancelDeleteSession = useCallback(() => {
    setDeleteDialogOpen(false)
    setSessionToDelete(null)
  }, [])

  const handleStartEditTitle = useCallback((session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSession(session)
    setEditTitleValue(session.title)
    setEditTitleDialogOpen(true)
  }, [])

  const handleSaveTitle = useCallback(() => {
    if (editingSession && editTitleValue.trim() && editTitleValue.trim() !== editingSession.title) {
      updateTitleMutation.mutate({ id: editingSession.id, title: editTitleValue.trim() })
    } else {
      setEditTitleDialogOpen(false)
      setEditingSession(null)
      setEditTitleValue('')
    }
  }, [editTitleValue, editingSession, updateTitleMutation])

  const handleCancelEditTitle = useCallback(() => {
    setEditTitleDialogOpen(false)
    setEditingSession(null)
    setEditTitleValue('')
  }, [])

  const handleTitleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEditTitle()
    }
  }, [handleSaveTitle, handleCancelEditTitle])

  useEffect(() => {
    if (editTitleDialogOpen && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editTitleDialogOpen])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const migrateLocalStorageChats = async () => {
      const savedSessions = localStorage.getItem('ai-chat-sessions')
      const migrationDone = localStorage.getItem('ai-chats-migrated')
      
      if (savedSessions && !migrationDone && !isLoadingChats) {
        try {
          const parsed = JSON.parse(savedSessions)
          console.log('Migrando', parsed.length, 'chats de localStorage a la base de datos...')
          
          for (const session of parsed) {
            try {
              await createAIChat(session.title, session.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              })))
            } catch (error) {
              console.error('Error migrando chat:', error)
            }
          }
          
          localStorage.setItem('ai-chats-migrated', 'true')
          localStorage.removeItem('ai-chat-sessions')
          queryClient.invalidateQueries({ queryKey: ['ai-chats'] })
          
          toast({
            title: "Éxito",
            description: 'Chats migrados exitosamente a la base de datos'
          })
        } catch (error) {
          console.error('Error durante la migración:', error)
        }
      }
    }

    migrateLocalStorageChats()
  }, [isLoadingChats, queryClient, toast])

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentSessionId) {
      try {
        const newSession = await createChatMutation.mutateAsync({ 
          title: generateChatTitle(input) 
        })
        setCurrentSessionId(newSession.id)
      } catch (error) {
        toast({
          title: "Error",
          description: 'Error al crear la conversación',
          variant: "destructive"
        })
        return
      }
    }
    
    handleSubmit(e)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCustomSubmit(e as any)
    }
  }

  const handleFeatureClick = (feature: typeof AI_FEATURES[0]) => {
    router.push(feature.link)
  }

  const AI_FEATURES = [
    {
      id: 'routine-generator',
      icon: Dumbbell,
      title: t.ai.routineGeneratorCard,
      description: t.ai.routineGeneratorCardDesc,
      link: '/dashboard/ai/routine-generator'
    },
    {
      id: 'form-analysis',
      icon: Target,
      title: t.ai.formAnalysisCard,
      description: t.ai.formAnalysisCardDesc,
      link: '/dashboard/ai/form-analysis'
    }
  ]

  const SidebarContent = () => (
    <div className="space-y-4 h-full flex flex-col overflow-hidden">
      {/* Nueva Conversación */}
      <Button onClick={handleCreateNewSession} className="w-full gap-2 flex-shrink-0" size="sm">
        <Plus className="h-4 w-4" />
        {t.ai.newConversation}
      </Button>

      {/* Historial de Conversaciones - Usa todo el espacio disponible */}
      <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium text-foreground">
                {t.ai.historyOfConversations}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {sessions.length} {t.ai.conversationCount}{sessions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <div 
            className="max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#64748b20 transparent',
            }}
          >
            <div className="p-3 space-y-2 pb-4">
              {isLoadingChats ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    <div className="text-sm text-muted-foreground">{t.common.loading}</div>
                  </div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="space-y-3">
                    <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {t.ai.noConversationsYet}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.ai.startFirstConversation}
                      </div>
                    </div>
                    <Button onClick={handleCreateNewSession} size="sm" className="gap-2">
                      <Plus className="h-3 w-3" />
                      {t.ai.newConversation}
                    </Button>
                  </div>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group rounded-lg transition-colors hover:bg-muted/50 relative",
                      currentSessionId === session.id && "bg-primary/5 border border-primary/20"
                    )}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-3 hover:bg-transparent"
                      onClick={() => handleLoadSession(session)}
                    >
                      <div className="flex items-start gap-3 w-full min-w-0">
                        <div className={cn(
                          "p-2 rounded-md flex-shrink-0",
                          currentSessionId === session.id 
                            ? "bg-primary/15 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className={cn(
                              "text-sm font-medium leading-tight flex-1 min-w-0 pr-8",
                              currentSessionId === session.id ? "text-primary" : "text-foreground"
                            )}>
                              {session.title}
                            </h4>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(() => {
                              try {
                                const lastMessageDate = session.lastMessageAt instanceof Date 
                                  ? session.lastMessageAt 
                                  : new Date(session.lastMessageAt)
                                
                                if (isNaN(lastMessageDate.getTime())) {
                                  return 'Fecha no válida'
                                }
                                
                                return lastMessageDate.toLocaleDateString('es-ES', { 
                                  day: 'numeric', 
                                  month: 'short'
                                })
                              } catch (error) {
                                console.error('Error formateando fecha:', error, session.lastMessageAt)
                                return 'Fecha no disponible'
                              }
                            })()} • {session.messages.length} {t.common.messages}{session.messages.length !== 1 ? '' : ''}
                          </div>
                        </div>
                      </div>
                    </Button>
                    
                    {/* Botones de acción */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSession(session.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl mb-16 md:mb-0">
      {/* Header mejorado */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center gap-4">
            <div className="p-2 lg:p-3 bg-primary/10 rounded-lg">
              <Brain className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
                {t.ai.title}
              </h1>
              <p className="text-sm lg:text-base text-muted-foreground hidden sm:block">
                {t.ai.personalAssistant}
              </p>
            </div>
          </div>
          
          {/* Botón de menú mobile */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Herramientas IA - Sección compacta */}
        <div className="mb-6 lg:mb-8">
          <div className="text-center mb-4">
            <h2 className="text-base lg:text-lg font-semibold text-foreground mb-1 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
              {t.ai.aiTools}
            </h2>
            <p className="text-xs lg:text-sm text-muted-foreground">
              {t.ai.powerUpTraining}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 max-w-3xl mx-auto">
            {AI_FEATURES.map((feature) => (
              <Card 
                key={feature.id}
                className="hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer border hover:border-primary/30 group"
                onClick={() => handleFeatureClick(feature)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg group-hover:from-primary/15 group-hover:to-primary/8 transition-all duration-200">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground group-hover:text-primary/70 transition-colors">
                        {feature.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Estadísticas */}
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 transition-all",
          currentSessionId && "hidden lg:grid"
        )}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="p-2 lg:p-3 bg-primary/10 rounded-lg">
                  <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold">{sessions.length}</p>
                  <p className="text-sm lg:text-base text-muted-foreground">{t.ai.conversations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="p-2 lg:p-3 bg-primary/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold">{messages.length}</p>
                  <p className="text-sm lg:text-base text-muted-foreground">{t.ai.activeMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="p-2 lg:p-3 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl lg:text-3xl font-bold">{AI_FEATURES.length}</p>
                  <p className="text-sm lg:text-base text-muted-foreground">{t.ai.aiTools}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-350px)] lg:h-[650px] xl:h-[700px] max-h-[700px]">
        {/* Sidebar desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="h-full p-4 lg:p-6 bg-background border rounded-lg overflow-hidden">
            <SidebarContent />
          </div>
        </div>

        {/* Sidebar mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-50"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="lg:hidden fixed left-0 top-0 h-full w-80 bg-background border-r z-50 p-4"
              >
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Área Principal del Chat */}
        <div className="lg:col-span-3 flex flex-col min-w-0">
          {currentSessionId ? (
            <Card className="flex-1 flex flex-col min-h-0">
              {/* Header del Chat */}
              <CardHeader className="border-b flex-shrink-0 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                    <Avatar className="h-10 w-10 lg:h-12 lg:w-12 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5 lg:h-6 lg:w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="text-lg lg:text-xl truncate">
                        {sessions.find(s => s.id === currentSessionId)?.title}
                      </CardTitle>
                      <p className="text-sm lg:text-base text-muted-foreground">
                        {t.ai.fitnessTraining}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="gap-1">
                      <MessageCircle className="h-3 w-3 lg:h-4 lg:w-4" />
                      {messages.length}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const currentSession = sessions.find(s => s.id === currentSessionId)
                        if (currentSession) {
                          handleStartEditTitle(currentSession, { stopPropagation: () => {} } as React.MouseEvent)
                        }
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={handleDeleteCurrentSession}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Área de Mensajes */}
              <CardContent className="flex-1 p-0 min-h-0">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                  <div className="p-4 lg:p-6 xl:p-8 space-y-4 lg:space-y-6">
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "flex gap-3 lg:gap-4 xl:gap-6",
                            message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                          )}
                        >
                          <Avatar className="h-8 w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 flex-shrink-0">
                            {message.role === 'assistant' ? (
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                <Bot className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                              </AvatarFallback>
                            ) : (
                              <AvatarFallback className="bg-secondary">
                                <User className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className={cn(
                            "flex-1 max-w-[85%] lg:max-w-[75%] xl:max-w-[70%]",
                            message.role === 'user' && 'text-right'
                          )}>
                            <div className={cn(
                              "rounded-2xl p-3 lg:p-4 xl:p-5",
                              message.role === 'assistant'
                                ? 'bg-muted border'
                                : 'bg-primary text-primary-foreground'
                            )}>
                              {message.role === 'assistant' ? (
                                <div className="prose prose-sm lg:prose-base max-w-none">
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      code: ({ children, className, ...props }: any) => {
                                        const isInline = !className?.includes('language-')
                                        return isInline ? (
                                          <code className="bg-background px-1 py-0.5 rounded text-sm font-mono border" {...props}>
                                            {children}
                                          </code>
                                        ) : (
                                          <pre className="bg-background p-3 lg:p-4 rounded-lg overflow-x-auto my-2 lg:my-3 border text-sm lg:text-base">
                                            <code className="font-mono" {...props}>
                                              {children}
                                            </code>
                                          </pre>
                                        )
                                      },
                                      blockquote: ({ children }: any) => (
                                        <blockquote className="border-l-4 border-primary pl-3 lg:pl-4 italic my-2 lg:my-3 bg-background/50 py-2 lg:py-3 rounded-r-lg text-sm lg:text-base">
                                          {children}
                                        </blockquote>
                                      ),
                                      table: ({ children }: any) => (
                                        <div className="overflow-x-auto my-2 lg:my-3">
                                          <table className="min-w-full border-collapse border border-border rounded-lg overflow-hidden text-sm lg:text-base">
                                            {children}
                                          </table>
                                        </div>
                                      ),
                                      th: ({ children }: any) => (
                                        <th className="border border-border bg-muted px-2 lg:px-3 py-1 lg:py-2 text-left font-semibold text-xs lg:text-sm">
                                          {children}
                                        </th>
                                      ),
                                      td: ({ children }: any) => (
                                        <td className="border border-border px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm">
                                          {children}
                                        </td>
                                      ),
                                      ul: ({ children }: any) => (
                                        <ul className="list-disc list-inside my-2 lg:my-3 space-y-1 pl-2 text-sm lg:text-base">
                                          {children}
                                        </ul>
                                      ),
                                      ol: ({ children }: any) => (
                                        <ol className="list-decimal list-inside my-2 lg:my-3 space-y-1 pl-2 text-sm lg:text-base">
                                          {children}
                                        </ol>
                                      ),
                                      li: ({ children }: any) => (
                                        <li className="text-sm lg:text-base leading-relaxed">
                                          {children}
                                        </li>
                                      ),
                                      h1: ({ children }: any) => (
                                        <h1 className="text-lg lg:text-xl font-bold my-2 lg:my-3">
                                          {children}
                                        </h1>
                                      ),
                                      h2: ({ children }: any) => (
                                        <h2 className="text-base lg:text-lg font-semibold my-2 lg:my-3">
                                          {children}
                                        </h2>
                                      ),
                                      h3: ({ children }: any) => (
                                        <h3 className="text-sm lg:text-base font-semibold my-2">
                                          {children}
                                        </h3>
                                      ),
                                      p: ({ children }: any) => (
                                        <p className="my-1 lg:my-2 leading-relaxed text-sm lg:text-base">
                                          {children}
                                        </p>
                                      ),
                                      strong: ({ children }: any) => (
                                        <strong className="font-semibold">
                                          {children}
                                        </strong>
                                      ),
                                      em: ({ children }: any) => (
                                        <em className="italic">
                                          {children}
                                        </em>
                                      )
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <div className="whitespace-pre-wrap text-sm lg:text-base">
                                  {message.content}
                                </div>
                              )}
                            </div>
                            <div className="text-xs lg:text-sm text-muted-foreground mt-1 lg:mt-2">
                              {message.createdAt?.toLocaleTimeString() || new Date().toLocaleTimeString()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Indicador de escritura */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 lg:gap-4 xl:gap-6"
                      >
                        <Avatar className="h-8 w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted border rounded-2xl p-3 lg:p-4 xl:p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                            <span className="text-sm lg:text-base text-muted-foreground">
                              {t.ai.thinking}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input mejorado */}
              <div className="border-t p-4 lg:p-6 flex-shrink-0">
                <div className="flex gap-3 lg:gap-4">
                  <Textarea
                    ref={inputRef}
                    placeholder={t.ai.messageInputPlaceholder}
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="flex-1 min-h-[48px] lg:min-h-[56px] max-h-[120px] lg:max-h-[160px] resize-none text-sm lg:text-base"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleCustomSubmit}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-[48px] w-[48px] lg:h-[56px] lg:w-[56px] flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 lg:h-5 lg:w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
              <div className="text-center space-y-6 lg:space-y-8 max-w-md lg:max-w-2xl">
                <div className="mx-auto w-24 h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sparkles className="h-12 w-12 lg:h-16 lg:w-16 xl:h-20 xl:w-20 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 lg:mb-4">
                    {t.ai.welcomeAITitle}
                  </h3>
                  <p className="text-muted-foreground text-base lg:text-lg xl:text-xl leading-relaxed">
                    {t.ai.welcomeAIDescription}
                  </p>
                </div>
                <div className="flex flex-col gap-4 lg:gap-6">
                  <Button onClick={handleCreateNewSession} className="gap-2 h-12 lg:h-14 text-base lg:text-lg" size="lg">
                    <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6" />
                    {t.ai.startConversation}
                  </Button>
                  <div className="text-sm lg:text-base text-muted-foreground">
                    {t.ai.orUseSpecializedTools}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog para editar título */}
      <Dialog open={editTitleDialogOpen} onOpenChange={setEditTitleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.ai.editChatTitle}</DialogTitle>
            <DialogDescription>
              {t.ai.editChatTitleDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              ref={titleInputRef}
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onKeyDown={handleTitleKeyPress}
              placeholder={t.ai.chatTitlePlaceholder}
              maxLength={100}
              className="w-full"
            />
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancelEditTitle}>
              {t.common.cancel}
            </Button>
            <Button 
              onClick={handleSaveTitle}
              disabled={!editTitleValue.trim() || updateTitleMutation.isPending}
            >
              {updateTitleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t.ai.saving}
                </>
              ) : (
                t.common.save
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.ai.deleteConversation}</DialogTitle>
            <DialogDescription>
              {t.ai.deleteConversationDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={cancelDeleteSession}>
              {t.ai.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSession}>
              {t.ai.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 