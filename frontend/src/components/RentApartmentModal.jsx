import React, { useState, useMemo } from "react";

/** Format YYYY-MM-DD → dd/MM/yyyy */
const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN");
};

const RentApartmentModal = ({ open, onClose, onConfirm, apartment }) => {
  if (!open || !apartment) return null;

  return (
    <ModalContent
      onClose={onClose}
      onConfirm={onConfirm}
      apartment={apartment}
    />
  );
};

const ModalContent = ({ onClose, onConfirm, apartment }) => {
  // ngày hôm nay (khóa 1 lần)
  const todayISO = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const [months, setMonths] = useState(1);
  const [startDate, setStartDate] = useState(todayISO);

  const endDate = useMemo(() => {
    const d = new Date(startDate || todayISO);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  }, [startDate, months, todayISO]);

  const price = apartment.price || 0;
  const total = price * months;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn border border-emerald-50">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-white/10 items-center justify-center text-xl">
              🏡
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-100">
                Đăng ký thuê căn hộ
              </p>
              <h2 className="text-lg font-semibold leading-snug">
                {apartment.title || "Căn hộ"}
              </h2>
              <p className="text-sm text-emerald-100 mt-1">
                Giá thuê:{" "}
                <span className="font-semibold text-white">
                  {price.toLocaleString()} đ / tháng
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 pt-6 pb-5">
          {/* START DATE */}
          <label className="block mb-5">
            <span className="text-gray-700 font-semibold text-sm">
              Ngày nhận nhà
            </span>
            <input
              type="date"
              value={startDate}
              min={todayISO}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2 w-full h-11 px-3 rounded-xl border border-gray-300 bg-white shadow-sm
                         text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 outline-none"
            />
          </label>

          {/* MONTHS */}
          <label className="block mb-6">
            <span className="text-gray-700 font-semibold text-sm">
              Số tháng thuê
            </span>
            <div className="flex items-center mt-2 bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200">
              <button
                type="button"
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
                onChange={(e) =>
                  setMonths(Math.max(1, Math.min(24, Number(e.target.value) || 1)))
                }
                className="flex-1 h-11 px-2 text-center bg-white font-semibold text-lg
                           border-x border-gray-300 outline-none"
              />

              <button
                type="button"
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 font-bold text-lg"
                onClick={() => setMonths((m) => Math.min(24, m + 1))}
              >
                +
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Tối đa 24 tháng cho mỗi lần đăng ký.
            </p>
          </label>

          {/* SUMMARY */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-emerald-50 shadow-sm">
            <h3 className="font-bold text-gray-800 text-base mb-3">
              Tạm tính chi phí
            </h3>

            <p className="text-gray-700 text-sm">
              <span className="font-medium">
                {price.toLocaleString()} đ / tháng
              </span>{" "}
              × <span className="font-medium">{months} tháng</span>
            </p>

            <p className="text-emerald-700 font-bold text-2xl mt-2">
              {total.toLocaleString()} đ
            </p>

            <div className="mt-4 text-gray-600 text-xs sm:text-sm space-y-1">
              <p>
                <b>Ngày nhận nhà:</b> {formatDate(startDate)}
              </p>
              <p>
                <b>Ngày kết thúc dự kiến:</b> {formatDate(endDate)}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="px-6 pb-5 pt-3 flex justify-end gap-3 bg-white border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm
                       hover:bg-gray-200 transition shadow-sm"
          >
            Hủy
          </button>

          <button
            onClick={() => onConfirm(months, startDate, endDate)}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold
                       hover:bg-emerald-700 shadow-md transition"
          >
            Xác nhận thuê
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentApartmentModal;
