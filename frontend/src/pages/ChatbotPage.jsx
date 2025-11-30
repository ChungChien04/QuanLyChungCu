import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Render markdown nhẹ + auto-link, KHÔNG làm bẩn URL
function renderRichMessage(text) {
  if (!text) return null;

  let cleaned = String(text);

  // 1) Nếu BE còn sót <br> thì ép về newline
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");

  // 2) Cắt mọi thứ dính sau ObjectID trong link apartments
  cleaned = cleaned.replace(
    /(http:\/\/localhost:5173\/apartments\/[a-f0-9]{24})[^\s]*/gi,
    "$1"
  );

  // 3) Escape HTML trước khi build markdown (chống XSS)
  cleaned = cleaned
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 4) Bold **text**
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 5) Newline -> <br>
  cleaned = cleaned.replace(/\n/g, "<br>");

  // 6) Link clickable
  cleaned = cleaned.replace(
    /(https?:\/\/[^\s<]+)/g,
    `<a class="text-blue-600 underline" target="_blank" rel="noreferrer" href="$1">$1</a>`
  );

  return <span dangerouslySetInnerHTML={{ __html: cleaned }} />;
}

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
          "Xin chào 👋, tôi là Trợ lý AI SMARTBUILDING. Bạn muốn hỏi gì hôm nay?",
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chatBodyRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Lưu history vào localStorage
  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  // Load history từ BE nếu đã login
  useEffect(() => {
    if (!token || !user) return;

    axios
      .get("/api/chatbot/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const h = res.data?.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        if (h?.length) setMessages(h);
      })
      .catch(() => {});
  }, [token, user]);

  // Auto scroll nếu user đang ở gần cuối
  useEffect(() => {
    if (!autoScroll) return;
    const el = chatBodyRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [messages, autoScroll]);

  const handleScroll = () => {
    const el = chatBodyRef.current;
    if (!el) return;

    const distanceToBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;

    if (distanceToBottom < 120) {
      if (!autoScroll) setAutoScroll(true);
    } else {
      if (autoScroll) setAutoScroll(false);
    }
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

  const quickQuestions = [
    "Gợi ý căn hộ phù hợp với tôi",
    "Hướng dẫn quy trình thuê căn hộ",
    "Tôi muốn xem các tiện ích của tòa nhà",
    "Tôi có vấn đề với dịch vụ, cần hỗ trợ",
  ];

  const handleQuickAsk = (text) => {
    setInput(text);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6">
        {/* LEFT PANEL – giới thiệu + gợi ý câu hỏi */}
        <div className="hidden lg:flex flex-col w-[32%] space-y-4">
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-md border border-emerald-50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  Trợ lý AI SMARTBUILDING
                </p>
                <p className="text-xs text-gray-500">
                  Hỗ trợ 24/7 cho cư dân & khách thuê
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Hỏi tôi về{" "}
              <span className="font-semibold text-gray-800">
                căn hộ, tiện ích, hợp đồng, chi phí, dịch vụ, bảo trì
              </span>{" "}
              hoặc bất cứ điều gì liên quan đến tòa nhà nhé.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-md border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Câu hỏi gợi ý
            </p>
            <div className="flex flex-col gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickAsk(q)}
                  className="text-left text-xs px-3 py-2 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 transition text-gray-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {user && (
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-3xl shadow-md p-5 text-white">
              <p className="text-xs uppercase tracking-wide mb-1 opacity-80">
                Tài khoản của bạn
              </p>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-emerald-100 mt-1">
                AI có thể sử dụng thông tin hồ sơ của bạn để gợi ý căn hộ và
                dịch vụ phù hợp hơn.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL – khung chat chính */}
        <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 flex flex-col h-[650px]">
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl bg-white/90">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Trợ lý AI SMARTBUILDING
                </p>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs text-gray-500">Đang hoạt động</span>
                </div>
              </div>
            </div>
            {loading && (
              <span className="text-xs text-emerald-600 animate-pulse">
                Đang soạn câu trả lời…
              </span>
            )}
          </div>

          {/* CHAT BODY */}
          <div
            ref={chatBodyRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 bg-gradient-to-b from-white to-gray-50"
          >
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="mr-2 flex-shrink-0 mt-1 hidden sm:block">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs text-white font-semibold">
                        AI
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] sm:max-w-[75%] px-4 py-3 text-sm shadow-sm leading-relaxed rounded-2xl
                      ${
                        isUser
                          ? "bg-emerald-600 text-white rounded-br-sm"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                      }
                    `}
                  >
                    {renderRichMessage(msg.content)}
                  </div>
                </div>
              );
            })}

            {/* LOADING BUBBLES */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150"></span>
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-300"></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs">
                {error}
              </div>
            )}
          </div>

          {/* INPUT */}
          <form
            onSubmit={handleSubmit}
            className="px-4 sm:px-6 py-4 bg-white/95 border-t border-gray-100 rounded-b-3xl"
          >
            <div className="flex flex-col gap-2">
              {/* Quick chips trên mobile */}
              <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {quickQuestions.slice(0, 3).map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickAsk(q)}
                    className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 transition text-gray-600"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 rounded-full flex items-center px-3 py-1.5 shadow-inner border border-gray-200">
                <input
                  type="text"
                  className="flex-1 px-3 bg-transparent focus:outline-none text-sm text-gray-800"
                  placeholder="Nhập câu hỏi của bạn về căn hộ, dịch vụ, chi phí…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button
                  disabled={loading}
                  className="flex items-center gap-1 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-700 transition disabled:bg-emerald-300"
                >
                  <span className="hidden sm:inline">Gửi</span>
                  <PaperAirplaneIcon className="w-4 h-4 -rotate-45" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
