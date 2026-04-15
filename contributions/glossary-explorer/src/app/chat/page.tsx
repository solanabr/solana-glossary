import ChatClient from "@/components/ChatClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask Solana - MCP Glossary Chat",
  description:
    "Chat with an AI assistant backed by live MCP tools across 1001 Solana glossary terms.",
};

export default function ChatPage() {
  return <ChatClient />;
}
