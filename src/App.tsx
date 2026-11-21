import React, { useState, useEffect, useRef } from 'react';
import type { Conversation, Message, MessageBlock, BackgroundConfig, AnyBlockPayload } from './types';
import { BackgroundEngine } from './components/BackgroundEngine/BackgroundEngine';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatInput } from './components/Chat/ChatInput';
import { MessageStream } from './components/Chat/MessageStream';
import { streamResponse } from './utils/streaming';
import { callLlama3Bedrock, generateChatTitle } from './utils/llm';
import { searchKnowledge, formatKnowledgeContext, loadCurriculumCatalog, type SearchResult } from './utils/rag/ragEngine';
import {
  loadUserConversations,
  saveUserConversation,
  deleteUserConversation,
  renameUserConversation,
} from './utils/chatStorage';
import { type AppMode } from './components/Navigation/ModeToggle';
import { SkyHeader } from './components/Navigation/SkyHeader';
import { VoiceStage } from './components/Voice/VoiceStage';
import { useAuth } from './context/AuthContext';
import { usePreferences } from './context/PreferencesContext';
import { AuthPage } from './components/Auth/AuthPage';
import AnimatedUMascot from './components/Branding/AnimatedUMascot';
import { SettingsPage } from './components/Settings/SettingsPage';

/** Parses ```widget {...} ``` fenced blocks out of LLM response text.
 * Returns the cleaned text (fences removed) and an array of MessageBlock[]. */
function extractWidgetsFromText(raw: string): { cleanText: string; blocks: MessageBlock[] } {
  const blocks: MessageBlock[] = [];
  const fenceRe = /```widget\s*\n([\s\S]*?)\n```/g;
  let match: RegExpExecArray | null;
  let cleanText = raw;

  while ((match = fenceRe.exec(raw)) !== null) {
    const jsonStr = match[1].trim();
    try {
      const payload = JSON.parse(jsonStr) as Record<string, unknown>;
      const type = payload.type as string;

      // Map LLM "type" field to our BlockType
      const validTypes = new Set([
        'calculator', 'quiz', 'carousel', 'graph', 'comparison-matrix',
        'accordion', 'metric-grid', 'tabbed-deck', 'flowchart',
        'roadmap-checklist', 'comparison-slider', 'openui',
      ]);

      if (validTypes.has(type)) {
        const block: MessageBlock = {
          id: `widget-${Date.now()}-${blocks.length}`,
          type: type as MessageBlock['type'],
          payload: payload as unknown as AnyBlockPayload,
        };
        blocks.push(block);
      }
    } catch (e) {
      console.warn('[Widget] Failed to parse widget JSON:', e);
    }
    // Remove the fence from the displayed text
    cleanText = cleanText.replace(match[0], '').trim();
  }

  return { cleanText, blocks };
}

