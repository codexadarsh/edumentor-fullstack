// chatStorage.ts - Handles chat history storage operations with Supabase
import { supabase } from "./supabaseClient"; // Make sure this file is configured
import type { Message } from "../types";

export interface ChatSession {
  id: string;
  title: string;
  lastUpdated: number;
  messages: Message[];
}

// Get all chat sessions from Supabase
export const getAllChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("last_updated", { ascending: false });

    if (error) throw error;
    return data as ChatSession[];
  } catch (error) {
    console.error("Failed to get chat sessions from Supabase:", error);
    return [];
  }
};

// Save or update a chat session
export const saveChatSession = async (session: ChatSession): Promise<void> => {
  try {
    const { error } = await supabase.from("chat_sessions").upsert(
      {
        id: session.id,
        title: session.title,
        last_updated: session.lastUpdated,
        messages: session.messages,
      },
      { onConflict: "id" } // Update if ID exists
    );

    if (error) throw error;
  } catch (error) {
    console.error("Failed to save chat session:", error);
  }
};

// Get a specific chat session by ID
export const getChatSession = async (
  sessionId: string
): Promise<ChatSession | null> => {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error) {
      if ((error as any).code === "PGRST116") return null; // Not found
      throw error;
    }

    return data as ChatSession;
  } catch (error) {
    console.error("Failed to get chat session:", error);
    return null;
  }
};

// Delete a chat session
export const deleteChatSession = async (sessionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to delete chat session:", error);
  }
};

// Update chat session title
export const updateChatSessionTitle = async (
  sessionId: string,
  newTitle: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("chat_sessions")
      .update({ title: newTitle, last_updated: Date.now() })
      .eq("id", sessionId);

    if (error) throw error;
  } catch (error) {
    console.error("Failed to update chat session title:", error);
  }
};

// Generate a title for a chat based on the first few messages
export const generateChatTitle = (messages: Message[]): string => {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (firstUserMessage) {
    const title = firstUserMessage.content.substring(0, 30).trim();
    return title.length < firstUserMessage.content.length
      ? `${title}...`
      : title;
  }
  return `Chat ${new Date().toLocaleString()}`;
};
