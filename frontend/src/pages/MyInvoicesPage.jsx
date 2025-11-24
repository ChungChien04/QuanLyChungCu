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
        const { data } = await axios.get(`${API_BASE}/api/rentals/my-rentals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Chỉ lấy những căn ĐANG THUÊ (đã trả tiền thuê nhà)
        const activeOnes = data.filter(r => r.status === "rented");
        setRentals(activeOnes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveRentals();
  }, [token]);

  if (loading) return <p className="text-center mt-20 text-gray-500">Đang tải dữ liệu...</p>;

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-green-800">
        Hóa đơn Điện & Dịch vụ
      </h1>

      {rentals.length === 0 ? (
        <div className="text-center bg-gray-50 p-10 rounded-xl border">
          <p className="text-gray-600 mb-4">Bạn chưa có căn hộ nào đang thuê.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rentals.map((r) => (
            <div key={r._id} className="bg-white border rounded-2xl shadow-md hover:shadow-lg transition p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-600 text-white px-3 py-1 rounded-bl-xl text-xs font-bold uppercase">
                Đang ở
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {r.apartment?.title || "Căn hộ"}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                {r.apartment?.location?.address || "Chưa cập nhật địa chỉ"}
              </p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Hợp đồng: <span className="font-semibold text-black">#{r._id.slice(-6)}</span>
                </div>
                
                <button
                  onClick={() => setSelectedRental(r)}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-800 transition shadow-sm font-medium flex items-center gap-2"
                >
                  Xem hóa đơn
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reuse Modal Hóa Đơn */}
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