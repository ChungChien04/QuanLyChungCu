import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import BuildingMap from "../components/BuildingMap";

const API_BASE = "http://localhost:5000";

const bannerHighlights = [
  "Hơn 200+ căn hộ được quản lý chuyên nghiệp tại SMARTBUILDING",
  "Hỗ trợ hợp đồng, hóa đơn, dịch vụ 100% trên nền tảng số",
  "Căn hộ đầy đủ tiện ích: gym, hồ bơi, bãi đỗ xe, bảo vệ 24/7",
];

const HomePage = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  const [highlightIndex, setHighlightIndex] = useState(0);
  const navigate = useNavigate();

  // ⭐ Auto đổi text banner
  useEffect(() => {
    const timer = setInterval(() => {
      setHighlightIndex((prev) => (prev + 1) % bannerHighlights.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // ⭐ Lấy danh sách featured
  const fetchFeatured = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/apartments/featured`);
      setApartments(data.apartments || []);
    } catch {
      setError("Không thể tải căn hộ nổi bật");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatured();
  }, []);

  // ⭐ Khi bấm tìm kiếm → chuyển sang trang /apartments (KHÔNG search tại Home nữa)
  const handleSearch = () => {
    const q = keyword.trim();

    if (!q) {
      // nếu không nhập gì, cho sang trang tất cả căn hộ
      navigate("/apartments");
    } else {
      navigate(`/apartments?keyword=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* LOADING UI */}
      {loading && (
        <div className="w-full flex justify-center items-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* HERO + SEARCH */}
      {!loading && (
        <>
          {/* HERO BANNER */}
          <section className="relative w-full h-[380px] overflow-hidden rounded-b-3xl shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=60"
              alt="Hero"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/45 to-black/10" />

            {/* CONTENT */}
            <div className="relative z-10 max-w-7xl mx-auto h-full px-6 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between">
              {/* LEFT TEXT BLOCK */}
              <div className="text-white max-w-xl space-y-4">
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">
                  SMARTBUILDING • RESIDENT PORTAL
                </p>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  Quản lý & tìm kiếm căn hộ
                  <span className="text-emerald-300"> thông minh</span>
                </h1>

                {/* banner chạy – highlight text */}
                <div className="h-10 flex items-center">
                  <p className="text-sm md:text-base text-emerald-50 transition-all duration-500">
                    {bannerHighlights[highlightIndex]}
                  </p>
                </div>

                {/* small stats */}
                <div className="flex gap-6 text-xs md:text-sm text-emerald-100">
                  <div>
                    <p className="font-semibold text-white">Cư dân tin tưởng</p>
                    <p>Hệ thống tích hợp hợp đồng & hóa đơn</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Hỗ trợ 24/7</p>
                    <p>Trợ lý AI & đội ngũ quản lý tòa nhà</p>
                  </div>
                </div>
              </div>

              {/* SEARCH CARD */}
              <div className="w-full md:w-[380px] mt-6 md:mt-0">
                <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-6 border border-emerald-50">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Tìm kiếm căn hộ
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">
                    Nhập từ khóa để tìm kiếm trong tất cả căn hộ tại SMARTBUILDING.
                  </p>

                  {/* search input */}
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nhập tên căn hộ, mô tả, tiện ích..."
                        className="w-full p-3 pl-11 border border-gray-200 rounded-xl
                                  focus:ring-2 focus:ring-emerald-300 focus:border-emerald-600
                                  outline-none text-sm text-gray-800 bg-gray-50"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                        🔍
                      </span>
                    </div>

                    {/* quick tags */}
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {["2 phòng ngủ", "View hồ bơi", "Giá dưới 7 triệu"].map(
                        (tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setKeyword(tag);
                              // bấm lần nữa có thể cho auto search, tùy bạn
                            }}
                            className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition"
                          >
                            {tag}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={handleSearch}
                      className="mt-1 bg-emerald-600 hover:bg-emerald-700 
                                 w-full py-2.5 rounded-xl text-white text-sm font-semibold shadow-md
                                 transition"
                    >
                      Tìm kiếm căn hộ
                    </button>
                  </div>

                  <p className="mt-3 text-[11px] text-gray-400">
                    *Kết quả chi tiết sẽ hiển thị ở trang &quot;Danh sách căn hộ&quot;.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* TITLE */}
          <h2 className="mt-8 text-3xl font-bold text-center text-emerald-700 mb-3">
            CĂN HỘ NỔI BẬT
          </h2>
          <p className="text-center text-sm text-gray-500 mb-8 px-4">
            Những căn hộ được lựa chọn kỹ lưỡng với vị trí đẹp, tiện ích đầy đủ
            và mức giá cạnh tranh.
          </p>

          {/* ⭐ SLIDER NGANG – chỉ featured */} 
          <div className="max-w-7xl mx-auto px-6 mb-16">
            <div className="w-full overflow-x-auto scrollbar-hide">
              <div className="flex gap-6 pb-4">
                {apartments.map((apt) => (
                  <Link
                    key={apt._id}
                    to={`/apartment/${apt._id}`}
                    className="min-w-[300px] max-w-[300px] bg-white rounded-2xl overflow-hidden 
                               shadow-md hover:shadow-2xl border border-gray-100 hover:border-emerald-200
                               transition-all duration-200"
                  >
                    <div className="relative h-48 w-full overflow-hidden">
                      {apt.featured && (
                        <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          NỔI BẬT
                        </span>
                      )}
                      <img
                        src={
                          apt.images?.[0]
                            ? apt.images[0].startsWith("http")
                              ? apt.images[0]
                              : `${API_BASE}/${apt.images[0].replace(/\\/g, "/")}`
                            : "https://placehold.co/600x400"
                        }
                        alt={apt.title}
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="p-5">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                        {apt.title}
                      </h4>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {apt.description}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xl font-bold text-emerald-700">
                          {apt.price.toLocaleString()} VNĐ
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}

                {apartments.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-10">
                    Không có căn hộ nổi bật nào.
                  </div>
                )}
              </div>
            </div>
          </div>
          <section className="bg-white/70 border-t border-emerald-100 py-10">
  <div className="max-w-7xl mx-auto px-6">
    <h3 className="text-2xl font-bold text-emerald-800 mb-4">
      Vị trí tòa nhà SMARTBUILDING
    </h3>

    <div className="w-full h-[320px] rounded-2xl overflow-hidden shadow-lg border border-emerald-100">
      <BuildingMap />
    </div>
  </div>
</section>

        </>
      )}
    </div>
  );
};

export default HomePage;
