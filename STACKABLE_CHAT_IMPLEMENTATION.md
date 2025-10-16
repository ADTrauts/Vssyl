# Stackable Chat Window Implementation Strategy

**Date**: October 16, 2025  
**Goal**: Implement LinkedIn-style stackable chat windows with cycling behavior

## 🎯 **Target UX Behavior**

### **Visual Layout**
```
┌─────────────────┬─────────────────────────────────────────────┐
│   Chat Sidebar  │              Main Chat Window              │
│                 │                                             │
│ ○ Lisa Williams │  ┌─────────────────────────────────────┐    │
│ ○ Joseph Sauer  │  │         Joseph Sauer               │    │
│ ○ Rashien...    │  │  ┌─────────────────────────────┐    │    │
│                 │  │  │     Message content...      │    │    │
│ [Search]        │  │  │                             │    │    │
│                 │  │  └─────────────────────────────┘    │    │
│ Focused | Other │  └─────────────────────────────────────┘    │
└─────────────────┴─────────────────────────────────────────────┘
                            ▲
                    ┌───────┴───────┐
                    │  Lisa (min)   │  ← Minimized stack
                    │  Rashien(min) │
                    └───────────────┘
```

### **Interaction Flow**

1. **Initial State**: Thin sidebar, no open chats
2. **Click Chat 1**: Opens to side, sidebar remains
3. **Click Chat 2**: Chat 1 minimizes → bubble, Chat 2 opens
4. **Click Chat 3**: Chat 1 & 2 stack as bubbles, Chat 3 opens
5. **Click Bubble**: That chat opens, previous main joins stack
6. **Cycle**: Seamless switching between all conversations

---

## 🏗️ **Technical Architecture**

### **State Management**

```typescript
interface ChatWindowState {
  // Main active chat (full window)
  activeChat: Conversation | null;
  
  // Stack of minimized chats (bubbles)
  minimizedChats: Conversation[];
  
  // Sidebar state
  isSidebarOpen: boolean;
  sidebarWidth: 'thin' | 'expanded';
  
  // Window positions and sizes
  windowPositions: Map<string, { x: number; y: number }>;
  windowSizes: Map<string, { width: number; height: number }>;
}

// Global state
const [chatState, setChatState] = useState<ChatWindowState>({
  activeChat: null,
  minimizedChats: [],
  isSidebarOpen: true,
  sidebarWidth: 'thin',
  windowPositions: new Map(),
  windowSizes: new Map()
});
```

### **Core Functions**

```typescript
// Open a chat (main window)
const openChat = (conversation: Conversation) => {
  setChatState(prev => {
    const newState = { ...prev };
    
    // If there's an active chat, minimize it
    if (prev.activeChat) {
      newState.minimizedChats = [prev.activeChat, ...prev.minimizedChats];
    }
    
    // Set new active chat
    newState.activeChat = conversation;
    
    return newState;
  });
};

// Minimize a chat (add to stack)
const minimizeChat = (conversation: Conversation) => {
  setChatState(prev => ({
    ...prev,
    activeChat: null,
    minimizedChats: [conversation, ...prev.minimizedChats]
  }));
};

// Restore from minimized stack
const restoreChat = (conversation: Conversation) => {
  setChatState(prev => {
    // Remove from minimized stack
    const updatedMinimized = prev.minimizedChats.filter(c => c.id !== conversation.id);
    
    // If there's an active chat, minimize it
    const newMinimized = prev.activeChat 
      ? [prev.activeChat, ...updatedMinimized]
      : updatedMinimized;
    
    return {
      ...prev,
      activeChat: conversation,
      minimizedChats: newMinimized
    };
  });
};

// Close a chat completely
const closeChat = (conversation: Conversation) => {
  setChatState(prev => ({
    ...prev,
    activeChat: prev.activeChat?.id === conversation.id ? null : prev.activeChat,
    minimizedChats: prev.minimizedChats.filter(c => c.id !== conversation.id)
  }));
};
```

---

## 🎨 **Component Structure**

### **1. ChatSidebar Component**

