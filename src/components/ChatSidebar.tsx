import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { 
  getAllChatSessions, 
  deleteChatSession, 
  updateChatSessionTitle,
} from '../lib/chatStorage';
import type { ChatSession } from '../lib/chatStorage';
import { PlusCircle, Trash2, Pencil, Save, X } from 'lucide-react';

interface ChatSidebarProps {
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (session: ChatSession) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  currentSessionId, 
  onNewChat, 
  onSelectChat 
}) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load chat sessions from localStorage and add refresh when visibility changes
  useEffect(() => {
    const loadSessions = () => {
      setChatSessions(getAllChatSessions());
    };
    
    // Initial load
    loadSessions();
    
    // Set up event listener for visibility change to refresh when user comes back
    document.addEventListener('visibilitychange', loadSessions);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', loadSessions);
    };
  }, []);

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      deleteChatSession(sessionId);
      setChatSessions(getAllChatSessions());
    }
  };

  const handleEditSession = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveTitle = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      updateChatSessionTitle(sessionId, editTitle.trim());
      setChatSessions(getAllChatSessions());
      setEditSessionId(null);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditSessionId(null);
  };
  
  // Get the last message from a session that's not a system message
  const getLastUserOrModelMessage = (session: ChatSession) => {
    return session.messages
      .filter(msg => msg.role !== 'system')
      .slice(-1)[0]?.content || '';
  };
  
  // Format the date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If it's today, just show the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If it's this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show the full date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter and sort sessions
  const filteredSessions = [...chatSessions]
    .filter(session => 
      searchTerm === '' || 
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getLastUserOrModelMessage(session).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.lastUpdated - a.lastUpdated);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 border-b bg-white">
        <Button 
          onClick={onNewChat} 
          variant="default" 
          className="w-full flex items-center justify-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <div className="p-3">
        <Input
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white"
        />
      </div>

      <div className="flex-1 overflow-auto px-3 py-2">
        <h3 className="mb-2 text-sm font-medium text-gray-500 px-2">
          {filteredSessions.length > 0 ? 'Recent Chats' : ''}
        </h3>
        
        {filteredSessions.length > 0 ? (
          <ul className="space-y-2">
            {filteredSessions.map((session) => (
              <li 
                key={session.id} 
                onClick={() => onSelectChat(session)}
                className={`
                  rounded-md cursor-pointer border
                  ${currentSessionId === session.id 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-white hover:bg-gray-100 border-transparent hover:border-gray-200'
                  }
                  transition-all duration-150 ease-in-out
                `}
              >
                {editSessionId === session.id ? (
                  <div className="flex items-center w-full p-3" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mr-2 flex-1"
                      autoFocus
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={(e) => handleSaveTitle(e, session.id)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium truncate flex-1">{session.title}</h4>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {formatDate(session.lastUpdated)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 truncate mb-2">
                      {getLastUserOrModelMessage(session).substring(0, 60)}
                      {getLastUserOrModelMessage(session).length > 60 ? '...' : ''}
                    </p>
                    
                    <div className="flex justify-end space-x-1 pt-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => handleEditSession(e, session)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-gray-500 py-8 bg-white rounded-lg p-6 shadow-sm">
            {searchTerm ? (
              <>
                <p>No matches found</p>
                <p className="text-xs mt-1">Try different search terms</p>
              </>
            ) : (
              <>
                <p>No chat history yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;