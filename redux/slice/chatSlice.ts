import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Message = {
  sender: "ai" | "user";
  text: string;
  type?: "analysis" | "chat" | "system" | "error" | "retry";
  timestamp: number;
  retryAction?: () => void;
  data?: any
};

type ConversationState =
  | "waiting_for_asin"
  | "waiting_for_cost_price"
  | "waiting_for_fulfillment"
  | "analyzing"
  | "chat_ready";

type AnalysisData = {
  session_id: string;
  score: number;
  category: string;
  breakdown: {
    amazon_on_listing: number;
    fba_sellers: number;
    buy_box_eligible: number;
    variation_listing: number;
    sales_rank_impact: number;
    estimated_demand: number;
    offer_count: number;
    profitability: number;
  };
  roi: number;
  profit_margin: number;
  monthly_sales: number;
};

type ChatSession = {
  id: string;
  messages: Message[];
  conversationState: ConversationState;
  sessionId: string | null;
  analysisData: AnalysisData | null;
  collectedData: {
    asin: string;
    costPrice: number;
    isAmazonFulfilled: boolean;
  };
  createdAt: number;
  lastActiveAt: number;
};

interface ChatState {
  sessions: Record<string, ChatSession>;
  currentSessionId: string | null;
  maxSessions: number;
}

