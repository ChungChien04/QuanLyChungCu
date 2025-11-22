// /frontend/src/pages/ApartmentDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const API_BASE = "http://localhost:5000";

const ApartmentDetailPage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reloadReview, setReloadReview] = useState(false);

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(5);

  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/800x500";
    if (img.startsWith("http")) return img;
    return `${API_BASE}/${img.replace(/\\/g, "/")}`;
  };

  useEffect(() => {
    const fetchApartment = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE}/api/apartments/${id}`);
        setApartment(data);
        setActiveIndex(0);
        setError("");
      } catch {
        setError("Không tìm thấy căn hộ hoặc lỗi server.");
      } finally {
        setLoading(false);
      }
    };

    fetchApartment();
  }, [id]);

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

  const submitReview = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập để đánh giá.");
      return;
    }

    if (!comment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    try {
      const body = { rating, content: comment };
      await axios.post(`${API_BASE}/api/reviews/${id}`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComment("");
      setReloadReview((v) => !v);
    } catch (err) {
      alert(err.response?.data?.message || "Không gửi được đánh giá.");
    }
  };

  const startEdit = (review) => {
    setEditingReviewId(review._id);
    setEditContent(review.content);
    setEditRating(review.rating);
  };

  const submitEdit = async () => {
    if (!editContent.trim()) {
      alert("Nội dung đánh giá không được để trống.");
      return;
    }

    try {
      const body = { content: editContent, rating: editRating };
      await axios.put(`${API_BASE}/api/reviews/user/${editingReviewId}`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  if (loading) return <p className="text-center mt-10">Đang tải...</p>;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;
  if (!apartment) return <p className="text-center mt-10">Không tìm thấy.</p>;

  const mainImage =
    apartment.images?.length > 0
      ? getImageUrl(apartment.images[activeIndex])
      : "https://placehold.co/800x500";

  return (
    <div className="max-w-6xl mx-auto pt-[80px] pb-20 px-6">

      {/* === IMAGE GALLERY === */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="md:col-span-3 h-[400px] rounded-xl overflow-hidden">
          <img
            src={mainImage}
            alt="Main"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:col-span-1">
          {apartment.images?.slice(0, 4).map((img, i) => (
            <img
              key={i}
              src={getImageUrl(img)}
              alt="thumb"
              className="h-48 w-full object-cover rounded-xl cursor-pointer hover:opacity-80"
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
      </div>

      {/* === TITLE + PRICE === */}
      <div className="flex justify-between items-start mb-8 flex-wrap">
        <h1 className="text-3xl font-bold text-gray-900">
          {apartment.title}
        </h1>

        <div className="text-right">
          <p className="text-3xl font-bold text-indigo-600">
            {apartment.price.toLocaleString()} đ
          </p>
          <p
            className={`inline-block mt-1 px-3 py-1 rounded-full text-sm ${
              apartment.status === "available"
                ? "bg-green-100 text-green-700"
                : apartment.status === "rented"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {apartment.status === "available"
              ? "Còn trống"
              : apartment.status === "rented"
              ? "Đang thuê"
              : "Đã bán"}
          </p>
        </div>
      </div>

      {/* === INFO GRID === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-gray-700">
        <div className="space-y-2">
          <p><strong>Diện tích:</strong> {apartment.area} m²</p>
          <p><strong>Phòng ngủ:</strong> {apartment.bedrooms}</p>
          <p><strong>Phòng vệ sinh:</strong> {apartment.bathrooms}</p>
        </div>

        <div className="space-y-2">
          <p><strong>Địa chỉ:</strong> {apartment.location?.address || "—"}</p>
          <p><strong>Tầng:</strong> {apartment.location?.floor || "—"}</p>
        </div>
      </div>

      {/* === DESCRIPTION === */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Mô tả</h2>
        <p className="text-gray-700 leading-relaxed">{apartment.description}</p>
      </div>

      {/* === UTILITIES === */}
      {apartment.utilities?.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Tiện ích</h2>

          <div className="flex flex-wrap gap-2">
            {apartment.utilities.map((u, i) => (
              <span
                key={i}
                className="bg-gray-100 border px-3 py-1 rounded-lg text-gray-700"
              >
                {u}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* === REVIEWS === */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">
          Đánh giá căn hộ
        </h2>

        {/* LIST REVIEW */}
        {reviews.length === 0 ? (
          <p className="text-gray-500">Chưa có đánh giá nào.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r._id}
                className="border p-4 rounded-xl bg-gray-50 shadow-sm"
              >
                <p className="font-semibold">{r.user?.name}</p>
                <p className="text-yellow-600 mb-1">⭐ {r.rating} / 5</p>
                <p>{r.content}</p>

                {/* ADMIN REPLY */}
                {r.reply?.content && (
                  <div className="mt-3 ml-4 p-3 bg-indigo-50 border-l-4 border-indigo-600 rounded">
                    <p className="text-sm font-semibold text-indigo-800">
                      Phản hồi từ quản lý:
                    </p>
                    <p className="text-sm text-gray-700">{r.reply.content}</p>
                  </div>
                )}

                {/* OWNER ACTIONS */}
                {user && user._id === r.user?._id && (
                  <div className="flex gap-3 mt-3 text-sm">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => startEdit(r)}
                    >
                      Sửa
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => deleteReview(r._id)}
                    >
                      Xoá
                    </button>
                  </div>
                )}

                {/* EDIT FORM */}
                {editingReviewId === r._id && (
                  <div className="mt-3 p-3 border rounded-lg bg-white">
                    <textarea
                      className="w-full border p-2 mb-2 rounded"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />

                    <select
                      className="border p-2 rounded w-full mb-2"
                      value={editRating}
                      onChange={(e) => setEditRating(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5].map((s) => (
                        <option key={s} value={s}>
                          {s} sao
                        </option>
                      ))}
                    </select>

                    <button
                      className="bg-indigo-600 text-white px-4 py-2 rounded"
                      onClick={submitEdit}
                    >
                      Lưu
                    </button>
                    <button
                      className="ml-3 text-gray-500"
                      onClick={() => setEditingReviewId(null)}
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* WRITE REVIEW */}
        {user && user.role !== "admin" && (
          <div className="mt-6 p-4 border rounded-xl bg-white shadow-sm">
            <h3 className="font-semibold mb-2">Viết đánh giá</h3>

            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="border p-2 rounded w-full mb-3"
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r} sao
                </option>
              ))}
            </select>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border p-2 rounded w-full mb-3"
              placeholder="Nhập bình luận..."
            />

            <button
              onClick={submitReview}
              className=" bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-800"
            >
              Gửi đánh giá
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentDetailPage;
