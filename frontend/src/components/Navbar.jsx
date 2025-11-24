import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import NewsModal from "../components/NewsModal";

const Navbar = () => {
  const { user, logout, token } = useAuth();
  const [news, setNews] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0); // Hợp đồng cần ký
  const [unpaidCount, setUnpaidCount] = useState(0);
  const location = useLocation();
  // Dropdown states
  const [newsDropdownOpen, setNewsDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [popupNews, setPopupNews] = useState(null);

  const newsDropdownRef = useRef(null);
  const adminDropdownRef = useRef(null);

  const [lastSeen, setLastSeen] = useState(
    Number(localStorage.getItem("lastSeenNews") || 0)
  );

  // --- Load hợp đồng cư dân ---
  const [myContracts, setMyContracts] = useState([]);

  // 2️⃣ Gọi API lấy dữ liệu khi User đăng nhập
  useEffect(() => {
    if (!token || user?.role !== "resident") return;

    // A. Đếm hợp đồng cần ký
    axios.get("/api/rentals/my-rentals", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const count = res.data.filter(c => c.status === "approved" && !c.contractSigned).length;
        setApprovedCount(count);
      })
      .catch(() => {});

    // B. Đếm hóa đơn cần thanh toán 🔥
    axios.get("/api/invoices/my-unpaid-count", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setUnpaidCount(res.data.count);
      })
      .catch(() => {});
  }, [token, user, location.pathname]);
  useEffect(() => {
    if (!token || user?.role !== "resident") return;
    axios
      .get("/api/rentals/my-rentals", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMyContracts(res.data))
      .catch(() => {});
  }, [token, user]);


  // --- Load News ---
  useEffect(() => {
    if (!token) return;
    axios
      .get("/api/news", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setNews(res.data))
      .catch(() => {});
  }, [token]);

  // --- Click Outside Handler ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        newsDropdownRef.current &&
        !newsDropdownRef.current.contains(e.target)
      ) {
        setNewsDropdownOpen(false);
      }
      if (
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(e.target)
      ) {
        setAdminDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = useMemo(
    () =>
      news.filter((item) => new Date(item.createdAt).getTime() > lastSeen)
        .length,
    [news, lastSeen]
  );

  const openPopupNews = (item) => {
    setPopupNews(item);
    setLastSeen(() => {
      const now = Date.now();
      localStorage.setItem("lastSeenNews", now);
      return now;
    });
  };

  // Style chung cho link menu chính (Chữ to hơn - text-base hoặc text-lg)
  const navLinkClass =
    "text-gray-700 hover:text-green-700 transition px-2 text-base font-semibold";

  // Style chung cho item trong dropdown (Hiệu ứng hover)
  const dropdownItemClass =
    "block px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-green-700 transition-colors cursor-pointer";

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-green-700 flex-shrink-0"
          >
            SMARTBUILDING
          </Link>

          {/* Desktop Menu (Center) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={navLinkClass}>
              Home
            </Link>
            <Link to="/chatbot" className={navLinkClass}>
              ChatBot
            </Link>
            <Link to="/apartments" className={navLinkClass}>
              Căn hộ
            </Link>

            {/* News Dropdown */}
            <div className="relative" ref={newsDropdownRef}>
              <button
                onClick={() => setNewsDropdownOpen(!newsDropdownOpen)}
                className={`relative flex items-center ${navLinkClass}`}
              >
                Tin tức
                {unreadCount > 0 && (
                  <span className="ml-1 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {newsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white shadow-xl border rounded-xl p-2 z-50 animate-fadeIn">
                  <h4 className="font-semibold mb-2 px-2 text-gray-800 border-b pb-1">
                    Tin mới nhất
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {news.length === 0 && (
                      <p className="text-gray-500 text-sm px-2 py-1">
                        Không có tin tức
                      </p>
                    )}
                    {news.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-green-50 cursor-pointer transition-colors group"
                        onClick={() => openPopupNews(item)}
                      >
                        <div
                          className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                            new Date(item.createdAt).getTime() > lastSeen
                              ? "bg-red-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1 group-hover:text-green-700 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Link */}
            {user && (
              <>
                <Link to="/profile" className={navLinkClass}>
                  Hồ sơ
                </Link>
                {user.role === "resident" && (
                  <>
                  {/* 🟢 LINK HỢP ĐỒNG (Logic cũ) */}
                  <Link to="/my-rentals" className={`relative flex items-center ${navLinkClass}`}>
                    Hợp đồng
                    {approvedCount > 0 && (
                      <span className="ml-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-white">
                        {approvedCount}
                      </span>
                    )}
                  </Link>

                  {/* 🟢 LINK HÓA ĐƠN (Logic Mới) */}
                  <Link to="/my-invoices" className={`relative flex items-center ${navLinkClass}`}>
                    Hóa đơn
                    {/* 🔥 CHẤM ĐỎ BÁO HIỆU CẦN ĐÓNG TIỀN */}
                    {unpaidCount > 0 && (
                      <span className="ml-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-white">
                        {unpaidCount}
                      </span>
                    )}
                  </Link>
                </>
                )}
              </>
            )}
          </div>

          {/* Right side (Admin Menu & Auth) */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* 🔥 ADMIN MENU DROPDOWN */}
                {user.role === "admin" && (
                  <div className="relative" ref={adminDropdownRef}>
                    <button
                      onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                      className="flex items-center gap-1 px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition font-semibold shadow-sm"
                    >
                      Quản lý ▼
                    </button>

                    {adminDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-50 bg-white border rounded-xl shadow-2xl z-50 py-2 animate-fadeIn">
                        <Link
                          to="/admin/apartments"
                          className={dropdownItemClass}
                        >
                          Quản lý Căn hộ
                        </Link>
                        <Link
                          to="/admin/invoices"
                          className={dropdownItemClass}
                        >
                          Quản lý Hóa đơn
                        </Link>
                        <Link to="/admin/rentals" className={dropdownItemClass}>
                          Quản lý Hợp đồng
                        </Link>
                        <Link to="/admin/news" className={dropdownItemClass}>
                          Quản lý Tin tức
                        </Link>
                        <Link to="/admin/reviews" className={dropdownItemClass}>
                          Quản lý Đánh giá
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-gray-700 text-sm hidden lg:block font-medium">
                    Hi, {user.name}
                  </span>
                  <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition font-medium shadow-sm"
                  >
                    Thoát
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-sm font-medium">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-green-700 transition px-2"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 transition shadow-md"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <NewsModal
        show={!!popupNews}
        news={popupNews}
        onClose={() => setPopupNews(null)}
      />
    </nav>
  );
};

export default Navbar;
