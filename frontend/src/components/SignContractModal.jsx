import React, { useState, useEffect } from "react";

// API Base để mở PDF
const API_BASE = "http://localhost:5000";

const SignContractModal = ({
  open,
  onClose,
  onConfirm,
  rental,
  defaultText = "",
  loading = false,
}) => {
  const [text, setText] = useState(defaultText);

  // Reset text mỗi khi mở modal hoặc defaultText thay đổi
  useEffect(() => {
    if (open) {
      setText(defaultText || "");
    }
  }, [open, defaultText]);

  if (!open) return null;

  const contractPdfUrl = `${API_BASE}/uploads/pdf/hopdong.pdf`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white shadow-2xl p-6 rounded-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto">

        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
          onClick={onClose}
          disabled={loading}
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Ký hợp đồng</h2>

        {/* Contract Info */}
        {rental && (
          <div className="bg-gray-50 p-4 rounded-xl border mb-5 shadow-sm text-sm text-gray-700 space-y-2">
            <p>
              <b className="text-gray-900">Căn hộ:</b> {rental.apartment?.title}
            </p>
            <p>
              <b className="text-gray-900">Thời gian:</b>{" "}
              {rental.startDate
                ? new Date(rental.startDate).toLocaleDateString("vi-VN")
                : "..."}{" "}
              –{" "}
              {rental.endDate
                ? new Date(rental.endDate).toLocaleDateString("vi-VN")
                : "..."}
            </p>
            <p>
              <b className="text-gray-900">Số tháng thuê:</b>{" "}
              {rental.startDate && rental.endDate
                ? Math.ceil(
                    (new Date(rental.endDate) - new Date(rental.startDate)) /
                      (30 * 24 * 60 * 60 * 1000)
                  )
                : 0}{" "}
              tháng
            </p>
            <p>
              <b className="text-gray-900">Tổng tiền:</b>{" "}
              <span className="text-red-600 font-semibold">
                {rental.totalPrice?.toLocaleString()} đ
              </span>
            </p>

            {/* View PDF */}
            <div className="pt-2 border-t border-gray-200">
              <span className="text-gray-500 text-xs">
                Vui lòng đọc kỹ điều khoản trước khi ký:
              </span>
              <br />
              <button
                onClick={() => window.open(contractPdfUrl, "_blank")}
                className="text-blue-600 hover:text-blue-800 underline text-sm font-medium flex items-center gap-1 mt-1"
              >
                Xem hợp đồng (PDF)
              </button>
            </div>
          </div>
        )}

        {/* Signature area */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Chữ ký xác nhận <span className="text-red-500">*</span> (Nhập họ tên đầy đủ):
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            className="w-full border border-gray-300 p-3 rounded-lg h-24 focus:ring-2 focus:ring-green-500 outline-none resize-none"
            placeholder="Ví dụ: NGUYEN VAN A"
          />
          <p className="text-xs text-gray-500 mt-1 italic">
            * Bằng việc nhấn "Ký & Gửi", bạn đồng ý với các điều khoản trong PDF hợp đồng.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            onClick={() => onConfirm(text)}
            disabled={loading || !text.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-200 disabled:bg-gray-400 disabled:shadow-none flex items-center gap-2"
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
