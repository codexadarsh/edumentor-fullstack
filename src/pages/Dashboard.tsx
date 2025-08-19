import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import ChatInterface from "../components/ChatInterface";

import { useState, useCallback, useEffect } from "react";
import type { Message } from "../types";
import { runChatStream } from "../services/geminiService";
import { 
  saveChatSession, 
  generateChatTitle
} from "../lib/chatStorage";


// PDF.js imports and worker setup
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Chat state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "system",
      content:
        `Welcome ${user?.name || ""}! Upload a PDF to ask questions about it, or start chatting right away.`,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);

  /** Handle PDF file upload and parsing */
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (isLoading) return;

      setIsLoading(true);
      setError(null);
      setPdfText(null);

      // Reset chat but keep welcome message
      setMessages([
        {
          id: "init",
          role: "system",
          content: `Processing PDF: ${file.name}`,
        },
      ]);

      try {
        const arrayBuffer = await file.arrayBuffer();

        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          const pageText = textContent.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          fullText += `\n[Page ${i}]\n${pageText}\n`;
        }

        setPdfText(fullText);

        setMessages((prev) => [
          ...prev,
          {
            id: `pdf-done-${Date.now()}`,
            role: "system",
            content: `Successfully processed "${file.name}". You can now ask questions about it.`,
          },
        ]);
      } catch (e) {
        console.error("Error parsing PDF:", e);
        setError(
          "Failed to parse PDF. The file might be corrupt or unsupported."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  // Save chat to history when messages change
  useEffect(() => {
    if (messages.length > 1 && currentSessionId) {
      // Only save if we have more than just the initial system message
      const title = generateChatTitle(messages);
      
      saveChatSession({
        id: currentSessionId,
        title,
        lastUpdated: Date.now(),
        messages
      });
    }
  }, [messages, currentSessionId]);

  // Create a new chat session
  const handleNewChat = useCallback(() => {
    const newSessionId = `chat-${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages([
      {
        id: "init",
        role: "system",
        content: `Welcome ${user?.name || ""}! Upload a PDF to ask questions about it, or start chatting right away.`,
      },
    ]);
    setPdfText(null);
    setError(null);
  }, [user]);

  // Load an existing chat session
  const handleLoadChat = useCallback((chatMessages: Message[]) => {
    setMessages(chatMessages);
    setPdfText(null); // We would need additional logic to store PDF content
    setError(null);
  }, []);

  /** Handle sending a chat message */
  const handleSendMessage = useCallback(
    async (userInput: string) => {
      if (isLoading) return;

      setIsLoading(true);
      setError(null);

      // Create new chat session if this is the first message
      if (!currentSessionId) {
        const newSessionId = `chat-${Date.now()}`;
        setCurrentSessionId(newSessionId);
      }

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userInput,
      };

      const modelMessageId = `model-${Date.now()}`;
      const modelMessage: Message = {
        id: modelMessageId,
        role: "model",
        content: "",
      };

      setMessages((prev) => [...prev, userMessage, modelMessage]);

      try {
        const stream = await runChatStream(userInput, pdfText ?? undefined);

        for await (const chunk of stream) {
          const chunkText = chunk.text;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMessageId
                ? { ...m, content: m.content + chunkText }
                : m
            )
          );
        }
      } catch (e: unknown) {
        console.error("Chat stream error:", e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        setError(errorMessage);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === modelMessageId
              ? { ...m, content: "⚠️ Error generating response." }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, pdfText, currentSessionId]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">EduMentor Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.name}!
            </span>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          error={error}
          onNewChat={handleNewChat}
          onLoadChat={handleLoadChat}
          currentSessionId={currentSessionId}
        />
      </main>
    </div>
  );
};

export default Dashboard;