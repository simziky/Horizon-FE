import React, { useState } from 'react';
import { FaFunnelDollar, FaChartLine, FaBoxes, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { FaArrowTrendUp } from "react-icons/fa6";


interface HistoryProps {
  onBack?: () => void; // Added onBack prop
}

interface HistoryItem {
  id: string;
  category: string;
  query: string;
  timestamp: Date;
  icon: string;
}

const ChatHistory: React.FC<HistoryProps> = ({ onBack }) => {
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: '1',
      category: 'Lead Generation',
      query: 'How to improve lead conversion rates?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: 'lead'
    },
    {
      id: '2',
      category: 'Product Analysis',
      query: 'Market trends for Q4 2024',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      icon: 'product'
    },
    {
      id: '3',
      category: 'Wholesale Script',
      query: 'Best pricing strategies for wholesale',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      icon: 'wholesale'
    }
  ]);

  const categories = [
    { name: 'Lead Generation', icon: <FaFunnelDollar className="text-red-500 text-2xl" />, color: 'bg-red-50' },
    { name: 'Product Analysis', icon: <FaChartLine className="text-blue-500 text-2xl" />, color: 'bg-blue-50' },
    { name: 'Wholesale Script', icon: <FaBoxes className="text-yellow-500 text-2xl" />, color: 'bg-yellow-50' },
    { name: 'Capital/Cashflow Analysis', icon: <FaArrowTrendUp className="text-green-500 text-2xl" />, color: 'bg-green-50' }
  ];

  const getIconForCategory = (iconType: string) => {
    switch (iconType) {
      case 'lead':
        return <FaFunnelDollar className="text-red-500" />;
      case 'product':
        return <FaChartLine className="text-blue-500" />;
      case 'wholesale':
        return <FaBoxes className="text-yellow-500" />;
      case 'capital':
        return <FaArrowTrendUp className="text-green-500" />;
      default:
        return <FaChartLine className="text-gray-500" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(history.filter(item => item.id !== id));
  };

  const handleCategoryClick = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'Lead Generation': 'lead',
      'Product Analysis': 'product',
      'Wholesale Script': 'wholesale',
      'Capital/Cashflow Analysis': 'capital'
    };

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      category: categoryName,
      query: `New query about ${categoryName}`,
      timestamp: new Date(),
      icon: iconMap[categoryName]
    };

    setHistory([newItem, ...history].slice(0, 10));
  };

  return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        {/* Header with back button */}
        <div className="text-center mb-8 relative">
          {/* Back button - only show if onBack prop is provided */}
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Go back"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
          )}
          
          <div className="inline-block bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl p-4 mb-4">
            <div className="text-white text-2xl">✨</div>
          </div>
          <div className="text-gray-500 text-sm mb-1">Welcome, Bawo</div>
          <h1 className="text-gray-800 text-xl font-semibold">How may I help out today?</h1>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => handleCategoryClick(category.name)}
              className={`${category.color} rounded-xl p-4 flex flex-col items-center justify-center hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="mb-3">{category.icon}</div>
              <div className="text-gray-700 text-xs text-center leading-tight">
                {category.name}
              </div>
            </button>
          ))}
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="mt-8">
            <h2 className="text-gray-700 font-semibold mb-4 text-sm uppercase tracking-wide">Recent History</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getIconForCategory(item.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">{item.category}</div>
                        <div className="text-sm text-gray-800">{item.query}</div>
                        <div className="text-xs text-gray-400 mt-1">{formatTimestamp(item.timestamp)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No history yet. Click on a category to get started!
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;