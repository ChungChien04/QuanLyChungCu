// src/components/FloatingSupportButton.jsx
import React, { useState, useEffect } from "react";
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const FloatingSupportButton = () => {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(""); // thông báo nhỏ (PC copy số)

  // 👉 Không dùng state cho isMobile nữa, tính trực tiếp từ navigator
  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Tự ẩn toast sau 2.5s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleHotlineClick = async () => {
    const phone = "0399043104"; // 👉 Thay hotline thật của bạn

    if (isMobile) {
      // Mobile → gọi thẳng
      window.location.href = `tel:${phone}`;
      return;
    }

    // Desktop → copy vào clipboard + hiện toast
    try {
      await navigator.clipboard.writeText(phone);
      setToast(`Đã sao chép số hotline: ${phone}`);
    } catch (err) {
      console.error("Clipboard error:", err);
      setToast(`Vui lòng gọi số: ${phone}`);
    }
  };

  return (
    <>
      {/* Nút nổi */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-12 h-12 rounded-full shadow-xl
                   bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700
                   text-white transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        {open ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        )}
      </button>

      {/* Popup chọn kênh liên hệ */}
      {open && (
        <div
          className="fixed bottom-20 right-5 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4
                     animate-fadeIn transform origin-bottom-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Liên hệ hỗ trợ
              </p>
              <p className="text-xs text-slate-500">
                Kết nối nhanh với quản trị tòa nhà.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-slate-100 transition"
            >
              <XMarkIcon className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Zalo */}
            <a
              href="https://zalo.me/0399043104" // 👉 Thay số Zalo thật của bạn
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 
                         hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                {/* Logo Zalo thật → public/zalo.png */}
                <img
                  src="/zalo.svg"
                  alt="Zalo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Zalo hỗ trợ</p>
                <p className="text-[11px] text-slate-500">
                  Nhắn tin trực tiếp với quản trị viên qua Zalo.
                </p>
              </div>
            </a>

            {/* Hotline */}
            <div
              onClick={handleHotlineClick}
              className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 
                         hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 font-bold text-lg">☎</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Hotline 24/7</p>
                <p className="text-[11px] text-slate-500">
                  {isMobile
                    ? "Nhấn để gọi ngay cho lễ tân."
                    : "Nhấn để sao chép số, sau đó hãy gọi bằng điện thoại."}
                </p>
              </div>
            </div>
          </div>

          {/* Footer nhỏ */}
          <div className="mt-3 pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              Thời gian hỗ trợ: 08:00 - 21:00 (kể cả cuối tuần).
            </p>
          </div>
        </div>
      )}

      {/* Toast nhỏ ở góc khi copy hotline trên PC */}
      {toast && (
        <div className="fixed bottom-5 right-24 z-[60]">
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 text-xs text-white shadow-lg max-w-xs">
            {toast}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingSupportButton;
