import React from "react";
const API_URL = "http://localhost:5000";

const NewsModal = ({ show, onClose, news }) => {
  if (!show || !news) return null;

  // === FIX THUMBNAIL ===
  const fixedThumbnail = news.thumbnail?.startsWith("/uploads")
    ? `${API_URL}${news.thumbnail}`
    : news.thumbnail;

  // === FIX IMAGE TRONG CONTENT ===
  const fixedContent = news.content
    ? news.content.replace(/src="\/uploads/gi, `src="${API_URL}/uploads`)
    : "";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden animate-fadeIn border border-emerald-50">
        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-4 border-b bg-emerald-700 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-100">
              Bản tin chung cư
            </p>
            <h2 className="text-xl md:text-2xl font-semibold line-clamp-2">
              {news.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="flex flex-col md:flex-row gap-6 p-6 bg-slate-50/70">
          {/* THUMBNAIL */}
          {fixedThumbnail && (
            <div className="md:w-1/3 w-full max-w-[280px] md:max-w-[260px] h-[180px] md:h-[200px] flex-shrink-0 overflow-hidden rounded-xl shadow-md mx-auto md:mx-0">
              <img
                src={fixedThumbnail}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* CONTENT */}
          <div
            className="flex-1 max-h-[50vh] md:max-h-[60vh] overflow-y-auto 
                       prose prose-sm md:prose 
                       prose-img:rounded-xl prose-img:shadow 
                       prose-p:text-gray-700 prose-headings:text-gray-800"
          >
            <div dangerouslySetInnerHTML={{ __html: fixedContent }} />
          </div>
        </div>

        {/* FOOTER / META */}
        <div className="px-6 py-3 text-xs md:text-sm text-gray-500 flex flex-col md:flex-row md:items-center justify-between gap-2 border-t bg-white">
          <span>
            {new Date(news.createdAt).toLocaleString("vi-VN")}
          </span>
          <span className="font-medium text-gray-700">
            {news.createdBy?.name || "Ban quản lý"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;
