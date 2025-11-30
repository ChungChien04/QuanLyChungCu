import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";

const API_BASE = "http://localhost:5000";

const baseFilters = {
  q: "",
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
  rooms: "",
  status: "",
};

const ApartmentListPage = () => {
  const [apartments, setApartments] = useState([]);

  const [searchParams] = useSearchParams();
  const keywordFromUrl = searchParams.get("keyword") || "";

  const [filters, setFilters] = useState({
    ...baseFilters,
    q: keywordFromUrl,
  });

  const [sortPrice, setSortPrice] = useState("");

  // POPUPS
  const [showPricePopup, setShowPricePopup] = useState(false);
  const [showAreaPopup, setShowAreaPopup] = useState(false);
  const [showRoomPopup, setShowRoomPopup] = useState(false);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // TEMP VALUES
  const [tempPrice, setTempPrice] = useState(null);
  const [tempArea, setTempArea] = useState(null);
  const [tempRoom, setTempRoom] = useState("");
  const [tempStatus, setTempStatus] = useState("");

  const [tempFilter, setTempFilter] = useState({
    ...baseFilters,
    q: keywordFromUrl,
  });

  const closeAll = () => {
    setShowPricePopup(false);
    setShowAreaPopup(false);
    setShowRoomPopup(false);
    setShowStatusPopup(false);
    setShowSummary(false);
  };

  // LOAD ALL IF NO KEYWORD
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!keywordFromUrl) {
          const { data } = await axios.get("/api/apartments");
          setApartments(data.apartments || []);
        }
      } catch (error) {
        console.error("Lỗi tải căn hộ:", error);
      }
    };
    loadData();
  }, [keywordFromUrl]);

  // AUTO SEARCH WHEN FILTERS CHANGE
  useEffect(() => {
    const hasAnyFilter =
      filters.q ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.minArea ||
      filters.maxArea ||
      filters.rooms ||
      filters.status;

    const search = async () => {
      try {
        if (!hasAnyFilter) {
          const { data } = await axios.get("/api/apartments");
          setApartments(data.apartments || []);
          return;
        }

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

  const handleSearch = async (customFilters) => {
    try {
      const f = customFilters || filters;
      const { data } = await axios.get("/api/apartments/search", {
        params: f,
      });
      setApartments(data || []);
    } catch (e) {
      console.error("Lỗi search căn hộ:", e);
      setApartments([]);
    }
  };

  const handleClearFilters = async () => {
    const reset = { ...baseFilters };
    setFilters(reset);
    setTempFilter(reset);
    setTempPrice(null);
    setTempArea(null);
    setTempRoom("");
    setTempStatus("");
    setSortPrice("");

    try {
      const { data } = await axios.get("/api/apartments");
      setApartments(data.apartments || []);
    } catch (error) {
      console.error("Lỗi khi xóa bộ lọc và tải lại căn hộ:", error);
      setApartments([]);
    }

    closeAll();
  };

  /* ---------- DATA CONFIG ---------- */

  const priceOptions = [
    { label: "Dưới 3 triệu", min: 0, max: 3000000 },
    { label: "3–7 triệu", min: 3000000, max: 7000000 },
    { label: "7–10 triệu", min: 7000000, max: 10000000 },
    { label: "10–15 triệu", min: 10000000, max: 15000000 },
    { label: "Trên 15 triệu", min: 15000000, max: 999999999 },
  ];

  const areaOptions = [
    { label: "Dưới 30m²", min: 0, max: 30 },
    { label: "30–50m²", min: 30, max: 50 },
    { label: "50–70m²", min: 50, max: 70 },
    { label: "70–100m²", min: 70, max: 100 },
    { label: "Trên 100m²", min: 100, max: 999999 },
  ];

  const statusOptions = [
    { label: "Còn trống", value: "available" },
    { label: "Đang thuê", value: "rented" },
    { label: "Đang trong thời gian thuê", value: "reserved" },
  ];

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* HEADER GIỐNG SCREENSHOT */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 pt-[96px] pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-emerald-700 mb-2">
            Danh sách căn hộ
          </h1>
          <p className="text-sm md:text-base text-emerald-900/80 max-w-2xl">
            Lọc theo giá, diện tích, số phòng, tình trạng… để tìm căn hộ phù hợp
            nhất với nhu cầu của bạn.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT (FILTER + LIST) */}
      <div className="max-w-7xl mx-auto px-6 pb-20 -mt-6 relative z-10">
        {/* FILTER CARD */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-md border border-gray-200 mb-10">
          {filters.q && (
            <div className="mb-3 text-sm text-gray-600 flex items-center gap-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Từ khóa
              </span>
              <span>
                Kết quả cho&nbsp;
                <span className="font-semibold text-emerald-700">
                  &quot;{filters.q}&quot;
                </span>
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-4">
            {/* BỘ LỌC CHI TIẾT */}
            <button
              onClick={() => {
                closeAll();
                setTempFilter(filters);
                setShowSummary(true);
              }}
              className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-2 text-sm font-semibold shadow-sm"
            >
              <span className="text-lg">⚙</span>
              <span>Bộ lọc chi tiết</span>
            </button>

            {/* GIÁ */}
            <button
              onClick={() => {
                closeAll();
                setShowPricePopup(true);
              }}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm flex items-center gap-1"
            >
              <span>Giá</span>
              <span className="text-xs">⌄</span>
            </button>

            {/* DIỆN TÍCH */}
            <button
              onClick={() => {
                closeAll();
                setShowAreaPopup(true);
              }}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm flex items-center gap-1"
            >
              <span>Diện tích</span>
              <span className="text-xs">⌄</span>
            </button>

            {/* PHÒNG NGỦ */}
            <button
              onClick={() => {
                closeAll();
                setShowRoomPopup(true);
              }}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm flex items-center gap-1"
            >
              <span>Phòng ngủ</span>
              <span className="text-xs">⌄</span>
            </button>

            {/* TÌNH TRẠNG */}
            <button
              onClick={() => {
                closeAll();
                setShowStatusPopup(true);
              }}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 text-sm flex items-center gap-1"
            >
              <span>Tình trạng</span>
              <span className="text-xs">⌄</span>
            </button>

            {/* XÓA BỘ LỌC */}
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-700 border border-gray-300 text-sm ml-auto"
            >
              Xóa bộ lọc
            </button>
          </div>

          {/* DÒNG “TÌM THẤY X CĂN HỘ” */}
          <p className="text-sm text-gray-600 mb-4">
            Tìm thấy{" "}
            <span className="font-semibold text-emerald-700">
              {apartments.length}
            </span>{" "}
            căn hộ phù hợp.
          </p>

          {/* SORT */}
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <p className="font-semibold text-gray-800 text-sm">Sắp xếp theo:</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSortPrice("desc")}
                className={`px-4 py-2 rounded-full border text-sm flex items-center gap-1 ${
                  sortPrice === "desc"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-500"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <span>⬇️</span> Giá Cao - Thấp
              </button>

              <button
                onClick={() => setSortPrice("asc")}
                className={`px-4 py-2 rounded-full border text-sm flex items-center gap-1 ${
                  sortPrice === "asc"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-500"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <span>⬆️</span> Giá Thấp - Cao
              </button>
            </div>
          </div>
        </div>

        {/* ================== CÁC POPUP (giữ nguyên logic, chỉ style đẹp hơn) ================== */}

        {/* GIÁ */}
        {showPricePopup && !showSummary && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[140px] px-4"
            onClick={closeAll}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl border border-emerald-50 w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-emerald-500">
                    Bộ lọc
                  </p>
                  <h3 className="font-semibold text-gray-900">
                    Khoảng giá mong muốn
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Chọn nhanh một khoảng giá để lọc các căn phù hợp ngân sách.
                  </p>
                </div>
                <button
                  onClick={closeAll}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                {priceOptions.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setTempPrice(p)}
                    className={`px-3 py-2 rounded-xl border text-left ${
                      tempPrice?.label === p.label
                        ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeAll}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
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
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
                >
                  Xem kết quả
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIỆN TÍCH */}
        {showAreaPopup && !showSummary && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[140px] px-4"
            onClick={closeAll}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl border border-emerald-50 w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-emerald-500">
                    Bộ lọc
                  </p>
                  <h3 className="font-semibold text-gray-900">
                    Khoảng diện tích
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Lựa chọn diện tích sàn phù hợp nhu cầu sử dụng.
                  </p>
                </div>
                <button
                  onClick={closeAll}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                {areaOptions.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => setTempArea(a)}
                    className={`px-3 py-2 rounded-xl border text-left ${
                      tempArea?.label === a.label
                        ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeAll}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
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
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
                >
                  Xem kết quả
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PHÒNG NGỦ */}
        {showRoomPopup && !showSummary && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[160px] px-4"
            onClick={closeAll}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl border border-emerald-50 w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-emerald-500">
                    Bộ lọc
                  </p>
                  <h3 className="font-semibold text-gray-900">Số phòng ngủ</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Chọn số phòng ngủ phù hợp với gia đình của bạn.
                  </p>
                </div>
                <button
                  onClick={closeAll}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTempRoom(n)}
                    className={`px-3 py-2 rounded-xl border text-left ${
                      tempRoom === n
                        ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {n} phòng ngủ
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeAll}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    const next = { ...filters, rooms: tempRoom };
                    setFilters(next);
                    closeAll();
                  }}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
                >
                  Xem kết quả
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TÌNH TRẠNG */}
        {showStatusPopup && !showSummary && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[160px] px-4"
            onClick={closeAll}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl border border-emerald-50 w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-emerald-500">
                    Bộ lọc
                  </p>
                  <h3 className="font-semibold text-gray-900">
                    Tình trạng căn hộ
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Lọc theo trạng thái hiện tại của căn hộ.
                  </p>
                </div>
                <button
                  onClick={closeAll}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-6 text-sm">
                {statusOptions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setTempStatus(s.value)}
                    className={`px-3 py-2 rounded-xl border text-left ${
                      tempStatus === s.value
                        ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeAll}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    const next = { ...filters, status: tempStatus };
                    setFilters(next);
                    closeAll();
                  }}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
                >
                  Xem kết quả
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BỘ LỌC CHI TIẾT (MODAL LỚN) */}
        {showSummary && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[120px] px-4"
            onClick={() => setShowSummary(false)}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative bg-white border rounded-2xl shadow-2xl p-6 max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-500">
                    Smart filter
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Bộ lọc chi tiết
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Kết hợp nhiều tiêu chí (giá, diện tích, phòng ngủ, tình
                    trạng) để tìm căn hộ phù hợp nhất.
                  </p>
                </div>
                <button
                  onClick={() => setShowSummary(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {/* GIÁ */}
                <div>
                  <h3 className="font-bold mb-3 text-gray-800 text-sm">Giá</h3>
                  {priceOptions.map((p, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setTempFilter((prev) => ({
                          ...prev,
                          minPrice: p.min,
                          maxPrice: p.max,
                        }))
                      }
                      className={`px-3 py-2 rounded-xl w-full text-left border text-sm mb-2 ${
                        tempFilter.minPrice === p.min
                          ? "bg-emerald-100 border-emerald-400"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* DIỆN TÍCH */}
                <div>
                  <h3 className="font-bold mb-3 text-gray-800 text-sm">
                    Diện tích
                  </h3>
                  {areaOptions.map((a, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setTempFilter((prev) => ({
                          ...prev,
                          minArea: a.min,
                          maxArea: a.max,
                        }))
                      }
                      className={`px-3 py-2 rounded-xl w-full text-left border text-sm mb-2 ${
                        tempFilter.minArea === a.min
                          ? "bg-emerald-100 border-emerald-400"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>

                {/* PHÒNG NGỦ */}
                <div>
                  <h3 className="font-bold mb-3 text-gray-800 text-sm">
                    Phòng ngủ
                  </h3>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() =>
                        setTempFilter((prev) => ({ ...prev, rooms: n }))
                      }
                      className={`px-3 py-2 rounded-xl w-full text-left border text-sm mb-2 ${
                        tempFilter.rooms === n
                          ? "bg-emerald-100 border-emerald-400"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {n} phòng
                    </button>
                  ))}
                </div>

                {/* TÌNH TRẠNG */}
                <div>
                  <h3 className="font-bold mb-3 text-gray-800 text-sm">
                    Tình trạng
                  </h3>
                  {statusOptions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setTempFilter((prev) => ({ ...prev, status: s.value }))
                      }
                      className={`px-3 py-2 rounded-xl w-full text-left border text-sm mb-2 ${
                        tempFilter.status === s.value
                          ? "bg-emerald-100 border-emerald-400"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowSummary(false)}
                  className="px-6 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm"
                >
                  Đóng
                </button>

                <button
                  onClick={() => {
                    setFilters(tempFilter);
                    handleSearch(tempFilter);
                    setShowSummary(false);
                  }}
                  className="px-8 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold"
                >
                  Xem kết quả
                </button>
              </div>
            </div>
          </div>
        )}

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
                    <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-emerald-700">
                      {apt.title}
                    </h4>

                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {apt.description}
                    </p>

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xl font-bold text-emerald-700">
                        {apt.price?.toLocaleString?.()} VNĐ
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          apt.status === "available"
                            ? "bg-emerald-100 text-emerald-700"
                            : apt.status === "rented"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {apt.status === "available"
                          ? "Còn trống"
                          : apt.status === "rented"
                          ? "Đang thuê"
                          : "Tạm khóa"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentListPage;
