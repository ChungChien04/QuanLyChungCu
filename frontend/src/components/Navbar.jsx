import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import NewsModal from "../components/NewsModal";

import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  NewspaperIcon,
  UserCircleIcon,
  Cog8ToothIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  ReceiptPercentIcon,
  StarIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const Navbar = () => {
  const { user, logout, token } = useAuth();
  const [news, setNews] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const location = useLocation();

  // Dropdowns
  const [newsDropdownOpen, setNewsDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [popupNews, setPopupNews] = useState(null);

  const newsDropdownRef = useRef(null);
  const adminDropdownRef = useRef(null);

  // Mobile menu
  const [mobileOpen, setMobileOpen] = useState(false);

  // Scroll effect
  const [isScrolled, setIsScrolled] = useState(false);

  const [lastSeen, setLastSeen] = useState(
    Number(localStorage.getItem("lastSeenNews") || 0)
  );

  // ============================
  // SCROLL STYLE
  // ============================
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ============================
  // COUNT CONTRACTS + INVOICES
  // ============================
  useEffect(() => {
    if (!token || user?.role !== "resident") return;

    axios
      .get("/api/rentals/my-rentals", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const count = res.data.filter(
          (c) => c.status === "approved" && !c.contractSigned
        ).length;
        setApprovedCount(count);
      })
      .catch(() => {});

    axios
      .get("/api/invoices/my-unpaid-count", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUnpaidCount(res.data.count))
      .catch(() => {});
  }, [token, user, location.pathname]);

  // ============================
  // LOAD NEWS
  // ============================
  useEffect(() => {
    if (!token) return;
    axios
      .get("/api/news", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setNews(res.data))
      .catch(() => {});
  }, [token]);

  // ============================
  // CLICK OUTSIDE
  // ============================
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

  // ============================
  // UNREAD NEWS
  // ============================
  const unreadCount = useMemo(
    () => news.filter((n) => new Date(n.createdAt).getTime() > lastSeen).length,
    [news, lastSeen]
  );

  // ============================
  // OPEN NEWS POPUP
  // ============================
  const openPopupNews = useCallback((item) => {
    setPopupNews(item);
    const now = Date.now();
    localStorage.setItem("lastSeenNews", String(now));
    setLastSeen(now);
  }, []);

  // ============================
  // UI HELPERS
  // ============================
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navLinkBase =
    "relative inline-flex items-center gap-1.5 text-[0.92rem] font-medium tracking-wide px-3 py-2 rounded-full transition-all duration-200";
  const navLinkClass = (path) =>
    `${navLinkBase} ${
      isActive(path)
        ? "text-emerald-800 bg-emerald-50 shadow-sm"
        : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
    }`;

  const badgeClass =
    "ml-1 bg-red-600 text-white text-[11px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-sm border border-white";

  // ============================
  // MAIN RENDER
  // ============================
  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-xl bg-white/95 shadow-lg border-b border-slate-100"
            : "backdrop-blur-md bg-gradient-to-b from-white/95 via-white/80 to-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* LOGO */}
            <Link
              to="/"
              className="flex items-center gap-3 flex-shrink-0 group"
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br  flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_0_0,white,transparent_55%)]" />
  <img
    src="/logo.png"             // lấy từ thư mục public
    alt="SmartBuilding logo"
    className="relative z-10 w-full h-full object-contain"
  />
</div>


              <div className="flex flex-col">
                <span className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight tracking-tight group-hover:text-emerald-700 transition-colors">
                  SMARTBUILDING
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase tracking-[0.28em]">
                  Resident Portal
                </span>
              </div>
            </Link>

            {/* DESKTOP MENU */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              <Link to="/" className={navLinkClass("/")}>
                Trang chủ
              </Link>
              <Link to="/chatbot" className={navLinkClass("/chatbot")}>
                ChatBot
              </Link>
              <Link to="/apartments" className={navLinkClass("/apartments")}>
                Căn hộ
              </Link>

              {/* NEWS DROPDOWN */}
              <div className="relative" ref={newsDropdownRef}>
                <button
                  onClick={() => setNewsDropdownOpen((prev) => !prev)}
                  className={`${navLinkBase} ${
                    newsDropdownOpen || isActive("/news")
                      ? "text-emerald-800 bg-emerald-50 shadow-sm"
                      : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
                  }`}
                >
                  <NewspaperIcon className="w-4 h-4" />
                  <span>Tin tức</span>
                  {unreadCount > 0 && (
                    <span className={badgeClass}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {newsDropdownOpen && (
                  <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl p-3 z-50 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <h4 className="font-semibold text-slate-900 text-sm">
                        Tin mới nhất
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <BellIcon className="w-4 h-4 text-emerald-600" />
                        {unreadCount > 0 ? (
                          <span>{unreadCount} tin chưa đọc</span>
                        ) : (
                          <span>Đã xem hết</span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                      {news.length === 0 && (
                        <p className="text-slate-500 text-sm px-2 py-1">
                          Không có tin tức
                        </p>
                      )}

                      {news.map((item) => (
                        <div
                          key={item._id}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-emerald-50 cursor-pointer transition"
                          onClick={() => openPopupNews(item)}
                        >
                          <div
                            className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                              new Date(item.createdAt).getTime() > lastSeen
                                ? "bg-red-500"
                                : "bg-slate-300"
                            }`}
                          ></div>

                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-1 text-slate-900 hover:text-emerald-700">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(
                                item.createdAt
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>
                      ))}

                      {news.length > 0 && (
                        <Link
                          to="/news"
                          className="block text-xs text-center text-emerald-700 mt-2 hover:underline"
                          onClick={() => setNewsDropdownOpen(false)}
                        >
                          Xem tất cả tin tức
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RESIDENT MENU */}
              {user && (
                <>
                  <Link to="/profile" className={navLinkClass("/profile")}>
                    Hồ sơ
                  </Link>

                  {user.role === "resident" && (
                    <>
                      <Link
                        to="/my-rentals"
                        className={`${navLinkClass("/my-rentals")} relative`}
                      >
                        Hợp đồng
                        {approvedCount > 0 && (
                          <span className={badgeClass}>
                            {approvedCount > 9 ? "9+" : approvedCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/my-invoices"
                        className={`${navLinkClass("/my-invoices")} relative`}
                      >
                        Hóa đơn
                        {unpaidCount > 0 && (
                          <span className={badgeClass}>
                            {unpaidCount > 9 ? "9+" : unpaidCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            {/* RIGHT SIDE: AUTH + ADMIN + MOBILE BUTTON */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* ADMIN DROPDOWN (desktop) */}
              {user && user.role === "admin" && (
                <div
                  className="relative hidden md:block"
                  ref={adminDropdownRef}
                >
                  <button
                    onClick={() => setAdminDropdownOpen((prev) => !prev)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold shadow-sm transition-all
                      ${
                        adminDropdownOpen
                          ? "border-emerald-700 bg-emerald-700 text-white shadow-md"
                          : "border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50"
                      }`}
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white">
                      <Cog8ToothIcon className="w-3.5 h-3.5" />
                    </span>
                    <span>Quản trị</span>
                    <span
                      className={`text-[10px] transition-transform ${
                        adminDropdownOpen ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {adminDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-[320px] bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn">
                      <div className="px-2 pb-2 border-b border-slate-100 mb-2">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-1">
                          Bảng điều khiển quản trị
                        </p>
                        <p className="text-xs text-slate-500">
                          Quản lý toàn bộ hoạt động của tòa nhà trong một nơi.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-1">
                        {/* DASHBOARD – TỔNG QUAN */}
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-100">
                            <ChartBarIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              Dashboard tổng quan
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Thống kê nhanh hợp đồng, hóa đơn, cư dân, doanh
                              thu.
                            </p>
                          </div>
                        </Link>

                        <Link
                          to="/admin/apartments"
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                            <BuildingOffice2Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              Căn hộ
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Thêm, sửa, bật / tắt và quản lý danh mục căn hộ.
                            </p>
                          </div>
                        </Link>

                        <Link
                          to="/admin/rentals"
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-700 border border-sky-100">
                            <ClipboardDocumentListIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              Hợp đồng
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Duyệt, theo dõi trạng thái và xử lý yêu cầu hủy.
                            </p>
                          </div>
                        </Link>

                        <Link
                          to="/admin/invoices"
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-100">
                            <ReceiptPercentIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              Hóa đơn
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Lập, theo dõi và quản lý thanh toán của cư dân.
                            </p>
                          </div>
                        </Link>

                        <Link
                          to="/admin/news"
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 border border-indigo-100">
                            <NewspaperIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              Tin tức
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Đăng thông báo, bản tin và cập nhật cho cư dân.
                            </p>
                          </div>
                        </Link>

                        <Link
                          to="/admin/reviews"
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-700 border border-pink-100">
                            <StarIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              Đánh giá
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Xem và xử lý đánh giá, góp ý từ cư dân.
                            </p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* USER INFO & AUTH BUTTONS (desktop) */}
              <div className="hidden md:flex items-center gap-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-slate-700 max-w-[160px]">
                      <UserCircleIcon className="w-6 h-6 text-emerald-700" />
                      <span className="font-medium truncate">{user.name}</span>
                    </div>
                    <button
                      onClick={logout}
                      className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold shadow hover:bg-red-600"
                    >
                      Thoát
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-sm font-semibold text-slate-700 hover:text-emerald-700"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-semibold shadow-md hover:from-emerald-700 hover:to-green-700"
                    >
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>

              {/* MOBILE MENU BUTTON */}
              <button
                className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white/90 shadow-sm"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle navigation"
              >
                {mobileOpen ? (
                  <XMarkIcon className="w-5 h-5 text-slate-700" />
                ) : (
                  <Bars3Icon className="w-5 h-5 text-slate-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl shadow-xl animate-fadeIn">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-3 text-sm">
              <div className="flex flex-col gap-1">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass("/")}
                >
                  Trang chủ
                </Link>
                <Link
                  to="/chatbot"
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass("/chatbot")}
                >
                  ChatBot
                </Link>
                <Link
                  to="/apartments"
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass("/apartments")}
                >
                  Căn hộ
                </Link>

                <Link
                  to="/news"
                  onClick={() => setMobileOpen(false)}
                  className={`${navLinkClass("/news")} flex items-center`}
                >
                  Tin tức
                  {unreadCount > 0 && (
                    <span className={badgeClass}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                {user && (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className={navLinkClass("/profile")}
                    >
                      Hồ sơ
                    </Link>

                    {user.role === "resident" && (
                      <>
                        <Link
                          to="/my-rentals"
                          onClick={() => setMobileOpen(false)}
                          className={`${navLinkClass("/my-rentals")} relative`}
                        >
                          Hợp đồng
                          {approvedCount > 0 && (
                            <span className={badgeClass}>
                              {approvedCount > 9 ? "9+" : approvedCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          to="/my-invoices"
                          onClick={() => setMobileOpen(false)}
                          className={`${navLinkClass("/my-invoices")} relative`}
                        >
                          Hóa đơn
                          {unpaidCount > 0 && (
                            <span className={badgeClass}>
                              {unpaidCount > 9 ? "9+" : unpaidCount}
                            </span>
                          )}
                        </Link>
                      </>
                    )}

                    {user.role === "admin" && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="text-[11px] uppercase text-slate-400 tracking-[0.15em] mb-2 flex items-center gap-1">
                          <Cog8ToothIcon className="w-4 h-4 text-emerald-700" />
                          Quản trị hệ thống
                        </p>

                        <Link
                          to="/admin/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 py-1.5 text-slate-700 hover:text-emerald-700"
                        >
                          <span className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-100">
                            <ChartBarIcon className="w-4 h-4" />
                          </span>
                          <span className="text-sm">Dashboard tổng quan</span>
                        </Link>

                        <Link
                          to="/admin/apartments"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 py-1.5 text-slate-700 hover:text-emerald-700"
                        >
                          <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                            <BuildingOffice2Icon className="w-4 h-4" />
                          </span>
                          <span className="text-sm">Quản lý Căn hộ</span>
                        </Link>

                        <Link
                          to="/admin/rentals"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 py-1.5 text-slate-700 hover:text-emerald-700"
                        >
                          <span className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 border border-sky-100">
                            <ClipboardDocumentListIcon className="w-4 h-4" />
                          </span>
                          <span className="text-sm">Quản lý Hợp đồng</span>
                        </Link>

                        <Link
                          to="/admin/invoices"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 py-1.5 text-slate-700 hover:text-emerald-700"
                        >
                          <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-100">
                            <ReceiptPercentIcon className="w-4 h-4" />
                          </span>
                          <span className="text-sm">Quản lý Hóa đơn</span>
                        </Link>

                        <Link
                          to="/admin/news"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 py-1.5 text-slate-700 hover:text-emerald-700"
                        >
                          <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 border border-indigo-100">
                            <NewspaperIcon className="w-4 h-4" />
                          </span>
                          <span className="text-sm">Quản lý Tin tức</span>
                        </Link>

                        <Link
                          to="/admin/reviews"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 py-1.5 text-slate-700 hover:text-emerald-700"
                        >
                          <span className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-pink-700 border border-pink-100">
                            <StarIcon className="w-4 h-4" />
                          </span>
                          <span className="text-sm">Quản lý Đánh giá</span>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <UserCircleIcon className="w-5 h-5 text-emerald-700" />
                      <span className="max-w-[140px] truncate">
                        {user.name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                      }}
                      className="px-4 py-2 rounded-full bg-red-500 text-white text-xs font-semibold shadow hover:bg-red-600"
                    >
                      Thoát
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm font-semibold text-slate-700 hover:text-emerald-700"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-semibold shadow hover:from-emerald-700 hover:to-green-700"
                    >
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* MODAL NEWS */}
      <NewsModal
        show={!!popupNews}
        news={popupNews}
        onClose={() => setPopupNews(null)}
      />
    </>
  );
};

export default Navbar;
