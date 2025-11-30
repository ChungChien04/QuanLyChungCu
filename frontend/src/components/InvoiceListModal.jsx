import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const API_BASE = "http://localhost:5000";

const InvoiceListModal = ({ isOpen, onClose, rentalId, apartmentTitle }) => {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load danh sách hóa đơn khi mở modal
  useEffect(() => {
    if (!isOpen || !rentalId || !token) return;

    let cancelled = false;

    axios
      .get(`${API_BASE}/api/invoices/my-invoices/${rentalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (cancelled) return;
        setInvoices(res.data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, rentalId, token]);

  // Xử lý thanh toán VNPay
  const handlePay = async (invoiceId) => {
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/payments/create_invoice_payment_url/${invoiceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.url) {
        window.location.assign(data.url);
      } else {
        alert("Không lấy được link thanh toán.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi thanh toán");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-emerald-50">
        {/* HEADER */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white flex justify-between items-center">
          <div className="flex items-start gap-3">
            <div className="mt-1 hidden sm:flex w-9 h-9 rounded-2xl bg-white/10 items-center justify-center text-xl">
              💡
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-100">
                Hóa đơn điện & dịch vụ
              </p>
              <h3 className="text-base md:text-lg font-semibold line-clamp-2">
                {apartmentTitle || "Căn hộ đang thuê"}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 md:p-5 overflow-y-auto flex-1 bg-slate-50/70">
          {loading ? (
            <p className="text-center text-gray-500 text-sm py-8 animate-pulse">
              Đang tải danh sách hóa đơn...
            </p>
          ) : invoices.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm bg-white rounded-2xl border border-dashed border-emerald-100">
              Chưa có hóa đơn nào cho căn hộ này.
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((inv) => {
                const isPaid = inv.status === "paid";

                return (
                  <div
                    key={inv._id}
                    className="group border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm bg-white flex flex-col md:flex-row justify-between items-stretch gap-4 hover:shadow-md hover:border-emerald-200 transition"
                  >
                    {/* THÔNG TIN BÊN TRÁI */}
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-center mb-3 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
                            {inv.month}
                          </span>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Kỳ thanh toán
                            </p>
                            <span className="font-semibold text-gray-900 text-sm md:text-base">
                              Tháng {inv.month}/{inv.year}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs md:text-sm text-gray-600 mt-1">
                        <p>
                          Điện:{" "}
                          <b className="text-gray-900">
                            {inv.electricUsage} kW
                          </b>{" "}
                          ({inv.electricOldIndex} → {inv.electricNewIndex})
                        </p>
                        <p>
                          Tiền điện:{" "}
                          <span className="font-medium text-gray-900">
                            {inv.electricTotal?.toLocaleString()} đ
                          </span>
                        </p>
                        <p>
                          Phí chung:{" "}
                          <span className="font-medium text-gray-900">
                            {inv.commonFee?.toLocaleString()} đ
                          </span>
                        </p>
                        <p>
                          Vệ sinh:{" "}
                          <span className="font-medium text-gray-900">
                            {inv.cleaningFee?.toLocaleString()} đ
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* TỔNG TIỀN & NÚT */}
                    <div className="md:w-60 w-full md:border-l border-t md:border-t-0 border-gray-100 md:pl-5 pt-3 md:pt-0 flex flex-row md:flex-col justify-between items-center md:items-end gap-2">
                      <div className="text-right w-full">
                        <p className="text-[11px] text-gray-500">
                          Tổng thanh toán
                        </p>
                        <p className="text-lg md:text-xl font-bold text-red-600">
                          {inv.totalAmount?.toLocaleString()} đ
                        </p>
                      </div>

                      {isPaid ? (
                        <span className="text-emerald-700 text-xs md:text-sm font-medium flex items-center gap-1">
                          ✅ Hoàn tất{" "}
                          {inv.paymentDate &&
                            new Date(inv.paymentDate).toLocaleDateString(
                              "vi-VN"
                            )}
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePay(inv._id)}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-emerald-700 shadow-sm w-full md:w-auto flex items-center justify-center gap-1"
                        >
                          💳 Thanh toán ngay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceListModal;
