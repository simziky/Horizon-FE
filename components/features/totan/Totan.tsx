"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { BsStars } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
//import { MdOutlineKeyboardVoice } from "react-icons/md";
import { HiOutlineArrowPath } from "react-icons/hi2";
import { Drawer, Spin, Image } from "antd"; // Import Ant Design components
import { 
  useChatMutation,
  useAnalyzeMutation,
  //useChatAllHistoryQuery,
  useLazyChatAllHistoryQuery,
 // You'll need to add this to your API
} from "@/redux/api/totanAi";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  createNewSession,
  addMessage,
  updateConversationState,
  updateSessionId,
  updateAnalysisData,
  updateCollectedData,
  selectCurrentSession,
  startNewAnalysisInSession,
} from "@/redux/slice/chatSlice";
import ProductAnalysisCard from "./analysis";

type Message = {
  sender: "ai" | "user";
  text: string;
  type?: "analysis" | "chat" | "system" | "error" | "retry";
  retryAction?: () => void;
  data?: any; // Analysis data object
};

// Define types for history data
type HistoryItem = {
  id: number;
  asin: string;
  marketplace_id: string;
  session_id: string;
  basic_details: {
    name: string;
    image: string;
    vendor: string;
    rating: {
      count: number;
      stars: number;
    };
    category?: string;
  };
  created_at: string;
  updated_at: string;
};

/**
type HistoryResponse = {
  status: number;
  message: string;
  data: HistoryItem[];
  meta: any;
  responseCode: string;
};
 */

/**
 * Enhanced typing effect hook that simulates natural typing for the first 30-40 seconds,
 * then displays the rest of the message instantly
 */
const useNaturalTypingEffect = (text: string, maxTypingDuration = 35000) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    setShowCursor(true);

    if (text.length === 0) {
      setIsTyping(false);
      setShowCursor(false);
      return;
    }

    let index = 0;
    let timeoutId: NodeJS.Timeout;
    let totalTimeElapsed = 0;
    const startTime = Date.now();

    const typeNextCharacter = () => {
      const currentTime = Date.now();
      totalTimeElapsed = currentTime - startTime;

      if (totalTimeElapsed >= maxTypingDuration) {
        setDisplayedText(text);
        setIsTyping(false);
        setTimeout(() => setShowCursor(false), 500);
        return;
      }

      if (index >= text.length) {
        setIsTyping(false);
        setTimeout(() => setShowCursor(false), 500);
        return;
      }

      const char = text[index];

      let delay = 30;

      if (char === " ") {
        delay = 50;
      } else if (char === "." || char === "!" || char === "?") {
        delay = 300;
      } else if (char === "," || char === ";" || char === ":") {
        delay = 150;
      } else if (char === "\n") {
        delay = 200;
      } else if (/[a-zA-Z]/.test(char)) {
        delay = Math.random() * 40 + 20;
      } else if (/[0-9]/.test(char)) {
        delay = Math.random() * 30 + 25;
      }

      if (Math.random() < 0.03) {
        delay += Math.random() * 200 + 100;
      }

      const upcomingWord = text.slice(index).split(" ")[0].toLowerCase();
      const commonWords = [
        "the",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "this",
        "that",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "can",
        "may",
        "might",
      ];

      if (
        commonWords.includes(upcomingWord) &&
        index > 0 &&
        text[index - 1] === " "
      ) {
        delay *= 0.7;
      }

      const timeRatio = totalTimeElapsed / maxTypingDuration;
      if (timeRatio > 0.7) {
        delay *= (1 - timeRatio) * 2;
        delay = Math.max(delay, 5);
      }

      setDisplayedText(text.slice(0, index + 1));
      index++;

      timeoutId = setTimeout(typeNextCharacter, delay);
    };

    timeoutId = setTimeout(typeNextCharacter, 100);

    return () => clearTimeout(timeoutId);
  }, [text, maxTypingDuration]);

  useEffect(() => {
    if (!showCursor) return;

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, [showCursor, isTyping]);

  return {
    displayedText,
    isTyping,
    showCursor: showCursor && isTyping,
  };
};

/**
 * Enhanced TypingMessage component with natural typing effect and cursor
 */
