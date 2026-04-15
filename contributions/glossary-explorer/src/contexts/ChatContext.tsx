"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "./LocaleContext";
import type { ChatMode } from "@/lib/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequestContext {
  pathname?: string;
  pageType?: string;
  focusId?: string;
  focusLabel?: string;
}

interface ChatContextValue {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
  submitMessage: (
    content?: string,
    context?: Partial<ChatRequestContext>,
  ) => Promise<void>;
  openWithPrompt: (
    prompt: string,
    context?: Partial<ChatRequestContext>,
  ) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function deriveContextFromPath(pathname: string): ChatRequestContext {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "category" && parts[1]) {
    return {
      pathname,
      pageType: "category",
      focusId: parts[1],
    };
  }

  if (parts[0] === "term" && parts[1]) {
    return {
      pathname,
      pageType: "term",
      focusId: parts[1],
    };
  }

  if (parts[0] === "explore") {
    return {
      pathname,
      pageType: "graph",
    };
  }

  if (parts[0] === "chat") {
    return {
      pathname,
      pageType: "chat",
    };
  }

  return {
    pathname,
    pageType: "home",
  };
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("normal");
  const messagesRef = useRef<ChatMessage[]>([]);
  const pendingContextRef = useRef<Partial<ChatRequestContext> | undefined>(
    undefined,
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const buildRequestContext = useCallback(
    (overrides?: Partial<ChatRequestContext>) => {
      return {
        ...deriveContextFromPath(pathname),
        ...overrides,
      };
    },
    [pathname],
  );

  const openWithPrompt = useCallback(
    (prompt: string, context?: Partial<ChatRequestContext>) => {
      pendingContextRef.current = context;
      setInput(prompt);
      setError(null);
      setIsOpen(true);
    },
    [],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    messagesRef.current = [];
    setInput("");
    setError(null);
  }, []);

  const submitMessage = useCallback(
    async (content?: string, context?: Partial<ChatRequestContext>) => {
      const nextContent = (content ?? input).trim();
      if (!nextContent || isLoading) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: nextContent,
      };

      const nextMessages = [...messagesRef.current, userMessage];
      const requestContext = buildRequestContext(
        context ?? pendingContextRef.current,
      );

      pendingContextRef.current = undefined;
      messagesRef.current = nextMessages;
      setMessages(nextMessages);
      setInput("");
      setIsOpen(true);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: nextMessages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
            locale,
            mode,
            context: requestContext,
          }),
        });

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Missing OPENAI_API_KEY. Set it in your environment variables."
              : `Error ${response.status}: ${response.statusText}`,
          );
        }

        const assistantId = crypto.randomUUID();
        let fullText = "";

        setMessages((current) => [
          ...current,
          { id: assistantId, role: "assistant", content: "" },
        ]);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Chat response stream was not available.");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          fullText += decoder.decode(value, { stream: true });
          setMessages((current) => {
            const updated = current.map((message) =>
              message.id === assistantId
                ? { ...message, content: fullText }
                : message,
            );
            messagesRef.current = updated;
            return updated;
          });
        }
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "An unexpected chat error occurred.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [buildRequestContext, input, isLoading, locale, mode],
  );

  const value = useMemo(
    () => ({
      messages,
      input,
      setInput,
      isLoading,
      error,
      isOpen,
      setIsOpen,
      mode,
      setMode,
      submitMessage,
      openWithPrompt,
      clearMessages,
    }),
    [
      clearMessages,
      error,
      input,
      isLoading,
      isOpen,
      messages,
      mode,
      openWithPrompt,
      submitMessage,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }

  return context;
}
