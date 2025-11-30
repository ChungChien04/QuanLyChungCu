import React from "react";

const AdminInvoiceDetailModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-emerald-50">
        {/* Header */}
        <div className="bg-emerald-600 text-white px-5 py-4 flex justify-between items-center">
          <h2 className="text-base md:text-lg font-semibold uppercase tracking-wide">
            Chi tiết hóa đơn
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-700/70 hover:bg-emerald-800 flex items-center justify-center text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-gray-800 text-sm">
          {/* Thông tin chung */}
          <div className="flex flex-col md:flex-row md:justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Khách hàng
              </p>
              <p className="font-semibold text-base mt-1">
                {invoice.user?.name}
              </p>
              <p className="text-xs text-gray-600">{invoice.user?.email}</p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Căn hộ
              </p>
              <p className="font-semibold text-base mt-1 text-emerald-700">
                {invoice.apartment?.title}
              </p>
              <p className="font-mono font-semibold bg-gray-100 px-2 py-1 rounded-lg inline-block mt-2 text-xs">
                Tháng {invoice.month}/{invoice.year}
              </p>
            </div>
          </div>

          {/* Bảng chi tiết tiền */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-emerald-50 text-gray-800 font-semibold">
                <tr>
                  <th className="p-3">Khoản phí</th>
                  <th className="p-3 text-center">Chi tiết (Chỉ số)</th>
                  <th className="p-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-3 align-top">Tiền điện</td>
                  <td className="p-3 text-center align-top">
                    {invoice.electricNewIndex} (mới) -{" "}
                    {invoice.electricOldIndex} (cũ) ={" "}
                    <span className="font-semibold text-gray-700">
                      {invoice.electricUsage} kW
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      × {invoice.electricPrice?.toLocaleString()} đ/kW
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium text-gray-800 align-top">
                    {invoice.electricTotal?.toLocaleString()} đ
                  </td>
                </tr>

                <tr>
                  <td className="p-3">Phí sinh hoạt chung</td>
                  <td className="p-3 text-center">—</td>
                  <td className="p-3 text-right font-medium text-gray-800">
                    {invoice.commonFee?.toLocaleString()} đ
                  </td>
                </tr>

                <tr>
                  <td className="p-3">Phí vệ sinh</td>
                  <td className="p-3 text-center">—</td>
                  <td className="p-3 text-right font-medium text-gray-800">
                    {invoice.cleaningFee?.toLocaleString()} đ
                  </td>
                </tr>
              </tbody>

              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan={2}
                    className="p-3 font-semibold text-emerald-700 text-right uppercase text-xs md:text-sm"
                  >
                    Tổng thanh toán
                  </td>
                  <td className="p-3 text-right font-bold text-gray-800 text-lg">
                    {invoice.totalAmount?.toLocaleString()} đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Trạng thái */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs md:text-sm">
                Trạng thái:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold uppercase tracking-wide border ${
                  invoice.status === "paid"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {invoice.status === "paid"
                  ? "Đã thanh toán"
                  : "Chưa thanh toán"}
              </span>
            </div>

            {invoice.status === "paid" && invoice.paymentDate && (
              <div className="text-[11px] md:text-xs text-gray-500">
                Ngày đóng:{" "}
                {new Date(invoice.paymentDate).toLocaleDateString("vi-VN")}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-100 text-sm font-medium"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceDetailModal;
