import React, { useState, useEffect } from "react";

// Định nghĩa API_BASE để dùng cho link PDF (giống bên MyRentals)
const API_BASE = "http://localhost:5000";

const SignContractModal = ({
  open,
  onClose,
  onConfirm,
  rental,
  defaultText = "",
  loading = false, // Nhận thêm prop loading từ cha
}) => {
  const [text, setText] = useState(defaultText);

  // Reset text mỗi khi mở modal hoặc đổi rental
  useEffect(() => {
    setText(defaultText || "");
  }, [defaultText, open]);

  if (!open) return null;

  // Link file PDF điều khoản (Dùng API_BASE để linh hoạt)
  const contractPdfUrl = `${API_BASE}/uploads/pdf/hopdong.pdf`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white p-6 rounded-xl max-w-md w-full relative max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Nút đóng */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          onClick={onClose}
          disabled={loading}
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-800">Ký hợp đồng thuê</h2>

        {/* Thông tin chi tiết hợp đồng */}
        {rental && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4 text-sm text-gray-700 space-y-2">
            <p>
              <span className="font-semibold text-gray-900">Căn hộ:</span>{" "}
              {rental.apartment?.title || "Không có tiêu đề"}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Thời gian:</span>{" "}
              {rental.startDate ? new Date(rental.startDate).toLocaleDateString("vi-VN") : "..."} -{" "}
              {rental.endDate ? new Date(rental.endDate).toLocaleDateString("vi-VN") : "..."}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Thời hạn:</span>{" "}
              {rental.startDate && rental.endDate 
                ? Math.ceil((new Date(rental.endDate) - new Date(rental.startDate)) / (30 * 24 * 60 * 60 * 1000))
                : 0} tháng
            </p>
            <p>
              <span className="font-semibold text-gray-900">Tổng tiền:</span>{" "}
              <span className="text-red-600 font-bold">{rental.totalPrice?.toLocaleString()} đ</span>
            </p>
            
            <div className="pt-2 border-t border-gray-200 mt-2">
              <span className="text-gray-500 text-xs">Vui lòng đọc kỹ điều khoản trước khi ký:</span>
              <br/>
              <button
                onClick={() => window.open(contractPdfUrl, "_blank")}
                className="text-blue-600 hover:text-blue-800 underline text-sm font-medium flex items-center gap-1 mt-1"
              >
                Xem chi tiết hợp đồng (PDF)
              </button>
            </div>
          </div>
        )}

        {/* Nhập tên để ký */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Chữ ký xác nhận <span className="text-red-500">*</span> (Nhập họ tên đầy đủ):
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            className="w-full border border-gray-300 p-3 rounded-lg h-24 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
            placeholder="Ví dụ: NGUYEN VAN A"
          />
          <p className="text-xs text-gray-500 mt-1 italic">
            * Bằng việc nhấn "Ký & Gửi", bạn đồng ý với các điều khoản trong hợp đồng.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(text)}
            disabled={loading || !text.trim()} // Disable khi đang tải hoặc chưa nhập chữ
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-200 disabled:bg-gray-400 disabled:shadow-none flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang gửi...
              </>
            ) : (
              " Ký & Gửi"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignContractModal;