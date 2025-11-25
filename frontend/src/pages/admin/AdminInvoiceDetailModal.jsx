import React from "react";

const AdminInvoiceDetailModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-green-700 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold uppercase">Chi tiết hóa đơn</h2>
          <button onClick={onClose} className="text-2xl hover:text-gray-300">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-gray-800">
          
          {/* Thông tin chung */}
          <div className="flex justify-between border-b pb-4">
            <div>
              <p className="text-sm text-gray-500">Khách hàng</p>
              <p className="font-bold text-lg">{invoice.user?.name}</p>
              <p className="text-sm">{invoice.user?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Căn hộ</p>
              <p className="font-bold text-lg text-green-700">{invoice.apartment?.title}</p>
              <p className="font-mono font-bold bg-gray-100 px-2 py-1 rounded inline-block mt-1">
                Tháng {invoice.month}/{invoice.year}
              </p>
            </div>
          </div>

          {/* Bảng chi tiết tiền */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 font-bold">
                <tr>
                  <th className="p-3">Khoản phí</th>
                  <th className="p-3 text-center">Chi tiết (Chỉ số)</th>
                  <th className="p-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3">Tiền điện</td>
                  <td className="p-3 text-center">
                    {invoice.electricNewIndex} (Mới) - {invoice.electricOldIndex} (Cũ) = 
                    <span className="font-bold text-gray-600"> {invoice.electricUsage} kW</span>
                    <br/>
                    <span className="text-xs text-gray-500">x {invoice.electricPrice?.toLocaleString()} đ/kW</span>
                  </td>
                  <td className="p-3 text-right font-medium">{invoice.electricTotal?.toLocaleString()} đ</td>
                </tr>
                <tr>
                  <td className="p-3">Phí sinh hoạt chung</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-right font-medium">{invoice.commonFee?.toLocaleString()} đ</td>
                </tr>
                <tr>
                  <td className="p-3">Phí vệ sinh</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-right font-medium">{invoice.cleaningFee?.toLocaleString()} đ</td>
                </tr>
              </tbody>
              <tfoot className="bg-gray-100 ">
                <tr>
                  <td colSpan="2" className="p-3 font-bold text-green-800 text-right uppercase">Tổng thanh toán</td>
                  <td className="p-3 text-right font-bold text-Gray-600 text-lg">
                    {invoice.totalAmount?.toLocaleString()} đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Trạng thái */}
          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-gray-500 text-sm mr-2">Trạng thái:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {invoice.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
            {invoice.status === 'paid' && (
              <div className="text-sm text-gray-500">
                Ngày đóng: {new Date(invoice.paymentDate).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-4 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium">
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceDetailModal;