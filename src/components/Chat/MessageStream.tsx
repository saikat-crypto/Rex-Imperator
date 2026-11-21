import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '../../types';
import { BlockRenderer } from './RichBlocks/BlockRenderer';
import { TextBlock, RotatingSquareCursor } from './RichBlocks/TextBlock';
import { SourcesShelf } from './RichBlocks/SourcesShelf';
import { Copy, Check, ArrowDown } from 'lucide-react';
import type { SearchResult } from '../../utils/rag/ragEngine';

interface MessageStreamProps {
  messages: Message[];
  isStreaming: boolean;
  citationSources?: SearchResult[];
}

export const MessageStream: React.FC<MessageStreamProps> = ({
  messages,
  isStreaming,
  citationSources = [],
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pin state: tracks if user is anchored to the bottom
  const isPinnedToBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(messages.length);

  // Smooth or instant scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
    isPinnedToBottomRef.current = true;
    setShowScrollBottom(false);
  }, []);

  // Handle scroll events with precise user intent detection
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Within 90px of bottom is considered "at bottom"
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isAtBottom = distanceFromBottom < 90;

    isPinnedToBottomRef.current = isAtBottom;
    setShowScrollBottom(!isAtBottom);
  }, []);

  // When a new message is appended (e.g. user sends message or new response arrives)
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      // New message added: user explicitly expects to see the new message
      scrollToBottom(true);
      isPinnedToBottomRef.current = true;
      setShowScrollBottom(false);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // Keep anchored to bottom during live streaming without animation queue fighting
  useEffect(() => {
    if (isStreaming && isPinnedToBottomRef.current) {
      const container = scrollContainerRef.current;
      if (container) {
        // Instant scroll during token streaming prevents jitter and frame drops
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages, isStreaming]);

  // ResizeObserver: auto-adjust scroll when rich blocks, images, or accordions expand dynamically
  useEffect(() => {
    const content = contentWrapperRef.current;
    const container = scrollContainerRef.current;
    if (!content || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isPinnedToBottomRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });

    resizeObserver.observe(content);
    return () => resizeObserver.disconnect();
  }, []);

  const handleCopy = (content: string, id: string) => {
    // Strip citation markers before copying
    const cleanContent = content.replace(/\[\d+\]/g, '');
    navigator.clipboard.writeText(cleanContent);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col bg-white">
      {/* Top subtle gradient dissolve mask */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/90 to-transparent z-10" />

      {/* Scrollable conversation stream - Starts closer to the top clouds with generous vertical space */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto px-6 sm:px-12 md:px-20 lg:px-28 xl:px-36 pt-1.5 sm:pt-2 pb-8 space-y-6 sm:space-y-7 overscroll-contain custom-scrollbar"
        style={{ scrollBehavior: 'auto' }}
      >
        <div ref={contentWrapperRef} className="w-full space-y-6 sm:space-y-7">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end animate-fade-in">
                  <div className="max-w-[85%] sm:max-w-[70%]">
                    <div className="text-[13.5px] sm:text-[14px] font-normal leading-[1.58] text-[#181615] bg-[#F7F9FC] px-4 py-2.5 rounded-xl border border-black/[0.06] shadow-xs">
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // Assistant Message: Full-width, clean compact typography packed with high information density
            return (
              <div key={msg.id} className="w-full animate-fade-in group">
                {/* Output Content */}
                <div className="w-full text-[#181615] text-[14px] sm:text-[14.5px] leading-[1.64] font-normal tracking-[-0.005em]">
                  {msg.content ? (
                    <div className="relative break-words">
                      <TextBlock
                        content={msg.content}
                        sources={msg.sources && msg.sources.length > 0 ? msg.sources : citationSources}
                        isStreaming={msg.isStreaming}
                      />
                    </div>
                  ) : (
                    msg.isStreaming && (
                      <div className="relative py-1">
                        <RotatingSquareCursor />
                      </div>
                    )
                  )}

                  {/* Multimodal Rich Blocks (LaTeX, Graphs, OpenUI) */}
                  {msg.blocks && msg.blocks.length > 0 && (
                    <div className="mt-5 pt-2 w-full overflow-hidden">
                      <BlockRenderer blocks={msg.blocks} />
                    </div>
                  )}

                  {/* Verified Curriculum Sources Shelf */}
                  {!msg.isStreaming && (
                    (() => {
                      const effectiveSources =
                        msg.sources && msg.sources.length > 0
                          ? msg.sources
                          : /\[\d+\]/.test(msg.content || '') && citationSources && citationSources.length > 0
                          ? citationSources
                          : [];
                      return effectiveSources.length > 0 ? <SourcesShelf sources={effectiveSources} /> : null;
                    })()
                  )}

                  {/* Discreet actions bar on hover */}
                  {!msg.isStreaming && msg.content && (
                    <div className="mt-3 flex items-center gap-3 text-xs text-[#8A8478] opacity-0 group-hover:opacity-100 transition-opacity select-none">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="hover:text-[#181615] transition-colors flex items-center gap-1.5 py-0.5"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Floating Scroll to Bottom Indicator - Mathematically centered flex wrapper */}
      <AnimatePresence>
        {showScrollBottom && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-30">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.94 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="flex items-center gap-1.5 pl-3 pr-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-[12px] font-medium text-[#181615] border border-black/[0.08] shadow-soft-md hover:border-[#FCD702] transition-all active:scale-95 backdrop-blur-sm"
                title="Scroll to latest messages"
              >
                <ArrowDown className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Resume scroll</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
