import React, { useRef, useState, useEffect } from "react";
import type { Message } from "../types";
import { IoIosSend } from "react-icons/io";
import { FaUpload, FaCopy } from "react-icons/fa";
import { BiLinkAlt } from "react-icons/bi";
import { saveChatSession, generateChatTitle } from "../lib/chatStorage";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import { MenuIcon } from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import type { ChatSession } from "../lib/chatStorage";

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File) => void;
  error: string | null;
  onNewChat?: () => void;
  onLoadChat?: (messages: Message[]) => void;
  currentSessionId?: string | null;
}

// Chat bubble
const ChatBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isModel = message.role === "model";
  const isSystem = message.role === "system";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full max-w-[80%]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isModel ? "justify-start" : "justify-end"} mb-4 group`}
    >
      <div
        className={`relative max-w-[85%] px-4 py-3 rounded-2xl text-left ${
          isModel
            ? "bg-gray-100 text-gray-900 rounded-bl-none shadow-sm"
            : "bg-black text-white rounded-br-none shadow-sm"
        }`}
      >
        <div className="whitespace-pre-wrap pr-6">{message.content}</div>
        {isModel && (
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-2 p-1.5 rounded-full ${
              copied
                ? "bg-green-100 text-green-600"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-200"
            } opacity-0 group-hover:opacity-100 transition-opacity`}
            title={copied ? "Copied!" : "Copy"}
          >
            <FaCopy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// Main UI
const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onFileUpload,
  error,
  onNewChat,
  onLoadChat,
  currentSessionId = null,
}) => {
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
    e.target.value = "";
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      console.error("Paste error:", err);
    }
  };

  // **Updated handleNewChat with Supabase support**
  const handleNewChat = async () => {
    if (messages.length > 1 && currentSessionId) {
      const title = generateChatTitle(messages);
      try {
        await saveChatSession({
          id: currentSessionId,
          title,
          lastUpdated: Date.now(),
          messages,
        });
      } catch (err) {
        console.error("Failed to save chat session:", err);
      }
    }
    setSidebarOpen(false);
    if (onNewChat) onNewChat();
  };

  const handleSelectChat = (session: ChatSession) => {
    setSidebarOpen(false);
    if (onLoadChat) onLoadChat(session.messages);
  };

  const suggestedQuestions = [
    "What is TCP/IP?",
    "Explain OSI model layers",
    "What is subnetting?",
    "Difference between hub, switch, router?",
  ];

  return (
    <div className="flex h-screen w-full bg-white">
      {/* Sidebar */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors">
            <MenuIcon className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="px-4 py-4 border-b">
              <SheetTitle>EduMentor</SheetTitle>
              <SheetDescription>
                Your AI Tutor for Computer Networks
              </SheetDescription>
            </SheetHeader>
            <div className="h-[calc(100vh-120px)] overflow-hidden">
              <ChatSidebar
                currentSessionId={currentSessionId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-1/4 border-r border-gray-200 h-full">
        <div className="p-4 border-b">
          <h2 className="font-bold text-xl">EduMentor</h2>
          <p className="text-sm text-gray-500">
            Your AI Tutor for Computer Networks
          </p>
        </div>
        <div className="h-[calc(100vh-80px)] overflow-hidden">
          <ChatSidebar
            currentSessionId={currentSessionId}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col w-full md:w-3/4 h-full">
        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 flex flex-col">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="text-gray-500 italic text-sm p-3 bg-gray-50 rounded-lg animate-pulse">
              Thinking...
            </div>
          )}

          {/* Centered Welcome Section */}
          {messages.length <= 2 && (
            <div className="flex flex-col items-center justify-center gap-6 h-[60vh] w-full">
              {/* Upload & Paste */}
              <div className="flex flex-wrap gap-6 justify-center">
                {/* Upload */}
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex-1 min-w-[180px] max-w-[220px] p-4 border border-gray-200 rounded-2xl shadow hover:shadow-lg transition-all transform hover:-translate-y-1 hover:scale-[1.02] bg-gradient-to-b from-white to-gray-50 flex flex-col items-center gap-3"
                >
                  <div className="p-3 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-200 shadow-md">
                    <FaUpload className="text-indigo-600 text-2xl" />
                  </div>
                  <span className="text-md font-semibold text-gray-800">
                    Upload File
                  </span>
                  <p className="text-xs text-gray-500 text-center">
                    Drag & drop or click to select your document
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {/* Paste */}
                <button
                  onClick={handlePaste}
                  className="flex-1 min-w-[180px] max-w-[220px] p-4 border border-gray-200 rounded-2xl shadow hover:shadow-lg transition-all transform hover:-translate-y-1 hover:scale-[1.02] bg-gradient-to-b from-white to-gray-50 flex flex-col items-center gap-3"
                >
                  <div className="p-3 rounded-full bg-gradient-to-tr from-green-100 to-green-200 shadow-md">
                    <BiLinkAlt className="text-green-600 text-2xl" />
                  </div>
                  <span className="text-md font-semibold text-gray-800">
                    Paste Text
                  </span>
                  <p className="text-xs text-gray-500 text-center">
                    Copy text from your clipboard
                  </p>
                </button>
              </div>

              {/* Suggested Questions */}
              <div className="flex flex-col items-center gap-3 w-full">
                <h3 className="text-gray-700 font-semibold text-lg">
                  Try these questions:
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(q)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-4 py-2 rounded-full shadow-sm transition-all hover:scale-105"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Section */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl p-3 flex items-center w-full shadow-sm border border-gray-200 relative"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="Type your question..."
                className="w-full bg-transparent p-2 pr-20 outline-none resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />

              {/* Input Icons */}
              <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <label
                  htmlFor="file-upload-inline"
                  className="cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
                  title="Upload file"
                >
                  <FaUpload className="text-gray-500 hover:text-gray-700 text-sm" />
                  <input
                    type="file"
                    id="file-upload-inline"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <button
                  type="button"
                  onClick={handlePaste}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
                  title="Paste from clipboard"
                >
                  <BiLinkAlt className="text-gray-500 hover:text-gray-700 text-sm" />
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="ml-2 bg-black hover:bg-gray-800 p-2 rounded-full disabled:opacity-50 transition-colors"
              >
                <IoIosSend className="text-white text-xl" />
              </button>
            </form>

            {error && (
              <div className="text-red-500 mt-3 text-sm p-2 bg-red-50 rounded border border-red-200">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
