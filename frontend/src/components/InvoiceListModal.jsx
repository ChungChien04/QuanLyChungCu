import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";

import {
  ReceiptRefundIcon,
  CreditCardIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const API_BASE = "http://localhost:5000";

const formatMoney = (v) =>
  typeof v === "number" ? v.toLocaleString("vi-VN") : "0";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "--/--/----";

const InvoiceListModal = ({ isOpen, onClose, rentalId, apartmentTitle }) => {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load danh sách hóa đơn khi mở modal
  useEffect(() => {
    if (!isOpen || !rentalId || !token) return;

    let cancelled = false;

    const fetchInvoices = async () => {
      setLoading(true);
      setError("");
      setInvoices([]);

      try {
        const res = await axios.get(
          `${API_BASE}/api/invoices/my-invoices/${rentalId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!cancelled) {
          setInvoices(res.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(err.response?.data?.message || "Lỗi tải danh sách hóa đơn");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchInvoices();

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

  // Summary
  const totalInvoices = invoices.length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const unpaidCount = totalInvoices - paidCount;
  const unpaidAmount = invoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-emerald-50">
        {/* HEADER */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white flex justify-between items-center">
          <div className="flex items-start gap-3">
            <div className="mt-1 hidden sm:flex w-9 h-9 rounded-2xl bg-white/10 items-center justify-center">
              <ReceiptRefundIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-100">
                Hóa đơn điện & dịch vụ
              </p>
              <h3 className="text-base md:text-lg font-semibold line-clamp-2">
                {apartmentTitle || "Căn hộ đang thuê"}
              </h3>
              {totalInvoices > 0 && (
                <p className="text-[11px] mt-1 text-emerald-100/90">
                  {paidCount} hóa đơn đã thanh toán · {unpaidCount} hóa đơn còn
                  lại
                </p>
              )}
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
        <div className="p-4 md:p-5 overflow-y-auto flex-1 bg-slate-50/80">
          {loading ? (
            <p className="text-center text-gray-500 text-sm py-8 animate-pulse">
              Đang tải danh sách hóa đơn...
            </p>
          ) : error ? (
            <div className="py-8 text-center text-sm text-red-600 bg-white rounded-2xl border border-red-100">
              {error}
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm bg-white rounded-2xl border border-dashed border-emerald-100">
              Chưa có hóa đơn nào cho căn hộ này.
            </div>
          ) : (
            <>
              {/* SUMMARY BAR */}
              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs md:text-sm">
                <div className="bg-white rounded-xl border border-emerald-100 px-3 py-2.5 flex flex-col gap-0.5">
                  <span className="text-[11px] text-emerald-600 uppercase tracking-wide">
                    Tổng hóa đơn
                  </span>
                  <span className="text-base font-semibold text-emerald-800">
                    {totalInvoices}
                  </span>
                </div>
                <div className="bg-white rounded-xl border border-emerald-100 px-3 py-2.5 flex flex-col gap-0.5">
                  <span className="text-[11px] text-emerald-600 uppercase tracking-wide">
                    Đã thanh toán
                  </span>
                  <span className="text-base font-semibold text-emerald-800">
                    {paidCount}
                  </span>
                </div>
                <div className="bg-white rounded-xl border border-amber-100 px-3 py-2.5 flex flex-col gap-0.5">
                  <span className="text-[11px] text-amber-600 uppercase tracking-wide">
                    Chưa thanh toán
                  </span>
                  <span className="text-base font-semibold text-amber-700">
                    {unpaidCount}
                  </span>
                </div>
                <div className="bg-emerald-600/95 rounded-xl px-3 py-2.5 flex flex-col gap-0.5 text-white">
                  <span className="text-[11px] uppercase tracking-wide text-emerald-100">
                    Tổng cần thanh toán
                  </span>
                  <span className="text-base font-semibold">
                    {formatMoney(unpaidAmount)} đ
                  </span>
                </div>
              </div>

              {/* LIST INVOICES */}
              <div className="space-y-4">
                {invoices.map((inv) => {
                  const isPaid = inv.status === "paid";

                  return (
                    <div
                      key={inv._id}
                      className="group border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm bg-white flex flex-col md:flex-row justify-between items-stretch gap-4 hover:shadow-md hover:border-emerald-200 transition-all"
                    >
                      {/* LEFT: INFO */}
                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-center mb-3 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                <BoltIcon className="w-5 h-5 text-emerald-600" />
                              </div>
                              <span className="absolute -bottom-1 -right-1 text-[11px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                                {inv.month}/{inv.year}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wide">
                                Kỳ thanh toán
                              </p>
                              <p className="font-semibold text-slate-900 text-sm md:text-base">
                                Tháng {inv.month}/{inv.year}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Tạo ngày: {formatDate(inv.createdAt)}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
                              isPaid
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                Đã thanh toán
                              </>
                            ) : (
                              <>
                                <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                Chưa thanh toán
                              </>
                            )}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs md:text-sm text-slate-600 mt-1">
                          <p>
                            Điện:{" "}
                            <b className="text-slate-900">
                              {inv.electricUsage} kW
                            </b>{" "}
                            ({inv.electricOldIndex} → {inv.electricNewIndex})
                          </p>
                          <p>
                            Tiền điện:{" "}
                            <span className="font-medium text-slate-900">
                              {formatMoney(inv.electricTotal)} đ
                            </span>
                          </p>
                          <p>
                            Phí chung:{" "}
                            <span className="font-medium text-slate-900">
                              {formatMoney(inv.commonFee)} đ
                            </span>
                          </p>
                          <p>
                            Vệ sinh:{" "}
                            <span className="font-medium text-slate-900">
                              {formatMoney(inv.cleaningFee)} đ
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* RIGHT: TOTAL & ACTION */}
                      <div className="md:w-64 w-full md:border-l border-t md:border-t-0 border-slate-100 md:pl-5 pt-3 md:pt-0 flex flex-row md:flex-col justify-between items-center md:items-end gap-3">
                        <div className="text-right w-full">
                          <p className="text-[11px] text-slate-500">
                            Tổng thanh toán
                          </p>
                          <p className="text-lg md:text-xl font-bold text-red-600">
                            {formatMoney(inv.totalAmount)} đ
                          </p>
                          {isPaid && inv.paymentDate && (
                            <p className="text-[11px] text-emerald-600 mt-1">
                              Thanh toán ngày {formatDate(inv.paymentDate)}
                            </p>
                          )}
                        </div>

                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs md:text-sm font-medium bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                            <CheckCircleIcon className="w-4 h-4" />
                            Đã hoàn tất
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePay(inv._id)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-emerald-700 shadow-sm w-full md:w-auto flex items-center justify-center gap-1"
                          >
                            <CreditCardIcon className="w-4 h-4" />
                            Thanh toán ngay
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceListModal;
