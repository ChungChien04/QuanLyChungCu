import React, { useState, useEffect } from "react";

const SignContractModal = ({
  open,
  onClose,
  onConfirm,
  rental,
  defaultText = "",
}) => {
  const [text, setText] = useState(defaultText);

  useEffect(() => {
    setText(defaultText);
  }, [defaultText, open]);

  if (!open) return null;

  // Link file PDF điều khoản
  const contractPdfUrl = "http://localhost:5000/uploads/pdf/hopdong.pdf";
  // Nếu muốn host đầy đủ URL
  // const contractPdfUrl = `${window.location.origin}/uploads/contract-terms.pdf`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-md w-full relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-2 right-2 text-gray-500"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-3">Ký hợp đồng</h2>

        {/* Thông tin chi tiết hợp đồng */}
        {rental && (
          <div className="text-sm text-gray-700 mb-4 space-y-1">
            <p>
              <span className="font-semibold">Căn hộ:</span>{" "}
              {rental.apartment?.title}
            </p>
            <p>
              <span className="font-semibold">Thời gian:</span>{" "}
              {new Date(rental.startDate).toLocaleDateString()} -{" "}
              {new Date(rental.endDate).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Số tháng thuê:</span>{" "}
              {Math.ceil(
                (new Date(rental.endDate) - new Date(rental.startDate)) /
                  (30 * 24 * 60 * 60 * 1000)
              )}
            </p>
            <p>
              <span className="font-semibold">Tổng tiền:</span>{" "}
              {rental.totalPrice.toLocaleString()} đ
            </p>
            {/* Nút mở PDF */}
            <button
              onClick={() => window.open(contractPdfUrl, "_blank")}
              className="text-blue-600 underline text-sm"
            >
              Xem điều khoản & điều kiện
            </button>
          </div>
        )}

        {/* Nhập tên để ký */}
        <label className="block text-sm font-medium mb-1">Ký tên:</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border p-2 rounded h-24 mb-4"
          placeholder="Nhập họ tên để ký"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Hủy
          </button>
          <button
            onClick={() => onConfirm(text)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Gửi hợp đồng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignContractModal;