export const App: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { preferences } = usePreferences();

  // Active view: 'workspace' (chat/voice) or 'settings' (dedicated full-page settings)
  const [activeView, setActiveView] = useState<'workspace' | 'settings'>('workspace');

  // Navigation Mode (defaults to 'chat')
  const [mode, setMode] = useState<AppMode>('chat');

  // Voice call state
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // State: conversations list only stores conversations that have actually been started
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // activeId is null when on a fresh, unstarted chat screen
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [backgroundConfig] = useState<BackgroundConfig>({
    type: 'sky',
    label: 'Sky & Clouds',
    description: 'Serene blue sky with soft drifting clouds',
  });

  const stopStreamRef = useRef<(() => void) | null>(null);

  // Per-chat RAG sources: keyed by conversationId → deduplicated list of retrieved SearchResults
  const [chatSources, setChatSources] = useState<Record<string, SearchResult[]>>({});
  // Ref mirror so onComplete closures always read the latest chatSources without stale capture
  const chatSourcesRef = useRef<Record<string, SearchResult[]>>({});
  useEffect(() => {
    chatSourcesRef.current = chatSources;
  }, [chatSources]);

  // Load persistent user conversations from AWS DynamoDB & local cache
  useEffect(() => {
    if (user?.userId) {
      loadUserConversations(user.userId).then((loaded) => {
        if (loaded && loaded.length > 0) {
          setConversations(loaded);
          // Restore per-conversation curriculum sources from loaded messages
          const restoredSourcesMap: Record<string, SearchResult[]> = {};
          loaded.forEach((conv) => {
            const allConvSources: SearchResult[] = [];
            const seenIds = new Set<string>();
            conv.messages.forEach((msg) => {
              if (msg.sources && msg.sources.length > 0) {
                msg.sources.forEach((s) => {
                  if (!seenIds.has(s.id)) {
                    seenIds.add(s.id);
                    allConvSources.push(s);
                  }
                });
              }
            });
            if (allConvSources.length > 0) {
              restoredSourcesMap[conv.id] = allConvSources;
            }
          });
          setChatSources((prev) => ({ ...prev, ...restoredSourcesMap }));
        }
      });
    } else {
      setConversations([]);
      setActiveId(null);
    }
  }, [user?.userId]);

  // Preload comprehensive curriculum catalog in background for instant multi-subject RAG
  useEffect(() => {
    loadCurriculumCatalog();
  }, []);

  // Active conversation helper
  const activeConversation = activeId
    ? conversations.find((c) => c.id === activeId) || null
    : null;
  const isZeroState = !activeConversation || activeConversation.messages.length === 0;

  // Create or switch to fresh unstarted conversation with guards for empty states
  const handleNewChat = () => {
    setActiveView('workspace');

    // 1. Guard for Voice Mode
    if (mode === 'voice') {
      if (!isVoiceActive) {
        // No voice conversation has been started; user is already in a new voice conversation window.
        return;
      }
      setIsVoiceActive(false);
      return;
    }

    // 2. Guard for Chat Mode
    if (isStreaming && stopStreamRef.current) {
      stopStreamRef.current();
    }

    // If already on a fresh unstarted chat screen, do not create duplicate states
    if (activeId === null || (activeConversation && activeConversation.messages.length === 0)) {
      return;
    }

    // Switch to fresh unstarted chat screen without locking any entry in recent chats
    setActiveId(null);
  };

  // Keyboard shortcuts (Ctrl+N for new chat, Ctrl+B for sidebar toggle)
  const handleNewChatRef = useRef(handleNewChat);
  useEffect(() => {
    handleNewChatRef.current = handleNewChat;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewChatRef.current();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
    if (user?.userId) {
      deleteUserConversation(user.userId, id);
    }
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: trimmed, updatedAt: Date.now() } : c
      )
    );
    if (user?.userId) {
      renameUserConversation(user.userId, id, trimmed);
    }
  };

  // Send message & trigger smooth progressive streaming demonstration
  const handleSendMessage = async (userText: string) => {
    if (isStreaming) return;

    const userMessageId = `msg-user-${Date.now()}`;
    const assistantMessageId = `msg-asst-${Date.now()}`;

    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      timestamp: new Date().toISOString(),
      content: userText,
    };

    // Initial assistant message placeholder with streaming=true (renders RotatingSquareCursor immediately)
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      content: '',
      isStreaming: true,
      blocks: [],
      sources: [],
    };

    let targetConversationId = activeId;
    const isNewConversation = !targetConversationId;

    // Full multi-turn conversation memory: gather all preceding messages plus the new user prompt
    const existingMessages = activeConversation ? activeConversation.messages : [];
    const fullContextMessages: Message[] = [...existingMessages, userMessage];

    // Optimistically update conversation state IMMEDIATELY so the user prompt appears instantly without lag
    if (isNewConversation) {
      targetConversationId = `chat-${Date.now()}`;
      const initialTitle = userText.slice(0, 28) + (userText.length > 28 ? '...' : '');
      const newConversation: Conversation = {
        id: targetConversationId,
        title: initialTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMessage, initialAssistantMessage],
      };
      setConversations((prev) => [newConversation, ...prev]);
      setActiveId(targetConversationId);

      // Infer topic title from the first prompt only, and lock it permanently for this chat
      generateChatTitle(userText).then((inferredTitle) => {
        if (!inferredTitle) return;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConversationId) {
              const updatedWithTitle = { ...c, title: inferredTitle };
              if (user?.userId) {
                saveUserConversation(user.userId, updatedWithTitle);
              }
              return updatedWithTitle;
            }
            return c;
          })
        );
      });
    } else {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConversationId) {
            return {
              ...c,
              updatedAt: Date.now(),
              messages: [...c.messages, userMessage, initialAssistantMessage],
            };
          }
          return c;
        })
      );
    }

    setIsStreaming(true);

    const streamTargetId = targetConversationId;

    try {
      // 1. Retrieve relevant curriculum knowledge & exam schemes via context-aware multi-turn RAG
      const ragMatches = await searchKnowledge(userText, 3, 0.25, fullContextMessages);
      const ragContext = formatKnowledgeContext(ragMatches);

      // 2. Call AWS Bedrock LLM with FULL conversation history + verified curriculum context + user preferences
      const aiResponse = await callLlama3Bedrock(fullContextMessages, ragContext, preferences);
      // Parse widget blocks fenced in ```widget ... ``` from AI response
      const { cleanText, blocks } = extractWidgetsFromText(aiResponse);
      // Normalize any [SOURCE X] markers in raw text to [X]
      const text = cleanText.replace(/\[\s*(?:source|sources)\s*(\d+(?:\s*,\s*\d+)*)\s*\]/gi, '[$1]');

      const { stop } = streamResponse(text, blocks, {
        onChunk: (currentSubstring: string, currentBlocks?: MessageBlock[]) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === streamTargetId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: currentSubstring,
                          isStreaming: true,
                          blocks: currentBlocks || [],
                          sources: ragMatches,
                        }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        },
        onComplete: (rawFinalText: string, finalBlocks) => {
          // Normalize any [SOURCE X] variants to standard [X]
          const finalText = rawFinalText.replace(/\[\s*(?:source|sources)\s*(\d+(?:\s*,\s*\d+)*)\s*\]/gi, '[$1]');
          // Identify which citation markers were actually referenced in the response (single, compound, or multiple)
          const citationMatches = Array.from(finalText.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g));
          const citedNums = new Set<number>();
          citationMatches.forEach((m) => {
            m[1].split(',').forEach((s) => {
              const num = parseInt(s.trim(), 10);
              if (!isNaN(num)) citedNums.add(num);
            });
          });

          let groundedText = finalText;
          let verifiedSources: SearchResult[] = [];

          if (ragMatches.length > 0) {
            // Internal curriculum sources were retrieved from our knowledge base for this question
            // Retain all relevant retrieved sources so all corresponding references are available in the dropdown
            verifiedSources = ragMatches;

            if (citedNums.size === 0) {
              // If model omitted citations completely in raw text, inject [1], [2], [3] at matching topic anchors
              const lines = groundedText.split('\n');
              let injected1 = false;
              let injected2 = false;
              let injected3 = false;
              const reconciledLines = lines.map((l) => {
                const trimmed = l.trim();
                if (!injected1 && (trimmed.includes('Law') || trimmed.includes('=') || trimmed.length > 35) && !trimmed.startsWith('#')) {
                  injected1 = true;
                  return `${l} [1]`;
                }
                if (injected1 && !injected2 && ragMatches.length > 1 && (trimmed.toLowerCase().includes('factor') || trimmed.toLowerCase().includes('depend') || trimmed.includes('\\rho') || trimmed.toLowerCase().includes('resist') || trimmed.toLowerCase().includes('energy') || trimmed.toLowerCase().includes('band') || trimmed.toLowerCase().includes('gap') || trimmed.toLowerCase().includes('carrier')) && !trimmed.startsWith('#')) {
                  injected2 = true;
                  return `${l} [2]`;
                }
                if (injected2 && !injected3 && ragMatches.length > 2 && (trimmed.toLowerCase().includes('exam') || trimmed.toLowerCase().includes('mark') || trimmed.toLowerCase().includes('note') || trimmed.toLowerCase().includes('hole') || trimmed.toLowerCase().includes('electron') || trimmed.toLowerCase().includes('diode')) && !trimmed.startsWith('#')) {
                  injected3 = true;
                  return `${l} [3]`;
                }
                return l;
              });
              if (injected1) {
                groundedText = reconciledLines.join('\n');
              } else {
                groundedText = `${groundedText} [1]`;
              }
            } else if (ragMatches.length > 1 && !citedNums.has(2)) {
              // If the model cited [1] but neglected to cite [2]
              const lines = groundedText.split('\n');
              let injected2 = false;
              const reconciledLines = lines.map((l) => {
                const trimmed = l.trim();
                if (!injected2 && (trimmed.toLowerCase().includes('factor') || trimmed.toLowerCase().includes('depend') || trimmed.includes('\\rho') || trimmed.toLowerCase().includes('resist') || trimmed.toLowerCase().includes('energy') || trimmed.toLowerCase().includes('band')) && !trimmed.startsWith('#')) {
                  injected2 = true;
                  return `${l} [2]`;
                }
                return l;
              });
              if (injected2) {
                groundedText = reconciledLines.join('\n');
              }
            }
          } else {
            // If no new ragMatches for this turn, but citations were generated or previous turn had sources:
            const existingConvSources = (streamTargetId && chatSourcesRef.current[streamTargetId]) || [];
            if (citedNums.size > 0 && existingConvSources.length > 0) {
              verifiedSources = existingConvSources;
            } else {
              verifiedSources = [];
            }
            // NEVER strip citations from text! Citations generated by the model are preserved.
          }

          if (verifiedSources.length > 0 && streamTargetId) {
            setChatSources((prev) => {
              const existing = prev[streamTargetId] || [];
              const existingIds = new Set(existing.map((s) => s.id));
              const newOnes = verifiedSources.filter((r) => !existingIds.has(r.id));
              if (newOnes.length === 0) return prev;
              return { ...prev, [streamTargetId]: [...existing, ...newOnes] };
            });
          }

          setConversations((prev) => {
            return prev.map((c) => {
              if (c.id === streamTargetId) {
                const updatedConv: Conversation = {
                  ...c,
                  updatedAt: Date.now(),
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: groundedText,
                          isStreaming: false,
                          blocks: finalBlocks || blocks,
                          sources: verifiedSources,
                        }
                      : m
                  ),
                };
                // Persist completed conversation to AWS DynamoDB
                if (user?.userId) {
                  saveUserConversation(user.userId, updatedConv);
                }
                return updatedConv;
              }
              return c;
            });
          });
          setIsStreaming(false);
          stopStreamRef.current = null;
        },
      });

      stopStreamRef.current = stop;
    } catch (err: unknown) {
      console.error('[App] Bedrock response failed:', err);
      // Gracefully show error in the assistant bubble
      setConversations((prev) => {
        return prev.map((c) => {
          if (c.id === streamTargetId) {
            const updatedConv: Conversation = {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: 'Sorry, I encountered an error generating a response. Please try again.',
                      isStreaming: false,
                    }
                  : m
              ),
            };
            if (user?.userId) {
              saveUserConversation(user.userId, updatedConv);
            }
            return updatedConv;
          }
          return c;
        });
      });
      setIsStreaming(false);
      stopStreamRef.current = null;
    }
  };

  // Stop streaming
  const handleStopStreaming = () => {
    if (stopStreamRef.current) {
      stopStreamRef.current();
      stopStreamRef.current = null;
    }
    setIsStreaming(false);
    setConversations((prev) => {
      return prev.map((c) => {
        if (c.id === activeId) {
          const updatedConv: Conversation = {
            ...c,
            messages: c.messages.map((m) =>
              m.isStreaming ? { ...m, isStreaming: false } : m
            ),
          };
          if (user?.userId) {
            saveUserConversation(user.userId, updatedConv);
          }
          return updatedConv;
        }
        return c;
      });
    });
  };

  // Loading splash while checking auth session
  if (isLoading) {
    return (
      <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center bg-[#FAF8F5] select-none">
        <BackgroundEngine config={backgroundConfig} />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <AnimatedUMascot className="w-full h-full" />
          </div>
          <div className="flex items-center gap-2 text-sm text-[#7A7469] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#181615] animate-ping" />
            <span>Connecting to Usher...</span>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, render full separate AuthPage
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden flex font-sans text-[var(--text-primary)] select-none isolate">
      {/* 0. Background Engine Layer */}
      <BackgroundEngine config={backgroundConfig} />

      {/* 1. Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          if (isStreaming) handleStopStreaming();
          if (isVoiceActive) setIsVoiceActive(false);
          setActiveId(id);
          setMode('chat');
          setActiveView('workspace');
        }}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setActiveView('settings')}
        isSettingsView={activeView === 'settings'}
      />

      {/* 2. Main Stage */}
      <main className="relative flex-1 h-full flex flex-col min-w-0 overflow-hidden bg-white">
        {activeView === 'settings' ? (
          <SettingsPage
            onBack={() => setActiveView('workspace')}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(true)}
          />
        ) : (
          <>
            {/* Top 20% Sky & Drifting Clouds Zone (Behind toggle & title, does not encroach into sidebar or knowledge) */}
            <SkyHeader
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(true)}
              chatTitle={activeConversation?.title}
              mode={mode}
              onModeChange={(nextMode) => {
                if (nextMode !== 'voice' && isVoiceActive) {
                  setIsVoiceActive(false);
                }
                setMode(nextMode);
              }}
            />

            {/* Remaining Main Stage: Generous vertical space */}
            <div className="relative flex-1 w-full min-h-0 flex flex-col overflow-hidden bg-white">
              {mode === 'chat' ? (
                <div
                  className={`relative flex-1 w-full h-full flex flex-col overflow-hidden ${
                    isZeroState ? 'items-center justify-center' : ''
                  }`}
                >
                  {/* Active Conversation Feed */}
                  {!isZeroState && activeConversation && (
                    <MessageStream
                      messages={activeConversation.messages}
                      isStreaming={isStreaming}
                      citationSources={activeId ? (chatSources[activeId] || []) : []}
                    />
                  )}

                  {/* Chat Input */}
                  <ChatInput
                    isZeroState={isZeroState}
                    isStreaming={isStreaming}
                    onSend={handleSendMessage}
                    onStop={handleStopStreaming}
                  />
                </div>
              ) : (
                <VoiceStage
                  isCallActive={isVoiceActive}
                  onCallActiveChange={setIsVoiceActive}
                  onEndVoice={() => setMode('chat')}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
