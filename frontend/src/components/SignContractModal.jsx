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
  if (open) {
    setTimeout(() => setText(defaultText), 0);
  }
}, [open, defaultText]);


  if (!open) return null;

  // Link PDF
  const contractPdfUrl = "http://localhost:5000/uploads/pdf/hopdong.pdf";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white shadow-2xl p-6 rounded-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto animate-fadeIn">

        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Ký hợp đồng</h2>

        {/* Contract info */}
        {rental && (
          <div className="bg-gray-50 p-4 rounded-xl border mb-5 shadow-sm">
            <p className="text-sm mb-1">
              <b>Căn hộ:</b> {rental.apartment?.title}
            </p>
            <p className="text-sm mb-1">
              <b>Thời gian:</b>{" "}
              {new Date(rental.startDate).toLocaleDateString()} –{" "}
              {new Date(rental.endDate).toLocaleDateString()}
            </p>
            <p className="text-sm mb-1">
              <b>Số tháng thuê:</b>{" "}
              {Math.ceil(
                (new Date(rental.endDate) - new Date(rental.startDate)) /
                  (30 * 24 * 60 * 60 * 1000)
              )}
            </p>
            <p className="text-sm mb-2">
              <b>Tổng tiền:</b> {rental.totalPrice.toLocaleString()} đ
            </p>

            <button
              onClick={() => window.open(contractPdfUrl, "_blank")}
              className="text-blue-600 underline text-sm hover:text-blue-800"
            >
              Xem điều khoản & điều kiện (PDF)
            </button>
          </div>
        )}

        {/* Signature input */}
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Ký tên (nhập họ tên đầy đủ):
        </label>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-lg h-24 mb-4 focus:ring-2 focus:ring-green-500 outline-none"
          placeholder="Ví dụ: Nguyễn Văn A"
        />

        {/* Footer buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Hủy
          </button>

          <button
            onClick={() => onConfirm(text)}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
          >
            Gửi hợp đồng
          </button>
        </div>

      </div>
    </div>
  );
};

export default SignContractModal;
