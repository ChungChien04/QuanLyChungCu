import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const ChatbotPage = () => {
  const { token, user } = useAuth();

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        role: "bot",
        content:
          "Xin chào 👋, tôi là trợ lý AI của hệ thống SMARTBUILDING. Bạn muốn hỏi gì?",
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);

  // ⭐ Auto-scroll CHỈ trong khung chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save vào localStorage
  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  // Load history khi login
  useEffect(() => {
    if (!token || !user) return;

    axios
      .get("/api/chatbot/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const h = (res.data || []).map((m) => ({
          role: m.role === "bot" ? "bot" : "user",
          content: m.content,
        }));
        if (h.length > 0) setMessages(h);
      })
      .catch(() => {});
  }, [token, user]);

  const renderMessageWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline font-medium"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        "/api/chatbot/ask",
        { prompt },
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      );

      setMessages((prev) => [
        ...prev,
        { role: "bot", content: data?.response || "Không có phản hồi." },
      ]);
    } catch {
      setError("Lỗi kết nối với AI. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-50 px-4 py-10 flex justify-center">

      {/* CHAT UI CARD */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border flex flex-col h-[650px]">

        {/* HEADER */}
        <div className="p-5 border-b flex justify-between items-center bg-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0f8a3f] text-white rounded-xl flex items-center justify-center font-bold">
              AI
            </div>
            <p className="font-semibold text-gray-800 text-lg">
              Trợ lý AI SMARTBUILDING
            </p>
          </div>

          {loading && (
            <span className="text-sm text-[#0f8a3f] animate-pulse">
              Đang trả lời...
            </span>
          )}
        </div>

        {/* CHAT BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-white">

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 text-sm shadow-sm whitespace-pre-wrap
                  ${
                    msg.role === "user"
                      ? "bg-[#0f8a3f] text-white rounded-2xl rounded-br-none"
                      : "bg-gray-100 text-gray-800 border border-gray-200 rounded-2xl rounded-bl-none"
                  }
                `}
              >
                {renderMessageWithLinks(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 border px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* INPUT AREA */}
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-white border-t rounded-b-3xl"
        >
          <div className="bg-gray-100 rounded-full flex items-center px-3 py-2 shadow-inner">
            <input
              type="text"
              className="flex-1 px-3 bg-transparent focus:outline-none text-sm"
              placeholder="Nhập tin nhắn…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              disabled={loading}
              className="bg-[#0f8a3f] text-white px-5 py-2 rounded-full text-sm hover:bg-green-800 transition disabled:bg-green-300"
            >
              Gửi
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ChatbotPage;
