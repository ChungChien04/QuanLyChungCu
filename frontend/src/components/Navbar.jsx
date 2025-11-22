import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import axios from "axios";
import NewsModal from "../components/NewsModal";

const API_URL = "http://localhost:5000";

// Chuẩn hóa đường dẫn ảnh


// Chuẩn hóa ảnh trong nội dung


const Navbar = () => {
  const { user, logout, token } = useAuth();

  const [news, setNews] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [popupNews, setPopupNews] = useState(null);
  const dropdownRef = useRef(null);

  // Lưu mốc thời gian tin cuối cùng đã xem
  const [lastSeen, setLastSeen] = useState(
    Number(localStorage.getItem("lastSeenNews") || 0)
  );

  // ===== LOAD NEWS =====
  useEffect(() => {
    if (!token) return;

    axios
      .get("/api/news", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setNews(res.data))
      .catch(() => {});
  }, [token]);

  // ===== CLICK OUTSIDE CLOSE =====
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===== UNREAD COUNT =====
  const unreadCount = useMemo(() => {
    if (news.length === 0) return 0;

    return news.filter(
      (item) => new Date(item.createdAt).getTime() > lastSeen
    ).length;
  }, [news, lastSeen]);

  // ===== OPEN A NEWS POPUP =====
  const openPopupNews = (item) => {
    setPopupNews(item);

    const now = new Date().getTime();
    localStorage.setItem("lastSeenNews", now);
    setLastSeen(now);
  };

  const openNewsList = () => setDropdownOpen(!dropdownOpen);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* LOGO */}
          <Link to="/" className="text-2xl font-bold text-green-700">
            SMARTBUILDING
          </Link>

          {/* MENU */}
          <div className="hidden md:flex items-center space-x-8">

            <Link to="/" className="text-gray-700 hover:text-green-700 px-3">
              Trang chủ
            </Link>

            <Link to="/chatbot" className="text-gray-700 hover:text-green-700 px-3">
              ChatBot AI
            </Link>

            <Link to="/apartments" className="text-gray-700 hover:text-green-700 px-3">
              Danh sách căn hộ
            </Link>

            {/* ========= NEWS DROPDOWN ========= */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={openNewsList} className="relative">
                Tin tức

                {unreadCount > 0 && (
                  <span className="
                    absolute -top-1 -right-3 bg-red-600 text-white text-xs
                    w-5 h-5 flex items-center justify-center rounded-full shadow
                  ">
                    {unreadCount}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white shadow-lg border rounded-xl p-3 z-50">
                  <h4 className="font-semibold mb-2">Tin mới</h4>

                  {news.length === 0 && (
                    <p className="text-gray-500 text-sm">Không có tin tức</p>
                  )}

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {news.map((item) => (
                      <div
                        key={item._id}
                        className="p-2 hover:bg-gray-100 rounded cursor-pointer flex items-start gap-2"
                        onClick={() => openPopupNews(item)}
                      >
                        {/* DOT UNREAD */}
                        {new Date(item.createdAt).getTime() > lastSeen && (
                          <span className="w-2 h-2 bg-red-600 rounded-full mt-2"></span>
                        )}

                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user && (
              <Link to="/profile" className="text-gray-700 hover:text-green-700 px-3">
                Hồ sơ
              </Link>
            )}
          </div>

          {/* USER AREA */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700">Chào, {user.name}!</span>

                {user.role === "admin" && (
                  <>
                    <Link
                      to="/admin/apartments"
                      className="border border-green-700 text-green-700 px-3 py-1 rounded-md text-sm"
                    >
                      Quản lý căn hộ
                    </Link>

                    <Link
                      to="/admin/news"
                      className="border border-green-700 text-green-700 px-3 py-1 rounded-md text-sm"
                    >
                      Quản lý tin tức
                    </Link>
                  </>
                )}

                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-green-700 px-3">
                  Đăng nhập
                </Link>
                <Link to="/register" className="bg-green-700 text-white px-4 py-2 rounded-md">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ⭐ POPUP NEWS DETAIL — SỬ DỤNG NewsModal.jsx */}
      <NewsModal
        show={!!popupNews}
        news={popupNews}
        onClose={() => setPopupNews(null)}
      />
    </nav>
  );
};

export default Navbar;
