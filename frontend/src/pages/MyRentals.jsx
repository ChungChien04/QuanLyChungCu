import React, { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import SignContractModal from "../components/SignContractModal";

const API_BASE = "http://localhost:5000";

// ======= TOAST COMPONENT =======
const Toast = ({ message, type = "success" }) => {
  if (!message) return null;
  const bgColor = type === "success" ? "bg-emerald-600" : "bg-red-600";
  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-2xl shadow-lg animate-slideIn z-50 text-sm font-medium`}
    >
      {message}
    </div>
  );
};

const MyRentals = () => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal ký hợp đồng
  const [selectedRental, setSelectedRental] = useState(null);
  const [signModalOpen, setSignModalOpen] = useState(false);

  // Loading cho hành động (tránh spam click)
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 4000);
  };

  const fetchRentals = async () => {
    // Chỉ show loading toàn trang lần đầu
    if (rentals.length === 0) setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/rentals/my-rentals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRentals(data);
    } catch (err) {
      console.error(err);
      showToast("Lỗi tải danh sách hợp đồng", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC XỬ LÝ KHI VNPAY REDIRECT VỀ ---
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const status = query.get("status");

    if (status) {
      if (status === "success") {
        showToast("Thanh toán thành công! Hợp đồng đã hoàn tất.", "success");
      } else if (status === "failed") {
        showToast("Giao dịch thất bại hoặc bị hủy bỏ.", "error");
      } else if (status === "invalid") {
        showToast("Dữ liệu thanh toán không hợp lệ!", "error");
      }

      // Xóa query trên URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchRentals();
    } else {
      fetchRentals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- XỬ LÝ KÝ HỢP ĐỒNG ---
  const handleSignContract = (rental) => {
    setSelectedRental(rental);
    setSignModalOpen(true);
  };

  const onSignConfirm = async (text) => {
    if (!selectedRental) return;
    setActionLoading(true);
    try {
      await axios.put(
        `${API_BASE}/api/rentals/${selectedRental._id}/sign`,
        { contractText: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Ký hợp đồng thành công");
      setSignModalOpen(false);
      setSelectedRental(null);
      fetchRentals();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi ký hợp đồng", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- XỬ LÝ THANH TOÁN ---
  const handlePaymentInit = async (id) => {
    setActionLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/payments/create_payment_url/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast("Không lấy được link thanh toán từ hệ thống.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Lỗi khởi tạo thanh toán",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 pb-10">
      <Toast message={toast.message} type={toast.type} />

      {/* HEADER */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-5xl mx-auto px-6 pt-[96px] pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-500 mb-2">
            Tài khoản của bạn
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-1">
            Hợp đồng của tôi
          </h1>
          <p className="text-sm md:text-base text-emerald-900/80 max-w-2xl">
            Theo dõi trạng thái hợp đồng, ký tên và thực hiện thanh toán ngay
            trên hệ thống.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 pt-6 pb-16">
        {loading ? (
          <p className="text-center mt-10 text-gray-500 animate-pulse text-sm">
            Đang tải dữ liệu...
          </p>
        ) : !rentals.length ? (
          <p className="text-center mt-10 text-gray-500 text-sm">
            Chưa có đơn đăng ký hợp đồng nào.
          </p>
        ) : (
          <div className="space-y-4">
            {rentals.map((r) => (
              <div
                key={r._id}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition p-4 md:p-5 flex flex-col md:flex-row gap-4"
              >
                {/* Thông tin chi tiết */}
                <div className="flex-1 space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between items-start gap-3">
                    <span className="font-semibold text-gray-900 text-base md:text-lg">
                      {r.apartment?.title || "Căn hộ không tồn tại"}
                    </span>

                    {/* Trạng thái tổng hợp */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${(() => {
                        if (r.status === "cancelled" || r.status === "cancelling")
                          return "bg-red-50 text-red-700 border-red-200";
                        if (r.paymentDone || r.status === "rented")
                          return "bg-emerald-50 text-emerald-700 border-emerald-200";
                        if (r.contractSigned && !r.paymentDone)
                          return "bg-sky-50 text-sky-700 border-sky-200";
                        if (r.status === "approved")
                          return "bg-indigo-50 text-indigo-700 border-indigo-200";
                        return "bg-yellow-50 text-yellow-700 border-yellow-200";
                      })()}`}
                    >
                      {(() => {
                        if (r.status === "cancelled") return "Đã hủy";
                        if (r.status === "cancelling") return "Đang hủy";
                        if (r.paymentDone || r.status === "rented")
                          return "Hoàn tất";
                        if (r.status === "approved") {
                          if (r.contractSigned) return "Chờ thanh toán";
                          return "Chờ ký HĐ";
                        }
                        return "Chờ duyệt";
                      })()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    <p className="text-[13px] md:text-sm">
                      📅 <span className="font-semibold">Bắt đầu:</span>{" "}
                      {new Date(r.startDate).toLocaleDateString("vi-VN")}
                    </p>
                    <p className="text-[13px] md:text-sm">
                      📅 <span className="font-semibold">Kết thúc:</span>{" "}
                      {new Date(r.endDate).toLocaleDateString("vi-VN")}
                    </p>
                    <p className="md:col-span-2 text-[13px] md:text-sm">
                      💰 <span className="font-semibold">Tổng tiền:</span>{" "}
                      <span className="text-red-600 font-bold text-base">
                        {r.totalPrice?.toLocaleString()} đ
                      </span>
                    </p>
                  </div>
                </div>

                {/* Nút thao tác */}
                <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                  {/* Bước 1: Ký hợp đồng */}
                  {r.status === "approved" && !r.contractSigned && (
                    <button
                      onClick={() => handleSignContract(r)}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
                    >
                      ✍️ Ký hợp đồng
                    </button>
                  )}

                  {/* Bước 2: Thanh toán */}
                  {r.contractSigned &&
                    !r.paymentDone &&
                    r.status !== "cancelled" && (
                      <button
                        onClick={() => handlePaymentInit(r._id)}
                        disabled={actionLoading}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
                      >
                        {actionLoading ? "Đang xử lý..." : "💳 Thanh toán"}
                      </button>
                    )}

                  {/* Hoàn tất */}
                  {r.paymentDone && (
                    <div className="text-emerald-700 font-semibold text-xs md:text-sm flex items-center justify-center border border-emerald-200 bg-emerald-50 py-2 rounded-xl gap-1">
                      ✅ Đã thanh toán
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SignContractModal
        open={signModalOpen}
        rental={selectedRental}
        defaultText={selectedRental?.contractText || ""}
        loading={actionLoading}
        onClose={() => {
          setSignModalOpen(false);
          setSelectedRental(null);
        }}
        onConfirm={onSignConfirm}
      />
    </div>
  );
};

export default MyRentals;
