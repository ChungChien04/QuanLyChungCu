import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import RentApartmentModal from "../components/RentApartmentModal";

const API_BASE = "http://localhost:5000";

const ApartmentDetailPage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // ===== REVIEW STATES =====
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reloadReview, setReloadReview] = useState(false);

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(5);

  // ===== RENTAL STATE =====
  const [openRentModal, setOpenRentModal] = useState(false);

  // ===== IMAGE HANDLER =====
  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/800x500";
    if (img.startsWith("http")) return img;
    return `${API_BASE}/${img.replace(/\\/g, "/")}`;
  };

  // ===== LOAD APARTMENT =====
  useEffect(() => {
    const fetchApartment = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE}/api/apartments/${id}`);
        setApartment(data);

        if (data.images?.length > 0) setActiveIndex(0);
        else setActiveIndex(-1);

        setError("");
      } catch {
        setError("Không tìm thấy căn hộ hoặc lỗi server.");
      } finally {
        setLoading(false);
      }
    };
    fetchApartment();
  }, [id]);

  // ===== LOAD REVIEWS =====
  const loadReviews = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/reviews/${id}`);
      setReviews(data);
    } catch (err) {
      console.log("Lỗi load review:", err);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [id, reloadReview]);

  // ===== POST REVIEW =====
  const submitReview = async () => {
    if (!user) return alert("Bạn cần đăng nhập để đánh giá.");
    if (!comment.trim()) return alert("Vui lòng nhập nội dung đánh giá.");

    try {
      await axios.post(
        `${API_BASE}/api/reviews/${id}`,
        { rating, content: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComment("");
      setRating(5);
      setReloadReview((v) => !v);
    } catch (err) {
      alert(err.response?.data?.message || "Không gửi được đánh giá.");
    }
  };

  // ===== EDIT REVIEW =====
  const startEdit = (review) => {
    setEditingReviewId(review._id);
    setEditContent(review.content);
    setEditRating(review.rating);
  };

  const submitEdit = async () => {
    if (!editContent.trim())
      return alert("Nội dung đánh giá không được để trống.");

    try {
      await axios.put(
        `${API_BASE}/api/reviews/user/${editingReviewId}`,
        { content: editContent, rating: editRating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingReviewId(null);
      setReloadReview((v) => !v);
    } catch (err) {
      alert(err.response?.data?.message || "Không cập nhật được đánh giá.");
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Bạn chắc chắn muốn xoá đánh giá này?")) return;
    try {
      await axios.delete(`${API_BASE}/api/reviews/user/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReloadReview((v) => !v);
    } catch {
      alert("Không thể xoá đánh giá.");
    }
  };

  // ===== HANDLE RENT FROM MODAL =====
  const handleRentConfirm = async (months, startDate, endDate) => {
    if (!user) return alert("Bạn cần đăng nhập để thuê căn hộ.");

    try {
      await axios.post(
        `${API_BASE}/api/rentals`,
        {
          apartmentId: apartment._id,
          startDate,
          endDate,
          totalPrice: apartment.price * months,
          months,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOpenRentModal(false);
      alert("Đơn thuê đã được gửi! Chờ admin duyệt.");
    } catch (err) {
      alert(err.response?.data?.message || "Không thể tạo đơn thuê.");
    }
  };

  // ===== UI =====

  if (loading) return <p className="text-center mt-10">Đang tải...</p>;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;
  if (!apartment) return <p className="text-center mt-10">Không tìm thấy.</p>;

  const mainImage = getImageUrl(apartment.images?.[activeIndex] || null);

  const statusBadge =
    apartment.status === "available"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : apartment.status === "rented"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  const statusText =
    apartment.status === "available"
      ? "Còn trống"
      : apartment.status === "rented"
      ? "Đang thuê"
      : "Tạm khóa";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* HERO HEADER */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-6xl mx-auto px-6 pt-[96px] pb-6 flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-500">
            SMARTBUILDING • APARTMENT DETAIL
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-800">
            {apartment.title}
          </h1>
          <p className="text-sm md:text-base text-emerald-900/80 max-w-2xl">
            Xem thông tin chi tiết, hình ảnh và đánh giá của cư dân về căn hộ
            này.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 pb-20 pt-6">
        {/* TOP: GALLERY + SUMMARY CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* GALLERY */}
          <div className="lg:col-span-2 space-y-3">
            <div className="h-[320px] md:h-[380px] rounded-3xl overflow-hidden shadow-md border border-gray-100 bg-gray-100">
              <img
                src={mainImage}
                alt={apartment.title}
                className="w-full h-full object-cover"
              />
            </div>

            {apartment.images?.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {apartment.images.map((img, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`h-20 md:h-24 rounded-2xl overflow-hidden border transition ring-offset-2 ${
                      activeIndex === index
                        ? "ring-2 ring-emerald-500 border-transparent"
                        : "border-gray-200 hover:border-emerald-300"
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`thumb-${index}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SUMMARY CARD */}
          <aside className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Mã căn hộ:{" "}
                  <span className="font-medium text-gray-700">
                    {apartment._id?.slice(-6).toUpperCase()}
                  </span>
                </p>
                <h2 className="text-2xl font-bold text-emerald-700">
                  {apartment.price.toLocaleString()} VNĐ
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Giá thuê / tháng (chưa bao gồm dịch vụ khác)
                </p>
              </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge}`}
            >
              {statusText}
            </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <InfoRow label="Diện tích" value={`${apartment.area || "--"} m²`} />
              <InfoRow
                label="Số phòng ngủ"
                value={`${apartment.rooms || "--"} phòng`}
              />
              <InfoRow
                label="Địa chỉ"
                value={apartment.address || "Đang cập nhật"}
                full
              />
            </div>

            {apartment.featured && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-2xl">
                <span className="text-lg">★</span>
                <span>
                  Căn hộ nổi bật được ban quản lý SMARTBUILDING lựa chọn.
                </span>
              </div>
            )}

            {/* RENT BUTTON */}
            {user?.role !== "admin" && apartment.status === "available" && (
              <button
                onClick={() => setOpenRentModal(true)}
                className="mt-2 w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-emerald-700 transition"
              >
                Thuê căn hộ ngay
              </button>
            )}

            {(!user || user.role === "admin" || apartment.status !== "available") && (
              <p className="text-xs text-gray-500 mt-2">
                Đăng nhập với vai trò cư dân để gửi yêu cầu thuê căn hộ.
              </p>
            )}
          </aside>
        </div>

        {/* DESCRIPTION */}
        <section className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 mb-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Mô tả căn hộ
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {apartment.description || "Chưa có mô tả chi tiết cho căn hộ này."}
          </p>
        </section>

        {/* RENT MODAL */}
        <RentApartmentModal
          open={openRentModal}
          apartment={apartment}
          onClose={() => setOpenRentModal(false)}
          onConfirm={handleRentConfirm}
        />

        {/* ========== REVIEWS ========== */}
        <section className="bg-white rounded-3xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-emerald-800">
              Đánh giá căn hộ
            </h2>
            {reviews.length > 0 && (
              <p className="text-xs text-gray-500">
                {reviews.length} đánh giá từ cư dân
              </p>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá căn hộ này.
            </p>
          ) : (
            <div className="space-y-4 mb-6">
              {reviews.map((r) => (
                <div
                  key={r._id}
                  className="border border-gray-100 p-4 rounded-2xl bg-gray-50/70 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-3 mb-1">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {r.user?.name || "Người dùng"}
                      </p>
                      <p className="text-xs text-gray-500">
                        ⭐ {r.rating} / 5
                      </p>
                    </div>

                    {user?._id === r.user?._id && (
                      <div className="flex gap-3 text-xs">
                        <button
                          className="text-emerald-600 hover:underline"
                          onClick={() => startEdit(r)}
                        >
                          Sửa
                        </button>
                        <button
                          className="text-red-500 hover:underline"
                          onClick={() => deleteReview(r._id)}
                        >
                          Xoá
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-700">{r.content}</p>

                  {r.reply?.content && (
                    <div className="mt-3 pl-3 border-l-4 border-emerald-400">
                      <p className="text-xs font-semibold text-emerald-800 mb-1">
                        Phản hồi từ quản lý:
                      </p>
                      <p className="text-xs text-gray-700">
                        {r.reply.content}
                      </p>
                    </div>
                  )}

                  {/* FORM EDIT INLINE */}
                  {editingReviewId === r._id && (
                    <div className="mt-4 p-3 border rounded-2xl bg-white">
                      <textarea
                        className="w-full border border-gray-200 p-2 rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <select
                        className="border border-gray-200 p-2 rounded-xl w-full text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        value={editRating}
                        onChange={(e) =>
                          setEditRating(Number(e.target.value))
                        }
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <option key={s} value={s}>
                            {s} sao
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-3 justify-end text-sm">
                        <button
                          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                          onClick={() => setEditingReviewId(null)}
                        >
                          Hủy
                        </button>
                        <button
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={submitEdit}
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* FORM NEW REVIEW */}
          {user && user.role !== "admin" && (
            <div className="mt-4 p-4 border border-dashed border-emerald-200 rounded-2xl bg-emerald-50/40">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">
                Viết đánh giá của bạn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Xếp hạng
                  </label>
                  <select
                    value={rating}
                    onChange={(e) =>
                      setRating(Number(e.target.value))
                    }
                    className="w-full border border-gray-200 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>
                        {r} sao
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Nội dung
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) =>
                      setComment(e.target.value)
                    }
                    className="w-full border border-gray-200 p-2 rounded-xl text-sm h-20 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Chia sẻ trải nghiệm thực tế của bạn khi ở căn hộ này…"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={submitReview}
                  className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow"
                >
                  Gửi đánh giá
                </button>
              </div>
            </div>
          )}

          {!user && (
            <p className="text-xs text-gray-500 mt-4">
              Đăng nhập để viết đánh giá cho căn hộ này.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ApartmentDetailPage;

/* small info row component */
const InfoRow = ({ label, value, full = false }) => (
  <div className={full ? "col-span-2" : ""}>
    <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
      {label}
    </p>
    <p className="text-sm font-medium text-gray-800">{value}</p>
  </div>
);
