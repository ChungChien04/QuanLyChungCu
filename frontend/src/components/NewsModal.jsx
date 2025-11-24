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
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">

        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">{news.title}</h2>
          <button 
            onClick={onClose} 
            className="text-2xl hover:text-red-500 transition"
          >
            ×
          </button>
        </div>

        {/* LAYOUT NGANG */}
        <div className="flex gap-6 p-6">

          {/* THUMBNAIL BÊN TRÁI */}
          {fixedThumbnail && (
            <div className="w-1/3 max-w-[260px] h-[180px] flex-shrink-0 overflow-hidden rounded-xl shadow">
              <img
                src={fixedThumbnail}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* CONTENT BÊN PHẢI */}
          <div className="flex-1 max-h-[50vh] overflow-y-auto 
                          prose prose-img:rounded-xl prose-img:shadow 
                          prose-p:text-gray-700 prose-headings:text-gray-800">
            <div dangerouslySetInnerHTML={{ __html: fixedContent }} />
          </div>

        </div>

        {/* META */}
        <div className="px-6 py-3 text-sm text-gray-500 flex justify-between border-t">
          <span>{new Date(news.createdAt).toLocaleString("vi-VN")}</span>
          <span className="font-medium text-gray-700">{news.createdBy?.name}</span>
        </div>

      </div>
    </div>
  );
};

export default NewsModal;
