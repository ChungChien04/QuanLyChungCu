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
    } catch  {
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
    if (!replyContent.trim()) return alert("Nội dung phản hồi không được để trống.");

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
      <p className="text-center mt-10 text-red-600">
        Bạn không có quyền truy cập trang này.
      </p>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-20 bg-white shadow-xl rounded-3xl p-8 border border-gray-100">
      
      <h1 className="text-3xl font-bold mb-6 text-green-700">
        Quản lý đánh giá
      </h1>

      {/* LỌC */}
      <div className="flex items-center gap-3 mb-6 bg-gray-50 p-4 rounded-2xl border shadow-sm">
        <span className="font-semibold text-gray-700">Lọc theo trạng thái:</span>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-300"
        >
          <option value="all">Tất cả</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="hidden">Ẩn</option>
        </select>
      </div>

      {loading && <p>Đang tải...</p>}
      {error && <p className="text-red-600 mb-3">{error}</p>}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm rounded-2xl overflow-hidden shadow-md">
          
          <thead className="bg-green-700 text-white text-sm">
            <tr>
              <th className="border px-3 py-3">Căn hộ</th>
              <th className="border px-3 py-3">Người dùng</th>
              <th className="border px-3 py-3">Điểm</th>
              <th className="border px-3 py-3">Nội dung</th>
              <th className="border px-3 py-3">Trạng thái</th>
              <th className="border px-3 py-3">Ngày</th>
              <th className="border px-3 py-3">Phản hồi</th>
              <th className="border px-3 py-3">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {reviews.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50">
                
                <td className="border px-3 py-3">{r.apartment?.title || "—"}</td>
                <td className="border px-3 py-3">{r.user?.name || r.user?.email}</td>
                <td className="border px-3 py-3">⭐ {r.rating}</td>
                <td className="border px-3 py-3 max-w-xs break-words">{r.content}</td>

                <td className="border px-3 py-3">
                  {r.status === "pending" ? (
                    <span className="text-yellow-600 font-semibold">Chờ duyệt</span>
                  ) : r.status === "approved" ? (
                    <span className="text-green-700 font-semibold">Đã duyệt</span>
                  ) : (
                    <span className="text-gray-500">Ẩn</span>
                  )}
                </td>

                <td className="border px-3 py-3">
                  {new Date(r.createdAt).toLocaleString()}
                </td>

                {/* PHẢN HỒI */}
                <td className="border px-3 py-3 max-w-xs break-words">
                  {r.reply?.content ? (
                    <>
                      <p className="text-gray-800 text-sm">{r.reply.content}</p>
                      <small className="text-gray-500 text-xs">
                        {new Date(r.reply.repliedAt).toLocaleString()}
                      </small>
                    </>
                  ) : (
                    <span className="text-gray-400">Chưa có phản hồi</span>
                  )}
                </td>

                {/* BUTTONS */}
                <td className="border mx-auto px-3 py-3 space-y-2 min-w-[150px]">

                  {r.status !== "approved" && (
                    <button
                      onClick={() => updateStatus(r._id, "approved")}
                      className=" w-1/2 bg-green-700 text-white px-2 py-1 rounded-xl text-xs hover:bg-green-800"
                    >
                      Duyệt
                    </button>
                  )}

                  {r.status !== "hidden" && (
                    <button
                      onClick={() => updateStatus(r._id, "hidden")}
                      className="w-1/2  bg-yellow-600 text-white px-2 py-1 rounded-xl text-xs"
                    >
                      Ẩn
                    </button>
                  )}

                  <button
                    onClick={() => deleteReview(r._id)}
                    className="w-1/2 bg-red-600 text-white px-2 py-1 rounded-xl text-xs hover:bg-red-700"
                  >
                    Xóa
                  </button>

                  <button
                    onClick={() => startReply(r)}
                    className="w-1/2 bg-blue-600 text-white px-2 py-1 rounded-xl text-xs"
                  >
                    {r.reply?.content ? "Sửa phản hồi" : "Phản hồi"}
                  </button>

                  {r.reply?.content && (
                    <button
                      onClick={() => deleteReply(r._id)}
                      className="w-1/2 bg-gray-500 text-white px-2 py-1 rounded-xl text-xs"
                    >
                      Xóa phản hồi
                    </button>
                  )}

                  {activeReplyId === r._id && (
                    <div className="mt-2 p-2 border rounded-xl bg-gray-50">
                      <textarea
                        rows="3"
                        className="w-full border p-2 rounded-xl text-sm mb-2"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={submitReply}
                          className="flex-1 bg-green-700 text-white py-1 rounded-xl text-xs"
                        >
                          Lưu
                        </button>

                        <button
                          onClick={() => {
                            setActiveReplyId(null);
                            setReplyContent("");
                          }}
                          className="flex-1 bg-gray-300 text-gray-700 py-1 rounded-xl text-xs"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}

                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default AdminReviewPage;
