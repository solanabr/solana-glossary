"use client";

import { usePathname } from "next/navigation";
import ChatBubble from "./ChatBubble";
import ChatPanel from "./ChatPanel";
import { useChatContext } from "@/contexts/ChatContext";

export default function ChatWidget() {
  const pathname = usePathname();
  const { isOpen, setIsOpen, messages } = useChatContext();

  if (pathname === "/chat") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex items-end justify-end px-4 sm:inset-x-auto sm:right-4 sm:px-0">
      {isOpen ? (
        <div className="pointer-events-auto w-full sm:w-[420px]">
          <div className="h-[min(76vh,560px)] md:h-[520px]">
            <ChatPanel variant="widget" />
          </div>
        </div>
      ) : (
        <div className="pointer-events-auto">
          <ChatBubble
            hasMessages={messages.length > 0}
            onClick={() => setIsOpen(true)}
          />
        </div>
      )}
    </div>
  );
}
