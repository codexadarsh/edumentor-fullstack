// chatStorage.ts - Handles chat history storage operations
import type { Message } from "../types";

export interface ChatSession {
  id: string;
  title: string;
  lastUpdated: number;
  messages: Message[];
}

// Key for storing chat sessions in localStorage
const CHAT_STORAGE_KEY = 'edumentor_chat_sessions';

// Get all chat sessions from localStorage
export const getAllChatSessions = (): ChatSession[] => {
  try {
    const sessions = localStorage.getItem(CHAT_STORAGE_KEY);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Failed to get chat sessions from storage:', error);
    return [];
  }
};

// Save a new chat session
export const saveChatSession = (session: ChatSession): void => {
  try {
    const sessions = getAllChatSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      // Update existing session
      sessions[existingIndex] = session;
    } else {
      // Add new session
      sessions.push(session);
    }
    
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save chat session:', error);
  }
};

// Get a specific chat session by ID
export const getChatSession = (sessionId: string): ChatSession | null => {
  try {
    const sessions = getAllChatSessions();
    return sessions.find(session => session.id === sessionId) || null;
  } catch (error) {
    console.error('Failed to get chat session:', error);
    return null;
  }
};

// Delete a chat session
export const deleteChatSession = (sessionId: string): void => {
  try {
    const sessions = getAllChatSessions();
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedSessions));
  } catch (error) {
    console.error('Failed to delete chat session:', error);
  }
};

// Update chat session title
export const updateChatSessionTitle = (sessionId: string, newTitle: string): void => {
  try {
    const sessions = getAllChatSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex >= 0) {
      sessions[sessionIndex].title = newTitle;
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
    }
  } catch (error) {
    console.error('Failed to update chat session title:', error);
  }
};

// Generate a title for a chat based on the first few messages
export const generateChatTitle = (messages: Message[]): string => {
  // Find the first user message
  const firstUserMessage = messages.find(m => m.role === 'user');
  
  if (firstUserMessage) {
    // Limit to the first few words
    const title = firstUserMessage.content.substring(0, 30).trim();
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  }
  
  return `Chat ${new Date().toLocaleString()}`;
};