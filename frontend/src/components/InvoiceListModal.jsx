import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const API_BASE = "http://localhost:5000";

const InvoiceListModal = ({ isOpen, onClose, rentalId, apartmentTitle }) => {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load danh sách hóa đơn khi mở modal
  useEffect(() => {
    if (isOpen && rentalId) {
      setLoading(true);
      axios.get(`${API_BASE}/api/invoices/my-invoices/${rentalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setInvoices(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
    }
  }, [isOpen, rentalId, token]);

  // Xử lý thanh toán VNPay
  const handlePay = async (invoiceId) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/payments/create_invoice_payment_url/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.url) window.location.href = data.url;
    } catch (err) { alert(err.response?.data?.message || "Lỗi thanh toán"); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            Hóa đơn: <span className="text-green-700">{apartmentTitle}</span>
          </h3>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-red-500">&times;</button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? <p className="text-center text-gray-500">Đang tải...</p> : (
            invoices.length === 0 ? <p className="text-center text-gray-500">Chưa có hóa đơn nào.</p> :
            
            <div className="space-y-4">
              {invoices.map(inv => (
                <div key={inv._id} className="border rounded-xl p-4 shadow-sm bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                  {/* Thông tin */}
                  <div className="flex-1 w-full">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-lg text-gray-800">Tháng {inv.month}/{inv.year}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {inv.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
                      <p>Điện: <b className="text-gray-800">{inv.electricUsage} kW</b> ({inv.electricOldIndex} → {inv.electricNewIndex})</p>
                      <p>Tiền điện: {inv.electricTotal.toLocaleString()} đ</p>
                      <p>Phí chung: {inv.commonFee.toLocaleString()} đ</p>
                      <p>Vệ sinh: {inv.cleaningFee.toLocaleString()} đ</p>
                    </div>
                  </div>

                  {/* Tổng tiền & Nút */}
                  <div className="text-right min-w-[150px] w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 flex flex-row md:flex-col justify-between items-center md:items-end">
                    <p className="text-gray-500 text-xs mb-1">Tổng thanh toán</p>
                    <p className="text-xl font-bold text-red-600 mb-2">{inv.totalAmount.toLocaleString()} đ</p>
                    
                    {inv.status === 'unpaid' && (
                      <button 
                        onClick={() => handlePay(inv._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 shadow transition w-full md:w-auto"
                      >
                        Thanh toán ngay
                      </button>
                    )}
                    {inv.status === 'paid' && (
                      <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                        Hoàn tất {new Date(inv.paymentDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceListModal;