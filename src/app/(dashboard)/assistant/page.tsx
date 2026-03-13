"use client";

import { useState } from "react";
import { Send, Bot, User } from "lucide-react";

export default function AssistantPage() {
  const [input, setInput] = useState("");

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div>
        <h1 className="text-3xl font-bold text-navy">AI Assistant</h1>
        <p className="mt-1 text-navy-400">
          Ask questions about vendors, categories, and data platforms
        </p>
      </div>

      <div className="mt-6 flex-1 overflow-auto rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-50 p-2">
            <Bot className="h-5 w-5 text-blue" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-navy">NICE DP Assistant</p>
            <p className="mt-1 text-sm text-navy-400">
              Hello! I can help you explore vendor data, compare platforms,
              analyze pricing, and answer questions about data platform
              technologies. How can I help you today?
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about vendors, categories, pricing..."
            className="w-full rounded-xl border border-navy-100 bg-white py-3 pl-4 pr-12 text-sm focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue p-2 text-white hover:bg-blue-600">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
