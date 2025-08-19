// ChatInterface.tsx
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
    <div className={`flex ${isModel ? "justify-start" : "justify-end"} mb-4 group`}>
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
            className={`absolute top-2 right-2 p-1.5 rounded-full
              ${copied ? "bg-green-100 text-green-600" : "text-gray-400 hover:text-gray-700 hover:bg-gray-200"}
              opacity-0 group-hover:opacity-100 transition-opacity`}
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

  const handleNewChat = () => {
    // Save current chat before starting new one
    if (messages.length > 1 && currentSessionId) {
      const title = generateChatTitle(messages);
      saveChatSession({
        id: currentSessionId,
        title,
        lastUpdated: Date.now(),
        messages
      });
    }
    setSidebarOpen(false);
    if (onNewChat) onNewChat();
  };

  const handleSelectChat = (session: ChatSession) => {
    setSidebarOpen(false);
    if (onLoadChat) onLoadChat(session.messages);
  };

  return (
    <div className="flex h-screen w-full bg-white">
      {/* Sidebar Menu - Always visible on desktop, toggle on mobile */}
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
      
      {/* Desktop Sidebar - Always visible */}
      <div className="hidden md:block w-1/4 border-r border-gray-200 h-full">
        <div className="p-4 border-b">
          <h2 className="font-bold text-xl">EduMentor</h2>
          <p className="text-sm text-gray-500">Your AI Tutor for Computer Networks</p>
        </div>
        <div className="h-[calc(100vh-80px)] overflow-hidden">
          <ChatSidebar 
            currentSessionId={currentSessionId}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
          />
        </div>
      </div>

      <div className="flex flex-col w-full md:w-3/4 h-full">
        {/* Chat Messages - Top section */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="text-gray-500 italic text-sm p-3 bg-gray-50 rounded-lg animate-pulse">
              Thinking...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Bottom Input Section */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            {/* Upload & Paste - Only show on empty chat or small number of messages */}
            {messages.length <= 2 && (
              <div className="flex flex-wrap gap-3 justify-center mb-4">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex-1 min-w-[160px] max-w-[200px] p-3 border rounded-xl shadow-sm hover:shadow-md flex flex-col items-start gap-2 bg-white transition-all"
                >
                  <FaUpload className="text-xl text-gray-700" />
                  <span className="text-md font-semibold">Upload</span>
                  <p className="text-xs text-gray-500">Upload the document</p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <button
                  onClick={handlePaste}
                  className="flex-1 min-w-[160px] max-w-[200px] p-3 border rounded-xl shadow-sm hover:shadow-md flex flex-col items-start gap-2 bg-white transition-all"
                >
                  <BiLinkAlt className="text-xl text-gray-700" />
                  <span className="text-md font-semibold">Paste</span>
                  <p className="text-xs text-gray-500">Copy from clipboard</p>
                </button>
              </div>
            )}

            {/* Prompt Input */}
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
              
              {/* Icons inside input */}
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
