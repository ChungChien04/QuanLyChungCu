import React from "react";

const PaymentQrModal = ({ open, src, onClose, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-sm w-full relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>✕</button>
        <h3 className="text-lg font-semibold mb-4 text-center">Mã QR thanh toán tiền cọc</h3>
        <div className="flex justify-center mb-4">
          <img src={src} alt="QR code" className="w-48 h-48 object-contain" />
        </div>
        <div className="flex justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Đóng</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Đã thanh toán</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentQrModal;