```typescript
interface ChatSidebarProps {
  conversations: Conversation[];
  activeChat: Conversation | null;
  onChatSelect: (conversation: Conversation) => void;
  onToggleSidebar: () => void;
  width: 'thin' | 'expanded';
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeChat,
  onChatSelect,
  onToggleSidebar,
  width
}) => {
  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30 transition-all duration-300 ${
      width === 'thin' ? 'w-16' : 'w-80'
    }`}>
      {width === 'thin' ? (
        // Thin view - just avatars
        <div className="p-2 space-y-2">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => onChatSelect(conv)}
              className={`w-12 h-12 rounded-full relative ${
                activeChat?.id === conv.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <Avatar src={conv.avatar} name={conv.name} size={48} />
              {conv.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {conv.unreadCount}
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        // Expanded view - full conversation list
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messaging</h2>
            <button onClick={onToggleSidebar}>←</button>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search messages"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex border-b border-gray-200 mb-4">
            <button className="flex-1 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              Focused
            </button>
            <button className="flex-1 py-2 text-sm text-gray-600">
              Other
            </button>
          </div>
          
          <div className="space-y-2">
            {conversations.map(conv => (
              <ChatSidebarItem
                key={conv.id}
                conversation={conv}
                isActive={activeChat?.id === conv.id}
                onClick={() => onChatSelect(conv)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### **2. ChatWindow Component**

```typescript
interface ChatWindowProps {
  conversation: Conversation;
  isMinimized: boolean;
  onMinimize: () => void;
  onRestore: () => void;
  onClose: () => void;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  isMinimized,
  onMinimize,
  onRestore,
  onClose,
  position,
  size
}) => {
  if (isMinimized) {
    // Minimized bubble
    return (
      <div
        className="fixed bottom-4 right-4 w-16 h-16 bg-blue-500 rounded-full shadow-lg cursor-pointer z-40 flex items-center justify-center"
        onClick={onRestore}
        style={{
          right: `${position?.x || 20}px`,
          bottom: `${position?.y || 20}px`
        }}
      >
        <Avatar src={conversation.avatar} name={conversation.name} size={40} />
        {conversation.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {conversation.unreadCount}
          </div>
        )}
      </div>
    );
  }

  // Full chat window
  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-20 flex flex-col"
      style={{
        left: '320px', // Next to sidebar
        top: '20px',
        width: size?.width || 600,
        height: size?.height || 500
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar src={conversation.avatar} name={conversation.name} size={32} />
          <div>
            <h3 className="font-medium">{conversation.name}</h3>
            <p className="text-sm text-gray-500">Online</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={onMinimize} className="p-1 hover:bg-gray-100 rounded">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Write a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
```

### **3. StackableChatContainer Component**

```typescript
const StackableChatContainer: React.FC = () => {
  const { conversations } = useChat();
  const [chatState, setChatState] = useState<ChatWindowState>({
    activeChat: null,
    minimizedChats: [],
    isSidebarOpen: true,
    sidebarWidth: 'expanded',
    windowPositions: new Map(),
    windowSizes: new Map()
  });

  const openChat = (conversation: Conversation) => {
    setChatState(prev => {
      const newState = { ...prev };
      
      // If there's an active chat, minimize it
      if (prev.activeChat) {
        newState.minimizedChats = [prev.activeChat, ...prev.minimizedChats];
      }
      
      // Set new active chat
      newState.activeChat = conversation;
      
      return newState;
    });
  };

  const minimizeChat = () => {
    if (!chatState.activeChat) return;
    
    setChatState(prev => ({
      ...prev,
      activeChat: null,
      minimizedChats: [prev.activeChat, ...prev.minimizedChats]
    }));
  };

  const restoreChat = (conversation: Conversation) => {
    setChatState(prev => {
      const updatedMinimized = prev.minimizedChats.filter(c => c.id !== conversation.id);
      const newMinimized = prev.activeChat 
        ? [prev.activeChat, ...updatedMinimized]
        : updatedMinimized;
      
      return {
        ...prev,
        activeChat: conversation,
        minimizedChats: newMinimized
      };
    });
  };

  const closeChat = (conversation: Conversation) => {
    setChatState(prev => ({
      ...prev,
      activeChat: prev.activeChat?.id === conversation.id ? null : prev.activeChat,
      minimizedChats: prev.minimizedChats.filter(c => c.id !== conversation.id)
    }));
  };

  return (
    <>
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeChat={chatState.activeChat}
        onChatSelect={openChat}
        onToggleSidebar={() => setChatState(prev => ({
          ...prev,
          sidebarWidth: prev.sidebarWidth === 'thin' ? 'expanded' : 'thin'
        }))}
        width={chatState.sidebarWidth}
      />

      {/* Active Chat Window */}
      {chatState.activeChat && (
        <ChatWindow
          conversation={chatState.activeChat}
          isMinimized={false}
          onMinimize={minimizeChat}
          onRestore={() => {}} // Not needed for active chat
          onClose={() => closeChat(chatState.activeChat!)}
        />
      )}

      {/* Minimized Chat Bubbles */}
      {chatState.minimizedChats.map((conversation, index) => (
        <ChatWindow
          key={conversation.id}
          conversation={conversation}
          isMinimized={true}
          onMinimize={() => {}} // Not needed for minimized
          onRestore={() => restoreChat(conversation)}
          onClose={() => closeChat(conversation)}
          position={{
            x: 20 + (index * 10),
            y: 20 + (index * 10)
          }}
        />
      ))}
    </>
  );
};
```

---

## 🚀 **Implementation Phases**

### **Phase 1: Basic Stackable System (Week 1)**

**Goals:**
- ✅ Create ChatSidebar component
- ✅ Create ChatWindow component  
- ✅ Implement basic open/minimize/restore logic
- ✅ Stack minimized chats as bubbles

**Features:**
- Thin sidebar with conversation list
- Click to open chat window
- Minimize to bubble
- Restore from bubble
- Basic stacking (no positioning logic yet)

### **Phase 2: Enhanced UX (Week 2)**

**Goals:**
- ✅ Smart positioning for minimized bubbles
- ✅ Drag and drop for repositioning
- ✅ Resizable chat windows
- ✅ Persist window positions/sizes

**Features:**
- Minimized bubbles stack with offset
- Drag to reposition bubbles
- Resize chat windows
- Remember positions between sessions

### **Phase 3: Advanced Features (Week 3)**

**Goals:**
- ✅ Multiple chat windows (not just one active)
- ✅ Tabbed chat windows
- ✅ Chat window grouping
- ✅ Keyboard shortcuts

**Features:**
- Open multiple full chat windows
- Tabbed interface within windows
- Group related conversations
- Ctrl+Tab to cycle through chats

### **Phase 4: Polish & Integration (Week 4)**

**Goals:**
- ✅ Integrate with existing ChatContext
- ✅ Add message reactions (from comparison)
- ✅ Add thread support
- ✅ Performance optimization

**Features:**
- Real-time message sync
- Emoji reactions
- Thread navigation
- Smooth animations

---

## 🎯 **Key Benefits**

### **User Experience**
- ✅ **Efficient multitasking** - Multiple conversations open
- ✅ **Visual organization** - Clear hierarchy of active vs minimized
- ✅ **Quick switching** - One click to cycle between chats
- ✅ **Space efficient** - Bubbles don't take much screen space

### **Technical Benefits**
- ✅ **Modular design** - Easy to extend and modify
- ✅ **Performance** - Only render active chat fully
- ✅ **Flexible** - Can add features like grouping, tabs
- ✅ **Responsive** - Works on different screen sizes

---

## 🔧 **Integration with Current System**

### **Replace UnifiedGlobalChat**
- Remove current floating chat
- Replace with StackableChatContainer
- Keep all existing ChatContext integration
- Maintain real-time message sync

### **Preserve Existing Features**
- ✅ Personal/Work context toggle
- ✅ Search functionality
- ✅ Message reactions (to be added)
- ✅ Thread support (to be added)

### **Enhanced Features**
- ✅ Multiple concurrent conversations
- ✅ Visual chat management
- ✅ Improved navigation
- ✅ Better space utilization

---

## 📋 **Next Steps**

1. **Review this strategy** - Does it match your vision?
2. **Choose implementation approach** - Start with Phase 1?
3. **Create components** - Begin with ChatSidebar and ChatWindow
4. **Integrate with ChatContext** - Maintain existing functionality
5. **Add missing features** - Reactions, threads, etc.

**Would you like me to start implementing Phase 1, or would you prefer to modify any part of this strategy first?**

