import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import NewsModal from "../components/NewsModal";

const Navbar = () => {
  const { user, logout, token } = useAuth();
  const [news, setNews] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [popupNews, setPopupNews] = useState(null);
  const dropdownRef = useRef(null);

  const [lastSeen, setLastSeen] = useState(
    Number(localStorage.getItem("lastSeenNews") || 0)
  );

  // -------------------------------
  // ⚡ THÊM: Load hợp đồng của cư dân
  // -------------------------------
  const [myContracts, setMyContracts] = useState([]);

  useEffect(() => {
    if (!token || user?.role !== "resident") return;

    axios
      .get("/api/rentals/my-rentals", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMyContracts(res.data))
      .catch(() => {});
  }, [token, user]);

  // ⚡ Đếm hợp đồng được admin duyệt (status = approved)
  const approvedCount = useMemo(() => {
    return myContracts.filter(
      (c) => c.status === "approved" && !c.contractSigned
    ).length;
  }, [myContracts]);
  // -------------------------------


  // Load news
  useEffect(() => {
    if (!token) return;

    axios
      .get("/api/news", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setNews(res.data))
      .catch(() => {});
  }, [token]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = useMemo(() => {
    return news.filter(
      (item) => new Date(item.createdAt).getTime() > lastSeen
    ).length;
  }, [news, lastSeen]);

  const openPopupNews = (item) => {
    setPopupNews(item);
    setLastSeen(() => {
      const now = Date.now();
      localStorage.setItem("lastSeenNews", now);
      return now;
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-green-700">
            SMARTBUILDING
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">

            <Link
              to="/"
              className="text-gray-700 hover:text-green-700 transition px-2"
            >
              Trang chủ
            </Link>

            <Link
              to="/chatbot"
              className="text-gray-700 hover:text-green-700 transition px-2"
            >
              ChatBot AI
            </Link>

            <Link
              to="/apartments"
              className="text-gray-700 hover:text-green-700 transition px-2"
            >
              Danh sách căn hộ
            </Link>

            {/* News Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative font-medium text-gray-700 hover:text-green-700 transition"
              >
                Tin tức
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-4 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white shadow-xl border rounded-xl p-3 z-50">
                  <h4 className="font-semibold mb-2">Tin mới</h4>

                  {news.length === 0 && (
                    <p className="text-gray-500 text-sm">Không có tin tức</p>
                  )}

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {news.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-start gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                        onClick={() => openPopupNews(item)}
                      >
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

            {/* Profile + My Rentals */}
            {user && (
              <>
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-green-700 px-2"
                >
                  Hồ sơ
                </Link>

                {user.role === "resident" && (
                  <Link
                    to="/my-rentals"
                    className="relative text-gray-700 hover:text-green-700 px-2"
                  >
                    Hợp đồng của tôi

                    {/* 🔥 NÚT ĐỎ KHI ADMIN DUYỆT HỢP ĐỒNG */}
                    {approvedCount > 0 && (
                      <span className="absolute -top-1 -right-3 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow">
                        {approvedCount}
                      </span>
                    )}
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-gray-700 font-medium">
                  Xin chào, {user.name}
                </span>

                {user.role === "admin" && (
                  <>
                    <Link
                      to="/admin/apartments"
                      className="border border-green-700 text-green-700 px-3 py-1 rounded-md text-sm hover:bg-green-700 hover:text-white transition"
                    >
                      Quản lý căn hộ
                    </Link>

                    <Link
                      to="/admin/news"
                      className="border border-green-700 text-green-700 px-3 py-1 rounded-md text-sm hover:bg-green-700 hover:text-white transition"
                    >
                      Quản lý tin tức
                    </Link>

                    <Link
                      to="/admin/rentals"
                      className="border border-green-700 text-green-700 px-3 py-1 rounded-md text-sm hover:bg-green-700 hover:text-white transition"
                    >
                      Quản lý hợp đồng
                    </Link>

                    <Link
                      to="/admin/reviews"
                      className="border border-green-700 text-green-700 px-3 py-1 rounded-md text-sm hover:bg-green-700 hover:text-white transition"
                    >
                      Quản lý đánh giá
                    </Link>
                  </>
                )}

                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 transition"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-green-700 px-2 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

        </div>
      </div>

      {/* News popup */}
      <NewsModal
        show={!!popupNews}
        news={popupNews}
        onClose={() => setPopupNews(null)}
      />
    </nav>
  );
};

export default Navbar;
