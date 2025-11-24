import React, { useState, useMemo } from "react";

/** Format YYYY-MM-DD → dd/MM/yyyy */
const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN");
};

const RentApartmentModal = ({ open, onClose, onConfirm, apartment }) => {
  if (!open) return null;

  return (
    <ModalContent
      onClose={onClose}
      onConfirm={onConfirm}
      apartment={apartment}
    />
  );
};

const ModalContent = ({ onClose, onConfirm, apartment }) => {
  /** Ngày hôm nay (chỉ tính 1 lần khi component mounted) */
  const todayISO = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const [months, setMonths] = useState(1);
  const [startDate, setStartDate] = useState(todayISO);

  const endDate = useMemo(() => {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  }, [startDate, months]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg animate-fadeIn border border-gray-200">

        <h2 className="text-3xl font-bold text-green-700 mb-6 tracking-wide">
          Thuê căn hộ
        </h2>

        {/* START DATE */}
        <label className="block mb-5">
          <span className="text-gray-700 font-semibold text-sm">Ngày nhận nhà</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-2 w-full p-3 rounded-xl border border-gray-300 shadow-sm
                       focus:ring-2 focus:ring-green-500 focus:border-green-600"
          />
        </label>

        {/* MONTHS */}
        <label className="block mb-6">
          <span className="text-gray-700 font-semibold text-sm">Số tháng thuê</span>
          <div className="flex items-center mt-2 bg-gray-100 rounded-xl overflow-hidden shadow-inner">

            <button
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 font-bold text-lg"
              onClick={() => setMonths((m) => Math.max(1, m - 1))}
            >
              −
            </button>

            <input
              type="number"
              min={1}
              max={24}
              value={months}
              onChange={(e) => setMonths(Math.max(1, Number(e.target.value)))}
              className="flex-1 p-2 text-center bg-white font-semibold text-lg
                         border-x border-gray-300 outline-none"
            />

            <button
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 font-bold text-lg"
              onClick={() => setMonths((m) => Math.min(24, m + 1))}
            >
              +
            </button>

          </div>
        </label>

        {/* SUMMARY */}
        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-[#0A2A43] text-lg mb-3">Tạm tính</h3>

          <p className="text-gray-700">
            {apartment.price.toLocaleString()} × {months} tháng
          </p>

          <p className="text-green-700 font-bold text-2xl mt-2">
            {(apartment.price * months).toLocaleString()} đ
          </p>

          <div className="mt-4 text-gray-600 text-sm space-y-1">
            <p><b>Ngày nhận nhà:</b> {formatDate(startDate)}</p>
            <p><b>Ngày kết thúc:</b> {formatDate(endDate)}</p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700
                       hover:bg-gray-200 transition shadow-sm"
          >
            Hủy
          </button>

          <button
            onClick={() => onConfirm(months, startDate, endDate)}
            className="px-6 py-2.5 rounded-xl bg-green-700 text-white font-semibold
                       hover:bg-green-800 shadow-md transition"
          >
            Xác nhận thuê
          </button>
        </div>

      </div>
    </div>
  );
};

export default RentApartmentModal;