const initialState: ChatState = {
  sessions: {},
  currentSessionId: null,
  maxSessions: 10, // Limit to prevent storage bloat
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Create a new chat session with optional user name
    createNewSession: (state, action: PayloadAction<{ firstName?: string } | undefined>) => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const firstName = action.payload?.firstName;
      
      // Remove oldest session if we exceed max sessions
      const sessionIds = Object.keys(state.sessions);
      if (sessionIds.length >= state.maxSessions) {
        const oldestSession = sessionIds.reduce((oldest, current) => 
          state.sessions[current].lastActiveAt < state.sessions[oldest].lastActiveAt ? current : oldest
        );
        delete state.sessions[oldestSession];
      }

      const welcomeMessage = firstName 
        ? `Hi ${firstName}, Welcome to Totan AI! 🚀`
        : "Welcome to Totan AI! 🚀";

      const newSession: ChatSession = {
        id: sessionId,
        messages: [
          { 
            sender: "ai", 
            text: welcomeMessage,
            timestamp: Date.now()
          },
          {
            sender: "ai",
            text: "I'll help you analyze Amazon products. Let's start!",
            timestamp: Date.now() + 1
          },
          {
            sender: "ai",
            text: "Please provide the ASIN number of the product you'd like to analyze.",
            timestamp: Date.now() + 2
          },
        ],
        conversationState: "waiting_for_asin",
        sessionId: null,
        analysisData: null,
        collectedData: {
          asin: "",
          costPrice: 0,
          isAmazonFulfilled: false,
        },
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };

      state.sessions[sessionId] = newSession;
      state.currentSessionId = sessionId;
    },

    // Set current active session
    setCurrentSession: (state, action: PayloadAction<string>) => {
      if (state.sessions[action.payload]) {
        state.currentSessionId = action.payload;
        state.sessions[action.payload].lastActiveAt = Date.now();
      }
    },

    // Add message to current session
    addMessage: (state, action: PayloadAction<Omit<Message, 'timestamp'>>) => {
      if (state.currentSessionId && state.sessions[state.currentSessionId]) {
        const message: Message = {
          ...action.payload,
          timestamp: Date.now(),
        };
        state.sessions[state.currentSessionId].messages.push(message);
        state.sessions[state.currentSessionId].lastActiveAt = Date.now();
      }
    },

    // Add multiple messages to current session
    addMessages: (state, action: PayloadAction<Omit<Message, 'timestamp'>[]>) => {
      if (state.currentSessionId && state.sessions[state.currentSessionId]) {
        const messages: Message[] = action.payload.map((msg, index) => ({
          ...msg,
          timestamp: Date.now() + index,
        }));
        state.sessions[state.currentSessionId].messages.push(...messages);
        state.sessions[state.currentSessionId].lastActiveAt = Date.now();
      }
    },

    // Update conversation state
    updateConversationState: (state, action: PayloadAction<ConversationState>) => {
      if (state.currentSessionId && state.sessions[state.currentSessionId]) {
        state.sessions[state.currentSessionId].conversationState = action.payload;
        state.sessions[state.currentSessionId].lastActiveAt = Date.now();
      }
    },

    // Update session ID (for API tracking)
    updateSessionId: (state, action: PayloadAction<string>) => {
      if (state.currentSessionId && state.sessions[state.currentSessionId]) {
        state.sessions[state.currentSessionId].sessionId = action.payload;
        state.sessions[state.currentSessionId].lastActiveAt = Date.now();
      }
    },

    // Update analysis data
    updateAnalysisData: (state, action: PayloadAction<AnalysisData>) => {
      if (state.currentSessionId && state.sessions[state.currentSessionId]) {
        state.sessions[state.currentSessionId].analysisData = action.payload;
        state.sessions[state.currentSessionId].lastActiveAt = Date.now();
      }
    },

    // Update collected data
    updateCollectedData: (state, action: PayloadAction<Partial<ChatSession['collectedData']>>) => {
      if (state.currentSessionId && state.sessions[state.currentSessionId]) {
        state.sessions[state.currentSessionId].collectedData = {
          ...state.sessions[state.currentSessionId].collectedData,
          ...action.payload,
        };
        state.sessions[state.currentSessionId].lastActiveAt = Date.now();
      }
    },

    // Delete a specific session
    deleteSession: (state, action: PayloadAction<string>) => {
      delete state.sessions[action.payload];
      if (state.currentSessionId === action.payload) {
        // Set current session to the most recent one, or null if none exist
        const sessionIds = Object.keys(state.sessions);
        if (sessionIds.length > 0) {
          state.currentSessionId = sessionIds.reduce((latest, current) => 
            state.sessions[current].lastActiveAt > state.sessions[latest].lastActiveAt ? current : latest
          );
        } else {
          state.currentSessionId = null;
        }
      }
    },

    // Clear all sessions
    clearAllSessions: (state) => {
      state.sessions = {};
      state.currentSessionId = null;
    },

    // Start new analysis in current session (keeps previous messages)
    startNewAnalysisInSession: (state, action: PayloadAction<{ firstName?: string } | undefined>) => {
      if (state.currentSessionId && state.sessions[state.currentSessionId]) {
        const session = state.sessions[state.currentSessionId];
        const firstName = action.payload?.firstName;
        
        // Add separator and new analysis messages to existing conversation
        const separatorMessage = "─────────────────────────────";
        const welcomeMessage = firstName 
          ? `Hi ${firstName}, let's analyze another product! 🚀`
          : "Let's analyze another product! 🚀";

        const newMessages: Message[] = [
          {
            sender: "ai",
            text: separatorMessage,
            type: "system",
            timestamp: Date.now()
          },
          { 
            sender: "ai", 
            text: welcomeMessage,
            timestamp: Date.now() + 1
          },
          {
            sender: "ai",
            text: "Please provide the ASIN number of the product you'd like to analyze.",
            timestamp: Date.now() + 2
          },
        ];

        session.messages.push(...newMessages);
        session.conversationState = "waiting_for_asin";
        session.sessionId = null;
        session.analysisData = null;
        session.collectedData = {
          asin: "",
          costPrice: 0,
          isAmazonFulfilled: false,
        };
        session.lastActiveAt = Date.now();
      }
    },

    // Reset current session (for new analysis) with optional user name
    resetCurrentSession: (state, action: PayloadAction<{ firstName?: string } | undefined>) => {
      if (state.currentSessionId && state.sessions[state.currentSessionId]) {
        const session = state.sessions[state.currentSessionId];
        const firstName = action.payload?.firstName;
        
        const welcomeMessage = firstName 
          ? `Hi ${firstName}, Welcome to Totan AI! 🚀`
          : "Welcome to Totan AI! 🚀";

        session.messages = [
          { 
            sender: "ai", 
            text: welcomeMessage,
            timestamp: Date.now()
          },
          {
            sender: "ai",
            text: "I'll help you analyze Amazon products. Let's start!",
            timestamp: Date.now() + 1
          },
          {
            sender: "ai",
            text: "Please provide the ASIN number of the product you'd like to analyze.",
            timestamp: Date.now() + 2
          },
        ];
        session.conversationState = "waiting_for_asin";
        session.sessionId = null;
        session.analysisData = null;
        session.collectedData = {
          asin: "",
          costPrice: 0,
          isAmazonFulfilled: false,
        };
        session.lastActiveAt = Date.now();
      }
    },
  },
});

export const {
  createNewSession,
  setCurrentSession,
  addMessage,
  addMessages,
  updateConversationState,
  updateSessionId,
  updateAnalysisData,
  updateCollectedData,
  deleteSession,
  clearAllSessions,
  startNewAnalysisInSession,
  resetCurrentSession,
} = chatSlice.actions;

export default chatSlice.reducer;

// Selectors
export const selectCurrentSession = (state: { chat: ChatState }) => {
  if (!state.chat.currentSessionId) return null;
  return state.chat.sessions[state.chat.currentSessionId] || null;
};

export const selectAllSessions = (state: { chat: ChatState }) => {
  return Object.values(state.chat.sessions).sort((a, b) => b.lastActiveAt - a.lastActiveAt);
};

export const selectSessionById = (state: { chat: ChatState }, sessionId: string) => {
  return state.chat.sessions[sessionId] || null;
};