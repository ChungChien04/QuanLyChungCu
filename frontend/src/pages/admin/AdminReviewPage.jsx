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
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <p className="text-center text-red-600 bg-white px-6 py-4 rounded-2xl shadow border border-red-100 text-sm md:text-base">
          Bạn không có quyền truy cập trang này.
        </p>
      </div>
    );
  }

  const renderStatusBadge = (status) => {
    if (status === "pending") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
          Chờ duyệt
        </span>
      );
    }
    if (status === "approved") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Đã duyệt
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
        Ẩn
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* HEADER */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 pt-[96px] pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-500 mb-2">
            Admin panel
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-1">
            Quản lý đánh giá
          </h1>
          <p className="text-sm md:text-base text-emerald-900/80 max-w-xl">
            Xem, duyệt, ẩn và phản hồi các đánh giá của khách hàng cho từng căn
            hộ.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* LỌC */}
        <div className="bg-white shadow-md rounded-2xl p-5 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-800 text-sm">
                Lọc theo trạng thái:
              </span>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="hidden">Ẩn</option>
              </select>
            </div>

            {loading && (
              <p className="text-xs text-gray-500 italic">
                Đang tải danh sách đánh giá...
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm mt-3 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </div>

        {/* TABLE */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-emerald-50/80 border-b border-gray-200">
              <tr className="text-gray-700">
                <th className="px-3 py-3 text-left font-semibold">Căn hộ</th>
                <th className="px-3 py-3 text-left font-semibold">Người dùng</th>
                <th className="px-3 py-3 text-left font-semibold">Điểm</th>
                <th className="px-3 py-3 text-left font-semibold">Nội dung</th>
                <th className="px-3 py-3 text-left font-semibold">Trạng thái</th>
                <th className="px-3 py-3 text-left font-semibold">Ngày</th>
                <th className="px-3 py-3 text-left font-semibold">Phản hồi</th>
                <th className="px-3 py-3 text-left font-semibold">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {reviews.map((r) => (
                <tr
                  key={r._id}
                  className="border-t border-gray-100 hover:bg-emerald-50/40 align-top"
                >
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {r.apartment?.title || "—"}
                    </p>
                  </td>

                  <td className="px-3 py-3">
                    <p className="text-gray-800">
                      {r.user?.name || r.user?.email}
                    </p>
                  </td>

                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                      ⭐ <span>{r.rating}</span>
                    </span>
                  </td>

                  <td className="px-3 py-3 max-w-xs">
                    <p className="text-gray-800 text-sm break-words whitespace-pre-wrap">
                      {r.content}
                    </p>
                  </td>

                  <td className="px-3 py-3">
                    {renderStatusBadge(r.status)}
                  </td>

                  <td className="px-3 py-3">
                    <p className="text-xs text-gray-600">
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </td>

                  {/* PHẢN HỒI */}
                  <td className="px-3 py-3 max-w-xs">
                    {r.reply?.content ? (
                      <div className="space-y-1">
                        <p className="text-gray-800 text-sm break-words whitespace-pre-wrap">
                          {r.reply.content}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {new Date(r.reply.repliedAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        Chưa có phản hồi
                      </span>
                    )}
                  </td>

                  {/* BUTTONS */}
                  <td className="px-3 py-3 min-w-[190px]">
                    <div className="flex flex-col gap-1.5">
                      {r.status !== "approved" && (
                        <button
                          onClick={() => updateStatus(r._id, "approved")}
                          className="w-full bg-emerald-600 text-white px-2 py-1.5 rounded-xl text-xs font-medium hover:bg-emerald-700 shadow-sm"
                        >
                          Duyệt
                        </button>
                      )}

                      {r.status !== "hidden" && (
                        <button
                          onClick={() => updateStatus(r._id, "hidden")}
                          className="w-full bg-amber-500 text-white px-2 py-1.5 rounded-xl text-xs font-medium hover:bg-amber-600"
                        >
                          Ẩn
                        </button>
                      )}

                      <button
                        onClick={() => deleteReview(r._id)}
                        className="w-full bg-red-500 text-white px-2 py-1.5 rounded-xl text-xs font-medium hover:bg-red-600"
                      >
                        Xóa
                      </button>

                      <button
                        onClick={() => startReply(r)}
                        className="w-full bg-blue-600 text-white px-2 py-1.5 rounded-xl text-xs font-medium hover:bg-blue-700"
                      >
                        {r.reply?.content ? "Sửa phản hồi" : "Phản hồi"}
                      </button>

                      {r.reply?.content && (
                        <button
                          onClick={() => deleteReply(r._id)}
                          className="w-full bg-gray-500 text-white px-2 py-1.5 rounded-xl text-xs font-medium hover:bg-gray-600"
                        >
                          Xóa phản hồi
                        </button>
                      )}

                      {activeReplyId === r._id && (
                        <div className="mt-2 p-2 border border-gray-200 rounded-xl bg-gray-50">
                          <textarea
                            rows={3}
                            className="w-full border border-gray-200 p-2 rounded-xl text-xs mb-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                          />

                          <div className="flex gap-2">
                            <button
                              onClick={submitReply}
                              className="flex-1 bg-emerald-600 text-white py-1.5 rounded-xl text-xs font-semibold hover:bg-emerald-700"
                            >
                              Lưu
                            </button>

                            <button
                              onClick={() => {
                                setActiveReplyId(null);
                                setReplyContent("");
                              }}
                              className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded-xl text-xs font-semibold hover:bg-gray-300"
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
                    className="px-4 py-10 text-center text-gray-500 text-sm"
                  >
                    Chưa có đánh giá nào.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-600 text-sm"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminReviewPage;
