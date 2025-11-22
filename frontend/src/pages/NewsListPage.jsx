import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import NewsModal from "../components/NewsModal";

const API_URL = "http://localhost:5000";

const NewsListPage = () => {
  const { token } = useAuth();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✨ State popup
  const [selectedNews, setSelectedNews] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);

        const { data } = await axios.get("/api/news", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const normalized = data.map((item) => ({
          ...item,
          thumbnail: item.thumbnail?.toLowerCase() || "",
        }));

        setNews(normalized);
        setError("");

      } catch  {
        setError("Không tải được tin tức.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [token]);

  if (loading) return <p className="text-center mt-10">Đang tải tin tức...</p>;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 pt-[80px] pb-16">

      <h1 className="text-3xl font-bold mb-6 text-gray-900">Tin tức</h1>

      {news.length === 0 ? (
        <p className="text-gray-500">Chưa có tin tức nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item) => (
            <div
              key={item._id}
              className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white cursor-pointer"
              onClick={() => {
                setSelectedNews(item);
                setShowModal(true);
              }}
            >
              {/* Thumbnail */}
              {item.thumbnail && (
                <img
                  src={`${API_URL}${item.thumbnail}`}
                  alt={item.title}
                  className="w-full h-40 object-cover"
                />
              )}

              <div className="p-4">
                <h2 className="font-semibold text-lg mb-1 line-clamp-2">
                  {item.title}
                </h2>

                <p className="text-xs text-gray-500 mb-2">
                  {new Date(item.createdAt).toLocaleString("vi-VN")}
                </p>

                <p className="text-sm text-gray-600 line-clamp-3">
                  {item.content.replace(/<[^>]+>/g, "").slice(0, 120)}
                  {item.content.replace(/<[^>]+>/g, "").length > 120 && "..."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      <NewsModal
        show={showModal}
        news={selectedNews}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default NewsListPage;
