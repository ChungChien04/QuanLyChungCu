import React, { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import InvoiceListModal from "../components/InvoiceListModal";

const API_BASE = "http://localhost:5000";

const MyInvoicesPage = () => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState(null);

  // Lấy danh sách các căn đang thuê
  useEffect(() => {
    const fetchActiveRentals = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/rentals/my-rentals`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Chỉ lấy những căn ĐANG THUÊ (đã trả tiền thuê nhà)
        const activeOnes = data.filter((r) => r.status === "rented");
        setRentals(activeOnes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchActiveRentals();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">
          Đang tải dữ liệu hóa đơn...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 pb-16">
      {/* HEADER */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-5xl mx-auto px-6 pt-[96px] pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-500 mb-2">
            Tài khoản của bạn
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-1">
            Hóa đơn điện & dịch vụ
          </h1>
          <p className="text-sm md:text-base text-emerald-900/80 max-w-2xl">
            Xem chi tiết tiền điện, phí chung, vệ sinh cho các căn hộ bạn đang
            thuê.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-5xl mx-auto px-6 pt-6">
        {rentals.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl border border-dashed border-emerald-200 text-center shadow-sm mt-4">
            <p className="text-gray-700 font-medium mb-1">
              Bạn chưa có căn hộ nào đang thuê.
            </p>
            <p className="text-gray-500 text-sm">
              Khi hợp đồng chuyển sang trạng thái{" "}
              <span className="font-semibold text-emerald-700">Đang thuê</span>,
              các hóa đơn sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {rentals.map((r) => (
              <div
                key={r._id}
                className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 relative overflow-hidden"
              >
                {/* Badge trạng thái */}
                <div className="absolute top-0 right-0 bg-emerald-600 text-white px-3 py-1 rounded-bl-2xl text-[11px] font-semibold uppercase tracking-wide shadow-sm">
                  Đang ở
                </div>

                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 pr-16">
                  {r.apartment?.title || "Căn hộ"}
                </h2>
                <p className="text-gray-500 text-xs md:text-sm mb-4">
                  {r.apartment?.location?.address || "Chưa cập nhật địa chỉ"}
                </p>

                <div className="flex items-center justify-between mt-3 pt-4 border-t border-gray-100 text-xs md:text-sm">
                  <div className="text-gray-600">
                    Hợp đồng:{" "}
                    <span className="font-semibold text-gray-900">
                      #{r._id.slice(-6)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedRental(r)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition text-xs md:text-sm shadow-sm font-medium flex items-center gap-2"
                  >
                    <span>📄</span>
                    <span>Xem hóa đơn</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Hóa Đơn */}
      <InvoiceListModal
        isOpen={!!selectedRental}
        onClose={() => setSelectedRental(null)}
        rentalId={selectedRental?._id}
        apartmentTitle={selectedRental?.apartment?.title}
      />
    </div>
  );
};

export default MyInvoicesPage;
