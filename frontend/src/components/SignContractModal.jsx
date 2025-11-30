import React, { useState } from "react";

const API_BASE = "http://localhost:5000";

const SignContractModal = ({
  open,
  onClose,
  onConfirm,
  rental,
  defaultText = "",
  loading = false,
}) => {
  // Nếu modal đóng thì không render gì
  if (!open) return null;

  // Dùng key để reset state mỗi khi rental hoặc defaultText đổi
  const modalKey = `${rental?._id || "no-rental"}-${defaultText}`;

  return (
    <ModalInner
      key={modalKey}
      onClose={onClose}
      onConfirm={onConfirm}
      rental={rental}
      defaultText={defaultText}
      loading={loading}
    />
  );
};

const ModalInner = ({ onClose, onConfirm, rental, defaultText, loading }) => {
  const [text, setText] = useState(defaultText || "");
  const contractPdfUrl = `${API_BASE}/uploads/pdf/hopdong.pdf`;

  // Tính số tháng thuê (ước lượng 30 ngày/tháng)
  const monthCount =
    rental?.startDate && rental?.endDate
      ? Math.ceil(
          (new Date(rental.endDate) - new Date(rental.startDate)) /
            (30 * 24 * 60 * 60 * 1000)
        )
      : 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-emerald-50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-100">
              Ký hợp đồng thuê căn hộ
            </p>
            <h2 className="text-lg font-semibold mt-1">
              {rental?.apartment?.title || "Căn hộ"}
            </h2>
            {rental?.totalPrice && (
              <p className="text-sm text-emerald-100 mt-1">
                Tổng số tiền hợp đồng:{" "}
                <span className="font-semibold text-white">
                  {rental.totalPrice.toLocaleString()} đ
                </span>
              </p>
            )}
          </div>

          <button
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 pt-5 pb-4 overflow-y-auto flex-1 bg-slate-50/50">
          {/* Thông tin hợp đồng */}
          {rental && (
            <div className="bg-white p-4 rounded-2xl border border-emerald-50 mb-5 shadow-sm text-sm text-gray-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <p>
                  <span className="block text-xs text-gray-400 uppercase tracking-wide">
                    Căn hộ
                  </span>
                  <span className="font-semibold text-gray-900">
                    {rental.apartment?.title}
                  </span>
                </p>

                <p>
                  <span className="block text-xs text-gray-400 uppercase tracking-wide">
                    Số tháng thuê
                  </span>
                  <span className="font-semibold text-gray-900">
                    {monthCount} tháng
                  </span>
                </p>

                <p>
                  <span className="block text-xs text-gray-400 uppercase tracking-wide">
                    Ngày bắt đầu
                  </span>
                  <span className="font-medium">
                    {rental.startDate
                      ? new Date(rental.startDate).toLocaleDateString("vi-VN")
                      : "..."}
                  </span>
                </p>

                <p>
                  <span className="block text-xs text-gray-400 uppercase tracking-wide">
                    Ngày kết thúc
                  </span>
                  <span className="font-medium">
                    {rental.endDate
                      ? new Date(rental.endDate).toLocaleDateString("vi-VN")
                      : "..."}
                  </span>
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-dashed border-gray-200">
                <p className="text-xs text-gray-500 mb-1">
                  Vui lòng đọc kỹ điều khoản trước khi ký:
                </p>
                <button
                  onClick={() => window.open(contractPdfUrl, "_blank")}
                  className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <span className="text-base">📄</span>
                  <span>Xem hợp đồng (PDF)</span>
                </button>
              </div>
            </div>
          )}

          {/* Khu vực nhập chữ ký */}
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Chữ ký xác nhận{" "}
              <span className="text-red-500">*</span>{" "}
              <span className="font-normal text-xs text-gray-500">
                (Nhập họ tên đầy đủ)
              </span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              className="w-full border border-gray-300 p-3 rounded-xl h-24 text-sm
                         focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600
                         outline-none resize-none bg-white"
              placeholder="Ví dụ: NGUYEN VAN A"
            />
            <p className="text-[11px] text-gray-500 mt-2 italic">
              * Bằng việc nhấn{" "}
              <span className="font-semibold">“Ký &amp; Gửi”</span>, bạn xác
              nhận đã đọc và đồng ý với toàn bộ điều khoản trong hợp đồng PDF.
            </p>
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="px-6 py-4 bg-white border-top border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm
                       hover:bg-gray-200 transition disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            onClick={() => onConfirm(text)}
            disabled={loading || !text.trim()}
            className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold
                       hover:bg-emerald-700 transition shadow-md shadow-emerald-200
                       disabled:bg-gray-400 disabled:shadow-none flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Đang gửi...
              </>
            ) : (
              "Ký & Gửi"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignContractModal;
