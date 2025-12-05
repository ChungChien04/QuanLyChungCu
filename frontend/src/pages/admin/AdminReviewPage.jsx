// /frontend/src/pages/AdminReviewPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";

const API_BASE = "http://localhost:5000";

const AdminReviewPage = () => {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // PHẢN HỒI
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `${API_BASE}/api/reviews`;
      if (statusFilter !== "all") url += `?status=${statusFilter}`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews(data || []);
    } catch {
      setError("Không tải được danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) fetchReviews();
    // eslint-disable-next-line
  }, [statusFilter]);

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(
        `${API_BASE}/api/reviews/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReviews();
    } catch {
      alert("Không cập nhật được trạng thái.");
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Xóa đánh giá này?")) return;
    try {
      await axios.delete(`${API_BASE}/api/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews();
    } catch {
      alert("Không xóa được đánh giá.");
    }
  };

  const startReply = (review) => {
    setActiveReplyId(review._id);
    setReplyContent(review.reply?.content || "");
  };

  const submitReply = async () => {
    if (!replyContent.trim())
      return alert("Nội dung phản hồi không được để trống.");

    try {
      await axios.put(
        `${API_BASE}/api/reviews/${activeReplyId}/reply`,
        { content: replyContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setActiveReplyId(null);
      setReplyContent("");
      fetchReviews();
    } catch {
      alert("Không gửi được phản hồi.");
    }
  };

  const deleteReply = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá phản hồi?")) return;

    try {
      await axios.delete(`${API_BASE}/api/reviews/${id}/reply`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews();
    } catch {
      alert("Không xóa được phản hồi.");
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-red-100 rounded-2xl shadow-lg p-6">
          <p className="text-sm font-semibold text-red-600 mb-1">
            Truy cập bị từ chối
          </p>
          <p className="text-sm text-slate-600">
            Bạn không có quyền truy cập trang quản trị này. Vui lòng đăng nhập
            bằng tài khoản admin.
          </p>
        </div>
      </div>
    );
  }

  const renderStatusBadge = (status) => {
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Chờ duyệt
        </span>
      );
    }
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Đã duyệt
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Ẩn
      </span>
    );
  };

  // Stats nhỏ cho dashboard
  const totalReviews = reviews.length;
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const hiddenCount = reviews.filter((r) => r.status === "hidden").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOP BAR */}
 {/* HEADER ADMIN – hero giống Hóa đơn */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 pt-[96px] pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-500 mb-2">
            Admin panel
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-1 text-balance">
            Trung tâm quản lý đánh giá
          </h1>
          <p className="text-sm md:text-base text-emerald-900/80 max-w-2xl">
            Theo dõi và quản lý các đánh giá cho căn hộ, duyệt hiển thị trên website
      và phản hồi tới khách hàng một cách chuyên nghiệp.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-10 space-y-6">
{/* BREADCRUMB + MÔ TẢ – LÀM NỔI BẬT HƠN */}


        {/* CARDS THỐNG KÊ NHANH */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3.5">
            <p className="text-xs text-slate-500 mb-1">Tổng đánh giá</p>
            <p className="text-xl font-semibold text-slate-900">
              {totalReviews}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm px-4 py-3.5">
            <p className="text-xs text-amber-700 mb-1">Chờ duyệt</p>
            <p className="text-xl font-semibold text-amber-700">
              {pendingCount}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm px-4 py-3.5">
            <p className="text-xs text-emerald-700 mb-1">Đã duyệt</p>
            <p className="text-xl font-semibold text-emerald-700">
              {approvedCount}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3.5">
            <p className="text-xs text-slate-600 mb-1">Đang ẩn</p>
            <p className="text-xl font-semibold text-slate-700">
              {hiddenCount}
            </p>
          </div>
        </section>

        {/* THANH LỌC */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-xs font-medium text-slate-600">
              Lọc theo trạng thái:
            </span>
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition ${
                  statusFilter === "all"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition ${
                  statusFilter === "pending"
                    ? "bg-white shadow-sm text-amber-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Chờ duyệt
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("approved")}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition ${
                  statusFilter === "approved"
                    ? "bg-white shadow-sm text-emerald-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Đã duyệt
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("hidden")}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition ${
                  statusFilter === "hidden"
                    ? "bg-white shadow-sm text-slate-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Ẩn
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </section>

        {/* BẢNG DANH SÁCH */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10">
                <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left font-semibold">Căn hộ</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Người dùng
                  </th>
                  <th className="px-4 py-3 text-left font-semibold w-20">
                    Điểm
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Nội dung
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Ngày</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Phản hồi
                  </th>
                  <th className="px-4 py-3 text-left font-semibold w-64">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody>
                {reviews.map((r) => (
                  <tr
                    key={r._id}
                    className="border-t border-slate-100 hover:bg-slate-50/80 align-top transition-colors"
                  >
                    {/* Căn hộ */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 line-clamp-2">
                        {r.apartment?.title || "—"}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ID: {r.apartment?._id || "N/A"}
                      </p>
                    </td>

                    {/* User */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-800">
                        {r.user?.name || r.user?.email}
                      </p>
                      {r.user?.email && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {r.user.email}
                        </p>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-sm">
                        <span className="text-base">★</span>
                        <span>{r.rating}</span>
                      </span>
                    </td>

                    {/* Content */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-slate-800 break-words whitespace-pre-wrap">
                        {r.content}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">{renderStatusBadge(r.status)}</td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <p className="text-[11px] text-slate-500">
                        {new Date(r.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </td>

                    {/* Reply */}
                    <td className="px-4 py-3 max-w-xs">
                      {r.reply?.content ? (
                        <div className="space-y-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                          <p className="text-xs text-slate-800 break-words whitespace-pre-wrap">
                            {r.reply.content}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Phản hồi lúc{" "}
                            {new Date(
                              r.reply.repliedAt
                            ).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Chưa có phản hồi
                        </span>
                      )}
                    </td>

                    {/* Actions – ĐÃ THIẾT KẾ LẠI */}
                    <td className="px-4 py-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
                        {/* Nhóm nút trạng thái + xoá */}
                        <div className="flex flex-col gap-1.5">
                          {r.status !== "approved" && (
                            <button
                              onClick={() => updateStatus(r._id, "approved")}
                              className="w-full bg-emerald-600 text-white px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-emerald-700 shadow-sm transition"
                            >
                              Duyệt hiển thị
                            </button>
                          )}

                          {r.status !== "hidden" && (
                            <button
                              onClick={() => updateStatus(r._id, "hidden")}
                              className="w-full border border-amber-300 bg-amber-50 text-amber-800 px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-amber-100 transition"
                            >
                              Ẩn đánh giá
                            </button>
                          )}

                          <button
                            onClick={() => deleteReview(r._id)}
                            className="w-full border border-red-300 bg-white text-red-600 px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-red-50 transition"
                          >
                            Xóa đánh giá
                          </button>
                        </div>

                        {/* Nhóm nút phản hồi */}
                        <div className="border-t border-slate-200 pt-2 flex flex-col gap-1.5">
                          <button
                            onClick={() => startReply(r)}
                            className="w-full bg-sky-600 text-white px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-sky-700 transition"
                          >
                            {r.reply?.content ? "Sửa phản hồi" : "Phản hồi"}
                          </button>

                          {r.reply?.content && (
                            <button
                              onClick={() => deleteReply(r._id)}
                              className="w-full bg-slate-500 text-white px-2 py-1.5 rounded-lg text-[11px] font-medium hover:bg-slate-600 transition"
                            >
                              Xóa phản hồi
                            </button>
                          )}
                        </div>

                        {/* Ô nhập phản hồi inline */}
                        {activeReplyId === r._id && (
                          <div className="mt-2 p-2 border border-slate-200 rounded-xl bg-white">
                            <textarea
                              rows={3}
                              className="w-full border border-slate-200 p-2 rounded-xl text-xs mb-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                              value={replyContent}
                              onChange={(e) =>
                                setReplyContent(e.target.value)
                              }
                              placeholder="Nhập nội dung phản hồi cho khách hàng..."
                            />

                            <div className="flex gap-2">
                              <button
                                onClick={submitReply}
                                className="flex-1 bg-emerald-600 text-white py-1.5 rounded-xl text-[11px] font-semibold hover:bg-emerald-700 transition"
                              >
                                Lưu phản hồi
                              </button>

                              <button
                                onClick={() => {
                                  setActiveReplyId(null);
                                  setReplyContent("");
                                }}
                                className="flex-1 bg-slate-200 text-slate-700 py-1.5 rounded-xl text-[11px] font-semibold hover:bg-slate-300 transition"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && reviews.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-500 text-sm"
                    >
                      Hiện chưa có đánh giá nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-600 text-sm"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminReviewPage;
