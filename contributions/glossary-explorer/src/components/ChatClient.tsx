"use client";

import ChatPanel from "./ChatPanel";

export default function ChatClient() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ChatPanel variant="page" />
    </div>
  );
}
