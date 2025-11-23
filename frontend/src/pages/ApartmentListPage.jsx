
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";

const ApartmentListPage = () => {
  const [apartments, setApartments] = useState([]);

  // =========================
  // FILTERS (CHÍNH)
  // =========================
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    rooms: "",
    status: "",
  });

  // Sort
  const [sortPrice, setSortPrice] = useState("");

  // =========================
  // POPUPS
  // =========================
  const [showPricePopup, setShowPricePopup] = useState(false);
  const [showAreaPopup, setShowAreaPopup] = useState(false);
  const [showRoomPopup, setShowRoomPopup] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // =========================
  // TEMP VALUES FOR SMALL POPUPS
  // =========================
  const [tempPrice, setTempPrice] = useState(null);
  const [tempArea, setTempArea] = useState(null);
  const [tempRoom, setTempRoom] = useState("");
  const [tempStatus, setTempStatus] = useState(filters.status);


  // =========================
  // TEMP FILTER FOR SUMMARY POPUP
  // (CHỌN NHIỀU TIÊU CHÍ RỒI BẤM XEM KQ)
  // =========================
  const [tempFilter, setTempFilter] = useState({
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    rooms: "",
    status: "",
  });

  // =========================
  // CLOSE ALL POPUPS
  // =========================
  const closeAll = () => {
    setShowPricePopup(false);
    setShowAreaPopup(false);
    setShowRoomPopup(false);
    setShowStatusPopup(false);
    setShowSummary(false);
  };

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await axios.get("/api/apartments");
        setApartments(data.apartments || []);
      } catch (error) {
        console.error("Lỗi tải căn hộ:", error);
      }
    };
    loadData();
  }, []);

  // =========================
  // AUTO-SEARCH WHEN FILTERS CHANGE
  // =========================
  useEffect(() => {
    const search = async () => {
      try {
        const { data } = await axios.get("/api/apartments/search", {
          params: filters,
        });
        setApartments(data || []);
      } catch (e) {
        console.error("Lỗi search căn hộ:", e);
        setApartments([]);
      }
    };
    search();
  }, [filters]);

  // Manual search (khi cần gọi trực tiếp)
  const handleSearch = async (customFilters) => {
    try {
      const { data } = await axios.get("/api/apartments/search", {
        params: customFilters || filters,
      });
      setApartments(data || []);
    } catch (e) {
      console.error("Lỗi search căn hộ:", e);
      setApartments([]);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="max-w-7xl mx-auto px-6 pt-[80px] pb-20">
      <h1 className="text-4xl font-bold text-green-700 mb-10 text-center">
        Danh sách căn hộ
      </h1>

      {/* FILTER SECTION */}
      <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200 mb-10 relative">
        <div className="flex flex-wrap gap-3 mb-6">
          {/* ===== NÚT PHỄU TỔNG HỢP ===== */}
          <button
            onClick={() => {
              closeAll();
              setTempFilter(filters); // nạp lại filter hiện tại
              setShowSummary(true);
            }}
            className="px-4 py-2 rounded-full bg-red-100 text-red-600 border border-red-300 hover:bg-red-200 flex items-center gap-2"
          >
            <span>🔻</span> Bộ lọc
          </button>

          {/* ===== GIÁ ===== */}
          <div className="relative">
            <button
              onClick={() => {
                closeAll();
                setShowPricePopup(true);
              }}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              Giá ⌄
            </button>

            {showPricePopup && !showSummary && (
              <div className="absolute bg-white shadow-2xl border rounded-2xl p-5 w-[350px] z-50 mt-3">
                <p className="font-semibold mb-4">Chọn mức giá</p>

                <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                  {[
                    { label: "Dưới 3 triệu", min: 0, max: 3000000 },
                    { label: "3–7 triệu", min: 3000000, max: 7000000 },
                    { label: "7–10 triệu", min: 7000000, max: 10000000 },
                    { label: "10–15 triệu", min: 10000000, max: 15000000 },
                    { label: "Trên 15 triệu", min: 15000000, max: 999999999 },
                  ].map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setTempPrice(p)}
                      className={`px-3 py-2 rounded-xl border ${
                        tempPrice?.label === p.label
                          ? "bg-red-50 text-red-600 border-red-400"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={closeAll}
                    className="px-4 py-2 bg-gray-100 rounded-xl w-[45%]"
                  >
                    Đóng
                  </button>

                  <button
                    onClick={() => {
                      if (tempPrice) {
                        const next = {
                          ...filters,
                          minPrice: tempPrice.min,
                          maxPrice: tempPrice.max,
                        };
                        setFilters(next);
                      }
                      closeAll();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl w-[45%]"
                  >
                    Xem kết quả
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ===== DIỆN TÍCH ===== */}
          <div className="relative">
            <button
              onClick={() => {
                closeAll();
                setShowAreaPopup(true);
              }}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              Diện tích ⌄
            </button>

            {showAreaPopup && !showSummary && (
              <div className="absolute bg-white shadow-2xl border rounded-2xl p-5 w-[350px] z-50 mt-3">
                <p className="font-semibold mb-4">Chọn diện tích</p>

                <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                  {[
                    { label: "Dưới 30m²", min: 0, max: 30 },
                    { label: "30–50m²", min: 30, max: 50 },
                    { label: "50–70m²", min: 50, max: 70 },
                    { label: "70–100m²", min: 70, max: 100 },
                    { label: "Trên 100m²", min: 100, max: 999999 },
                  ].map((a, i) => (
                    <button
                      key={i}
                      onClick={() => setTempArea(a)}
                      className={`px-3 py-2 rounded-xl border ${
                        tempArea?.label === a.label
                          ? "bg-red-50 text-red-600 border-red-400"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={closeAll}
                    className="px-4 py-2 bg-gray-100 rounded-xl w-[45%]"
                  >
                    Đóng
                  </button>

                  <button
                    onClick={() => {
                      if (tempArea) {
                        const next = {
                          ...filters,
                          minArea: tempArea.min,
                          maxArea: tempArea.max,
                        };
                        setFilters(next);
                      }
                      closeAll();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl w-[45%]"
                  >
                    Xem kết quả
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ===== PHÒNG NGỦ ===== */}
          <div className="relative">
            <button
              onClick={() => {
                closeAll();
                setShowRoomPopup(true);
              }}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              Phòng ngủ ⌄
            </button>

            {showRoomPopup && !showSummary && (
              <div className="absolute bg-white shadow-2xl border rounded-2xl p-5 w-80 z-50 mt-3">
                <p className="font-semibold mb-4">Chọn số phòng ngủ</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTempRoom(n)}
                      className={`px-3 py-2 rounded-xl border ${
                        tempRoom === n
                          ? "bg-red-50 text-red-600 border-red-400"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {n} phòng ngủ
                    </button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={closeAll}
                    className="px-4 py-2 bg-gray-100 rounded-xl w-[45%]"
                  >
                    Đóng
                  </button>

                  <button
                    onClick={() => {
                      const next = { ...filters, rooms: tempRoom };
                      setFilters(next);
                      closeAll();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl w-[45%]"
                  >
                    Xem kết quả
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ===== TÌNH TRẠNG ===== */}
          <div className="relative">
            <button
              onClick={() => {
                closeAll();
                setShowStatusPopup(true);
              }}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              Tình trạng ⌄
            </button>

            {showStatusPopup && !showSummary && (
              <div className="absolute bg-white shadow-2xl border rounded-2xl p-5 w-[300px] z-50 mt-3">
                <p className="font-semibold mb-4">Chọn trạng thái</p>

                <div className="grid grid-cols-1 gap-3 mb-6">
                  {[
                    { label: "Còn trống", value: "available" },
                    { label: "Đang thuê", value: "rented" },
                    { label: "Đang trong thời gian thuê", value: "reserved" },
                  ].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setTempStatus(s.value)}
                      className={`px-3 py-2 rounded-xl border text-left ${
                        tempStatus === s.value
                          ? "bg-red-50 text-red-600 border-red-400"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={closeAll}
                    className="px-4 py-2 bg-gray-100 rounded-xl w-[45%]"
                  >
                    Đóng
                  </button>

                  <button
                    onClick={() => {
                      const next = { ...filters, status: tempStatus };
                      setFilters(next);
                      closeAll();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl w-[45%]"
                  >
                    Xem kết quả
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== SORT (GIỮ NGUYÊN CỦA BẠN) ===== */}
        <div className="mb-2">
          <p className="font-semibold text-gray-800 mb-3">Sắp xếp theo</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSortPrice("desc")}
              className={`px-4 py-2 rounded-full border ${
                sortPrice === "desc"
                  ? "bg-green-50 text-green-700 border-green-500"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              ⬇️ Giá Cao - Thấp
            </button>

            <button
              onClick={() => setSortPrice("asc")}
              className={`px-4 py-2 rounded-full border ${
                sortPrice === "asc"
                  ? "bg-green-50 text-green-700 border-green-500"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              ⬆️ Giá Thấp - Cao
            </button>
          </div>
        </div>

        {/* ===== POPUP TỔNG HỢP (CHỈ 1 LẦN, NẰM DƯỚI FILTER BOX) ===== */}
        {showSummary && (
          <div className="absolute left-0 right-0 top-full mt-4 bg-white border rounded-2xl shadow-xl z-50 p-5 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* GIÁ */}
              <div>
                <h3 className="font-bold mb-3">Giá</h3>
                {[
                  { label: "Dưới 3 triệu", min: 0, max: 3000000 },
                  { label: "3–7 triệu", min: 3000000, max: 7000000 },
                  { label: "7–10 triệu", min: 7000000, max: 10000000 },
                  { label: "10–15 triệu", min: 10000000, max: 15000000 },
                  { label: "Trên 15 triệu", min: 15000000, max: 999999999 },
                ].map((p, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setTempFilter((prev) => ({
                        ...prev,
                        minPrice: p.min,
                        maxPrice: p.max,
                      }))
                    }
                    className={`px-3 py-2 rounded-xl w-full text-left border ${
                      tempFilter.minPrice === p.min
                        ? "bg-red-100 border-red-400"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* DIỆN TÍCH */}
              <div>
                <h3 className="font-bold mb-3">Diện tích</h3>
                {[
                  { label: "Dưới 30m²", min: 0, max: 30 },
                  { label: "30–50m²", min: 30, max: 50 },
                  { label: "50–70m²", min: 50, max: 70 },
                  { label: "70–100m²", min: 70, max: 100 },
                  { label: "Trên 100m²", min: 100, max: 999999 },
                ].map((a, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setTempFilter((prev) => ({
                        ...prev,
                        minArea: a.min,
                        maxArea: a.max,
                      }))
                    }
                    className={`px-3 py-2 rounded-xl w-full text-left border ${
                      tempFilter.minArea === a.min
                        ? "bg-red-100 border-red-400"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {/* PHÒNG NGỦ */}
              <div>
                <h3 className="font-bold mb-3">Phòng ngủ</h3>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() =>
                      setTempFilter((prev) => ({ ...prev, rooms: n }))
                    }
                    className={`px-3 py-2 rounded-xl w-full text-left border ${
                      tempFilter.rooms === n
                        ? "bg-red-100 border-red-400"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {n} phòng
                  </button>
                ))}
              </div>

              {/* TÌNH TRẠNG */}
              <div>
                <h3 className="font-bold mb-3">Tình trạng</h3>
                {[
                  { label: "Còn trống", value: "available" },
                  { label: "Đang thuê", value: "rented" },
                  { label: "Đang trong thời gian thuê", value: "reserved" },
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setTempFilter((prev) => ({ ...prev, status: s.value }))
                    }
                    className={`px-3 py-2 rounded-xl w-full text-left border ${
                      tempFilter.status === s.value
                        ? "bg-red-100 border-red-400"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowSummary(false)}
                className="px-6 py-2 bg-gray-200 rounded-xl hover:bg-gray-300"
              >
                Đóng
              </button>

              <button
                onClick={() => {
                  setFilters(tempFilter);
                  handleSearch(tempFilter);
                  setShowSummary(false);
                }}
                className="px-8 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                Xem kết quả
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LIST */}
      {apartments.length === 0 ? (
        <div className="text-center text-gray-600 text-lg py-20">
          Không tìm thấy căn hộ phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {[...apartments]
            .sort((a, b) => {
              if (sortPrice === "asc") return a.price - b.price;
              if (sortPrice === "desc") return b.price - a.price;
              return 0;
            })
            .map((apt) => (
              <Link
                key={apt._id}
                to={`/apartment/${apt._id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="h-56 w-full overflow-hidden">
                  <img
                    src={
                      apt.images?.[0]
                        ? apt.images[0].startsWith("http")
                          ? apt.images[0]
                          : `${API_BASE}/${apt.images[0].replace(/\\/g, "/")}`
                        : "https://placehold.co/600x400"
                    }
                    alt={apt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-5">
                  <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-green-700">
                    {apt.title}
                  </h4>

                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {apt.description}
                  </p>

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xl font-bold text-green-700">
                      {apt.price?.toLocaleString?.()} VNĐ
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        apt.status === "available"
                          ? "bg-green-100 text-green-700"
                          : apt.status === "rented"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {apt.status === "available"
                        ? "Còn trống"
                        : apt.status === "rented"
                        ? "Đang thuê"
                        : "Đang trong thời gian thuê"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
};

export default ApartmentListPage;