const NaturalTypingMessage = ({
  message,
  onComplete,
}: {
  message: Message;
  onComplete?: () => void;
}) => {
  const { displayedText, isTyping, showCursor } = useNaturalTypingEffect(
    message.text
  );
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (!isTyping && !hasCompletedRef.current && onComplete) {
      hasCompletedRef.current = true;
      onComplete();
    }
  }, [isTyping, onComplete]);

  useEffect(() => {
    hasCompletedRef.current = false;
  }, [message.text]);

  return (
    <div className="flex items-start gap-2 self-start">
      <div className="shrink-0">
        <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center text-base">
          <BsStars className="rotate-90 size-5" />
        </div>
      </div>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl text-base rounded-bl-none ${
          message.type === "analysis"
            ? "bg-blue-50 text-blue-900 border border-blue-200"
            : message.type === "system"
            ? "bg-yellow-50 text-yellow-900 border border-yellow-200"
            : message.type === "error"
            ? "bg-red-50 text-red-900 border border-red-200"
            : message.type === "retry"
            ? "bg-orange-50 text-orange-900 border border-orange-200"
            : "bg-[#ECF1F6] text-[#4B4B62]"
        }`}
      >
        <div className="whitespace-pre-line relative">
          {displayedText}
          {showCursor && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
          )}
        </div>
        {message.type === "retry" && message.retryAction && !isTyping && (
          <button
            onClick={message.retryAction}
            className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg transition-colors text-sm font-medium"
          >
            <HiOutlineArrowPath className="size-4" />
            Retry Analysis
          </button>
        )}
      </div>
    </div>
  );
};

const TotanChat = () => {
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);

  const [input, setInput] = useState("");
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);
  
  // State for history drawer
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { marketplaceId, currencyCode, currencySymbol } = useAppSelector(
    (state) => state?.global
  );
  const { first_name, last_name } =
    useAppSelector((state) => state.api?.user) || {};

  const getUserInitials = () => {
    const firstInitial = first_name?.charAt(0)?.toUpperCase() || "";
    const lastInitial = last_name?.charAt(0)?.toUpperCase() || "";
    return firstInitial + lastInitial || "U";
  };

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [analyzeProduct, { isLoading: isAnalyzing }] = useAnalyzeMutation();
  const [sendChat, { isLoading: isChatting }] = useChatMutation();
  const [getHistory] = useLazyChatAllHistoryQuery({}); // Add this to your API slice

  useEffect(() => {
    if (!currentSession) {
      dispatch(createNewSession({ firstName: first_name }));
    }
  }, [currentSession, dispatch, first_name]);

  const validateASIN = (asin: string): boolean => {
    const asinRegex = /^[A-Z0-9]{10}$/i;
    return asinRegex.test(asin.trim());
  };

  const validateCostPrice = (price: string): number | null => {
    const cleanedPrice = price.replace(/[^0-9.]/g, "");
    const numPrice = Number.parseFloat(cleanedPrice);
    return !isNaN(numPrice) && numPrice > 0 ? numPrice : null;
  };

  const validateFulfillment = (response: string): boolean | null => {
    const normalized = response.toLowerCase().trim();
    if (
      normalized === "yes" ||
      normalized === "y" ||
      normalized === "true" ||
      normalized === "1"
    )
      return true;
    if (
      normalized === "no" ||
      normalized === "n" ||
      normalized === "false" ||
      normalized === "0"
    )
      return false;
    return null;
  };

  const addAIMessagesWithTyping = (newMessages: Message[]) => {
    setPendingMessages(newMessages);
    setCurrentTypingIndex(0);
  };

  const handleTypingComplete = () => {
    if (
      currentTypingIndex >= 0 &&
      currentTypingIndex < pendingMessages.length
    ) {
      dispatch(addMessage(pendingMessages[currentTypingIndex]));

      if (currentTypingIndex < pendingMessages.length - 1) {
        setTimeout(() => setCurrentTypingIndex((prev) => prev + 1), 300);
      } else {
        setPendingMessages([]);
        setCurrentTypingIndex(-1);
      }
    }
  };

  const performAnalysis = async () => {
    if (!currentSession) return;
    dispatch(updateConversationState("analyzing"));

    try {
      const result = await analyzeProduct({
        asin: currentSession.collectedData.asin,
        costPrice: currentSession.collectedData.costPrice,
        marketplaceId: marketplaceId,
        isAmazonFulfilled: currentSession.collectedData.isAmazonFulfilled,
      }).unwrap();

      if (result.success) {
        const analysis = result.data;
        dispatch(updateAnalysisData(analysis));
        dispatch(updateSessionId(analysis.session_id));
        dispatch(updateConversationState("chat_ready"));

        const messagesToAdd: Message[] = [
          {
            sender: "ai",
            text: "🎉 Analysis Complete",
            type: "analysis",
            data: analysis,
          },
        ];

        addAIMessagesWithTyping(messagesToAdd);
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);

      const isTimeoutError =
        error?.data?.error?.includes("cURL error 28") ||
        error?.data?.error?.includes("Operation timed out") ||
        error?.data?.message?.includes("timeout") ||
        error?.message?.includes("timeout");

      if (isTimeoutError) {
        addAIMessagesWithTyping([
          {
            sender: "ai",
            text: "⏰ The analysis is taking longer than expected and timed out. This sometimes happens due to high server load or network issues.\n\nDon't worry, your product data is saved! You can try the analysis again.",
            type: "retry",
            retryAction: () => performAnalysis(),
          },
        ]);
      } else {
        addAIMessagesWithTyping([
          {
            sender: "ai",
            text: "❌ Sorry, I couldn't analyze this product. Please check the ASIN and try again. Let's start over - please provide a new ASIN.",
            type: "error",
          },
        ]);
        dispatch(updateConversationState("waiting_for_asin"));
        dispatch(
          updateCollectedData({
            asin: "",
            costPrice: 0,
            isAmazonFulfilled: false,
          })
        );
      }
    }
  };

  const handleConversationalInput = async (userInput: string) => {
    if (!currentSession) return;

    dispatch(addMessage({ sender: "user", text: userInput }));

    switch (currentSession.conversationState) {
      case "waiting_for_asin":
        if (validateASIN(userInput)) {
          const asin = userInput.trim().toUpperCase();
          dispatch(updateCollectedData({ asin }));
          addAIMessagesWithTyping([
            { sender: "ai", text: `Great! I've got the ASIN: ${asin}` },
            {
              sender: "ai",
              text: `Now, what will be the cost price of this product? (Enter the amount in ${currencyCode}, e.g., ${currencySymbol}125)`,
            },
          ]);
          dispatch(updateConversationState("waiting_for_cost_price"));
        } else {
          addAIMessagesWithTyping([
            {
              sender: "ai",
              text: "❌ That doesn't look like a valid ASIN. ASINs are 10-character codes (letters and numbers). Please try again.",
            },
          ]);
        }
        break;

      case "waiting_for_cost_price":
        const price = validateCostPrice(userInput);
        if (price !== null) {
          dispatch(updateCollectedData({ costPrice: price }));
          addAIMessagesWithTyping([
            {
              sender: "ai",
              text: `Perfect! Cost price set to ${currencySymbol}${price.toFixed(
                2
              )}`,
            },
            {
              sender: "ai",
              text: "Last question: Will this product be Amazon Fulfilled (FBA)? Please answer 'yes' or 'no'.",
            },
          ]);
          dispatch(updateConversationState("waiting_for_fulfillment"));
        } else {
          addAIMessagesWithTyping([
            {
              sender: "ai",
              text: `⚠️ Please enter a valid price (numbers only, greater than 0). For example: ${currencySymbol}125 or ${currencySymbol}99.99`,
            },
          ]);
        }
        break;

      case "waiting_for_fulfillment":
        const fulfillment = validateFulfillment(userInput);
        if (fulfillment !== null) {
          dispatch(updateCollectedData({ isAmazonFulfilled: fulfillment }));
          addAIMessagesWithTyping([
            {
              sender: "ai",
              text: `Got it! ${
                fulfillment
                  ? "Amazon Fulfilled (FBA)"
                  : "Merchant Fulfilled (FBM)"
              }`,
            },
            {
              sender: "ai",
              text: "🔄 Now analyzing your product... This may take a moment.",
            },
          ]);
          await performAnalysis();
        } else {
          addAIMessagesWithTyping([
            {
              sender: "ai",
              text: "❌ Please answer with 'yes' or 'no' to indicate if the product will be Amazon Fulfilled (FBA).",
            },
          ]);
        }
        break;

      case "chat_ready":
        if (!currentSession.sessionId) return;
        try {
          const result = await sendChat({
            session_id: currentSession.sessionId,
            question: userInput,
          }).unwrap();
          if (result.success) {
            addAIMessagesWithTyping([
              { sender: "ai", text: result.data.response, type: "chat" },
            ]);
          }
        } catch (error) {
          console.error("Chat failed:", error);
          addAIMessagesWithTyping([
            {
              sender: "ai",
              text: "❌ Sorry, I couldn't process your question. Please try again.",
            },
          ]);
        }
        break;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentSession) return;
    const userInput = input.trim();
    setInput("");
    await handleConversationalInput(userInput);
  };

  const startNewAnalysis = () => {
    dispatch(startNewAnalysisInSession({ firstName: first_name }));
  };

  // Function to handle view history button click
  const handleViewHistory = async () => {
    setHistoryDrawerVisible(true);
    setLoadingHistory(true);
    
    try {
      // Fetch history data
      const result = await getHistory(10).unwrap();
      if (result.success) {
        setHistoryData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      // You might want to show an error message here
    } finally {
      setLoadingHistory(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPlaceholderText = () => {
    if (!currentSession) return "Loading session...";
    switch (currentSession.conversationState) {
      case "waiting_for_asin":
        return "Enter ASIN (e.g., B0D9YZJ3V7)...";
      case "waiting_for_cost_price":
        return `Enter cost price in ${currencyCode} (e.g., ${currencySymbol}125)...`;
      case "waiting_for_fulfillment":
        return "Type 'yes' or 'no'...";
      case "analyzing":
        return "Analyzing product...";
      case "chat_ready":
        return "Ask anything about this product score...";
      default:
        return "Type your message...";
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, currentTypingIndex]);

  if (!currentSession) {
    return (
      <section className="flex items-center justify-center min-h-[50dvh] md:min-h-[80dvh]">
        <p>Loading Chat...</p>
      </section>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-8 min-h-[50dvh] md:min-h-[80dvh] rounded-xl bg-white p-4 lg:p-5">
        {/* Header */}
        <div className="flex items-center justify-between shadow-sm pb-4">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center">
              <BsStars className="rotate-90 size-5" />
            </div>
            <div>
              <h1 className="text-[#171717] font-medium text-xl md:text-2xl">
                Totan (AI)
              </h1>
              {currentSession.conversationState !== "waiting_for_asin" && (
                <p className="text-sm text-gray-500">
                  {currentSession.conversationState ===
                    "waiting_for_cost_price" && "Collecting cost price..."}
                  {currentSession.conversationState ===
                    "waiting_for_fulfillment" && "Checking fulfillment method..."}
                  {currentSession.conversationState === "analyzing" &&
                    "Analyzing product..."}
                  {currentSession.conversationState === "chat_ready" &&
                    "Ready for questions"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleViewHistory}
              className="px-2 py-2 text-primary text-xs  hover:bg-primary/20 rounded-lg transition-colors"
            >
              View History
            </button>
            {currentSession.sessionId && (
              <button
                onClick={startNewAnalysis}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                New Analysis
              </button>
            )}
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex flex-col gap-4 flex-1 max-h-[75dvh] sm:max-h-[60vh] overflow-y-auto pr-2">
          {currentSession.messages.map((msg, idx) => (
            <div
              key={`${currentSession.id}-${idx}`}
              className={`flex items-start gap-2 ${
                msg.sender === "ai" ? "self-start" : "self-end flex-row-reverse"
              }`}
            >
              {/* Avatar */}
              <div className="shrink-0">
                {msg.sender === "ai" ? (
                  <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center text-base">
                    <BsStars className="rotate-90 size-5" />
                  </div>
                ) : (
                  <div className="size-10 rounded-full bg-[#4B4B62] text-white flex items-center justify-center text-base font-medium">
                    {getUserInitials()}
                  </div>
                )}
              </div>

              {msg.type === "analysis" && msg.data ? (
                <div className="w-full">
                  <ProductAnalysisCard
                    productName={msg.data.summary?.title || "Product Analysis"}
                    subtitle="Detailed product analysis report"
                    overallScore={msg.data.summary?.overall_score || 0}
                    rating={msg.data.summary?.category_rating || "N/A"}
                    metrics={{
                      roi: `${msg.data.financials?.roi.toFixed(2)}%` || "0%",
                      profitMargin:
                        `${msg.data.financials?.profit_margin.toFixed(2)}%` ||
                        "0%",
                      monthlySales: msg.data.product_data?.monthly_sales || 0,
                      estimatedRevenue: `$${(
                        msg.data.product_data?.estimated_revenue || 0
                      ).toLocaleString()}`,
                      isProfitable: msg.data.financials?.is_profitable || false,
                    }}
                    scoreBreakdown={[
                      {
                        label: "Profitability",
                        value: msg.data.score_breakdown?.profitability || 0,
                        max: 3,
                        percentage:
                          ((msg.data.score_breakdown?.profitability || 0) / 3) *
                          100,
                      },
                      {
                        label: "Estimated Demand",
                        value: msg.data.score_breakdown?.estimated_demand || 0,
                        max: 3,
                        percentage:
                          ((msg.data.score_breakdown?.estimated_demand || 0) /
                            3) *
                          100,
                      },
                      {
                        label: "Buy Box Eligible",
                        value: msg.data.score_breakdown?.buy_box_eligible || 0,
                        max: 3,
                        percentage:
                          ((msg.data.score_breakdown?.buy_box_eligible || 0) /
                            3) *
                          100,
                      },
                      {
                        label: "Sales Rank Impact",
                        value: msg.data.score_breakdown?.sales_rank_impact || 0,
                        max: 3,
                        percentage:
                          ((msg.data.score_breakdown?.sales_rank_impact || 0) /
                            3) *
                          100,
                      },
                      {
                        label: "FBA Sellers",
                        value: msg.data.score_breakdown?.fba_sellers || 0,
                        max: 3,
                        percentage:
                          ((msg.data.score_breakdown?.fba_sellers || 0) / 3) *
                          100,
                      },
                      {
                        label: "Amazon on Listing",
                        value: msg.data.score_breakdown?.amazon_on_listing || 0,
                        max: 3,
                        percentage:
                          ((msg.data.score_breakdown?.amazon_on_listing || 0) /
                            3) *
                          100,
                      },
                      {
                        label: "Variation Listing",
                        value: msg.data.score_breakdown?.variation_listing || 0,
                        max: 3,
                        percentage:
                          ((msg.data.score_breakdown?.variation_listing || 0) /
                            3) *
                          100,
                      },
                      {
                        label: "Offer Count",
                        value: msg.data.score_breakdown?.offer_count || 0,
                        max: 3,
                        percentage:
                          ((msg.data.score_breakdown?.offer_count || 0) / 3) *
                          100,
                      },
                    ]}
                    status={{
                      isProfitable: msg.data.financials?.is_profitable || false,
                      platform: msg.data.product_data?.is_amazon
                        ? "Amazon"
                        : "Other Marketplace",
                      rating:
                        msg.data.product_data?.average_rating?.toString() ||
                        "N/A",
                      reviewCount: msg.data.product_data?.review_count || 0,
                    }}
                  />
                </div>
              ) : (
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-base ${
                    msg.type === "system"
                      ? "bg-gray-100 text-gray-600 text-center font-medium text-sm"
                      : msg.type === "error"
                      ? "bg-red-50 text-red-900 border border-red-200"
                      : msg.type === "retry"
                      ? "bg-orange-50 text-orange-900 border border-orange-200"
                      : "bg-[#ECF1F6] text-[#4B4B62]"
                  } ${
                    msg.sender === "ai" ? "rounded-bl-none" : "rounded-br-none"
                  } ${msg.type === "system" ? "w-full max-w-none mx-auto" : ""}`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  {msg.type === "retry" && msg.retryAction && (
                    <button
                      onClick={msg.retryAction}
                      className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg transition-colors text-sm font-medium"
                    >
                      <HiOutlineArrowPath className="size-4" />
                      Retry Analysis
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Currently typing message */}
          {currentTypingIndex >= 0 && pendingMessages[currentTypingIndex] && (
            <NaturalTypingMessage
              message={pendingMessages[currentTypingIndex]}
              onComplete={handleTypingComplete}
            />
          )}

          {/* Loading bubble */}
          {(isAnalyzing || isChatting) && (
            <div className="flex items-start gap-2 self-start">
              <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center text-base">
                <BsStars className="rotate-90 size-4" />
              </div>
              <div className="bg-[#ECF1F6] p-4 rounded-2xl text-sm flex gap-1 rounded-bl-none">
                <span className="bounce-dot animation-delay-0 size-2 bg-[#C7CCD6] rounded-full" />
                <span className="bounce-dot animation-delay-200 size-2 bg-[#C7CCD6] rounded-full" />
                <span className="bounce-dot animation-delay-300 size-2 bg-[#C7CCD6] rounded-full" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input field */}
        <div className="relative">
          <input
            className="flex-1 outline-none bg-transparent border border-[#D1D1D1] p-4 pr-32 rounded-2xl w-full focus:border-primary"
            placeholder={getPlaceholderText()}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={
              isAnalyzing ||
              isChatting ||
              currentSession.conversationState === "analyzing" ||
              currentTypingIndex >= 0
            }
          />

          {/* Send button */}
          <button
            type="button"
            aria-label="Send message"
            onClick={handleSend}
            disabled={
              isAnalyzing ||
              isChatting ||
              currentSession.conversationState === "analyzing" ||
              currentTypingIndex >= 0
            }
            className="absolute top-0 bottom-0 size-10 my-auto right-16 sm:right-28 flex items-center justify-center gap-2 rounded-lg sm:w-[110px] sm:h-[42px] py-2 px-4 text-white font-semibold bg-primary hover:bg-primary/90 disabled:bg-gray-300 duration-150 transition-colors"
          >
            <span className="hidden sm:block">Send</span>
            <IoSend className="size-10 sm:size-5" />
          </button>

          {/* Voice icon button — commented out until voice feature is implemented */}
          {/* <button
            type="button"
            title="Use voice mode"
            aria-label="Voice input"
            className="absolute top-0 bottom-0 my-auto right-3 size-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdOutlineKeyboardVoice className="size-5" />
          </button> */}
        </div>
      </section>

      {/* History Drawer */}
      <Drawer
        title="Analysis History"
        placement="right"
        onClose={() => setHistoryDrawerVisible(false)}
        open={historyDrawerVisible}
        width={500}
        className="ant-drawer-history"
      >
        {loadingHistory ? (
          <div className="flex justify-center items-center h-32">
            <Spin size="large" />
          </div>
        ) : historyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <BsStars className="text-4xl mb-2 text-gray-300" />
            <p>No history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {historyData.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Small Image */}
                  <div className="shrink-0">
                    <Image
                      src={item.basic_details.image}
                      alt={item.basic_details.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover"
                      fallback="https://via.placeholder.com/60x60?text=No+Image"
                      placeholder={
                        <div className="w-15 h-15 bg-gray-200 animate-pulse rounded-md" />
                      }
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Name - truncated */}
                    <h4 className="font-medium text-gray-900 truncate mb-1">
                      {item.basic_details.name}
                    </h4>
                    
                    {/* Vendor */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">Vendor:</span>
                      <span className="text-sm font-medium">
                        {item.basic_details.vendor}
                      </span>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">Rating:</span>
                      <span className="text-sm text-yellow-600">
                        ⭐ {item.basic_details.rating.stars}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({item.basic_details.rating.count.toLocaleString()} reviews)
                      </span>
                    </div>
                    
                    {/* Category */}
                    {item.basic_details.category && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">Category:</span>
                        <span className="text-sm">
                          {item.basic_details.category}
                        </span>
                      </div>
                    )}
                    
                    {/* Date and ASIN */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{formatDate(item.created_at)}</span>
                      <span className="font-mono">ASIN: {item.asin}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </>
  );
};

export default TotanChat;
