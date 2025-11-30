import React from "react";

const PaymentQrModal = ({ open, src, onClose, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-emerald-50 overflow-hidden animate-fadeIn">
        {/* HEADER */}
        <div className="px-5 py-3 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-100">
              Thanh toán tiền cọc
            </p>
            <h3 className="text-sm font-semibold">
              Quét mã QR để thanh toán
            </h3>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-lg"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 pt-5 pb-4">
          <p className="text-xs text-gray-600 text-center mb-3">
            Sử dụng app ngân hàng hoặc ví điện tử để quét mã.
          </p>

          <div className="flex justify-center mb-4">
            <div className="p-2 bg-white rounded-2xl shadow-inner border border-emerald-50">
              <img
                src={src}
                alt="QR code"
                className="w-52 h-52 object-contain rounded-xl"
              />
            </div>
          </div>

          <p className="text-[11px] text-gray-500 text-center">
            Sau khi thanh toán xong, bấm nút{" "}
            <span className="font-semibold text-emerald-700">
              “Đã thanh toán”
            </span>{" "}
            để hệ thống xác nhận.
          </p>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="px-5 py-3 bg-slate-50 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Đóng
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex items-center gap-1"
          >
            ✅ Đã thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentQrModal;
