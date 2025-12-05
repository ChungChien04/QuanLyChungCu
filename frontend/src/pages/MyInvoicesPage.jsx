import React, { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import InvoiceListModal from "../components/InvoiceListModal";

import {
  HomeModernIcon,
  DocumentTextIcon,
  MapPinIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

const API_BASE = "http://localhost:5000";

// Helper format ngày
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "--/--/----";

const MyInvoicesPage = () => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState(null);

  // Chỉ lấy hợp đồng có status = "rented"
  useEffect(() => {
    const fetchActiveRentals = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/rentals/my-rentals`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const active = (data || []).filter((r) => r.status === "rented");
        setRentals(active);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchActiveRentals();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500 text-sm animate-pulse">
          Đang tải dữ liệu...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* BACKGROUND EFFECT */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.15),transparent_65%)]" />

      {/* HEADER */}
      <header className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
  <div className="max-w-6xl mx-auto px-6 pt-[96px] pb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    
    {/* LEFT SIDE */}
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
          <HomeModernIcon className="w-6 h-6" />
        </div>
        <span className="text-[11px] uppercase tracking-[0.22em] text-emerald-600 font-semibold">
          Tài khoản của bạn
        </span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-1">
        Hóa đơn điện & dịch vụ
      </h1>
      <p className="text-emerald-900/80 max-w-2xl text-sm md:text-base">
        Theo dõi hóa đơn điện, nước, phí dịch vụ và thanh toán nhanh cho từng căn hộ bạn đang thuê.
      </p>
    </div>

    {/* RIGHT SIDE BADGE */}
    {rentals.length > 0 && (
      <div className="mt-2 md:mt-0">
        <div className="inline-flex flex-col items-end bg-white border border-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl shadow-sm">
          <span className="text-[11px] uppercase tracking-wide text-emerald-600">
            Tổng số căn đang thuê
          </span>
          <span className="text-lg font-bold">
            {rentals.length} căn hộ
          </span>
        </div>
      </div>
    )}

  </div>
</header>


      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-6 pt-6">
        {/* Không có căn đang thuê */}
        {rentals.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm p-10 rounded-2xl border border-dashed border-emerald-300 text-center shadow-sm mt-6">
            <p className="text-slate-800 font-semibold mb-1">
              Hiện không có căn hộ nào đang thuê
            </p>
            <p className="text-slate-500 text-sm">
              Khi hợp đồng của bạn chuyển sang trạng thái{" "}
              <span className="font-semibold text-emerald-700">Đang thuê</span>,
              hóa đơn sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {rentals.map((r) => (
              <div
                key={r._id}
                className="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-6 overflow-hidden"
              >
                {/* Badge trạng thái */}
                <div className="absolute top-0 right-0 bg-emerald-600 text-white px-4 py-1 text-[11px] rounded-bl-2xl uppercase tracking-wide shadow-sm">
                  Đang thuê
                </div>

                {/* Tên căn hộ */}
                <h2 className="text-xl font-semibold text-slate-900 mb-1 flex items-center gap-2 pr-14">
                  <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
                  {r.apartment?.title || "Căn hộ"}
                </h2>

                {/* Địa chỉ */}
                <p className="text-slate-500 text-sm flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4 text-slate-400" />
                  {r.apartment?.location?.address || "Không có địa chỉ"}
                </p>

                {/* Thông tin hợp đồng */}
                <div className="mt-4 pt-4 border-t border-slate-100 text-sm space-y-2">
                  <p>
                    Mã hợp đồng:{" "}
                    <span className="font-semibold text-slate-900">
                      #{r._id.slice(-6)}
                    </span>
                  </p>

                  <p className="flex items-center gap-2">
                    <CalendarDaysIcon className="w-5 h-5 text-slate-400" />
                    Thời gian ở:{" "}
                    <span className="font-medium text-slate-800">
                      {formatDate(r.startDate)} – {formatDate(r.endDate)}
                    </span>
                  </p>
                </div>

                {/* Action */}
                <div className="mt-5 flex justify-between items-center border-t pt-4 border-slate-100">
                  <p className="text-xs text-slate-500 max-w-[60%]">
                    Xem hóa đơn điện, nước và phí dịch vụ của căn hộ này.
                  </p>

                  <button
                    onClick={() => setSelectedRental(r)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium shadow hover:bg-emerald-700 transition flex items-center gap-2"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    Xem hóa đơn
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal danh sách hóa đơn */}
      <InvoiceListModal
        isOpen={!!selectedRental}
        onClose={() => setSelectedRental(null)}
        rentalId={selectedRental?._id}
        apartmentTitle={selectedRental?.apartment?.title}
      />
    </div>
  );
};

export default MyInvoicesPage;
