import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";

const API_URL = "http://localhost:5000";

/* ============================
   TOAST COMPONENT
============================= */
const Toast = ({ message, type }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-2 rounded-2xl text-sm font-semibold shadow-lg z-50
        ${
          type === "success"
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white"
        }`}
    >
      {message}
    </div>
  );
};

const AdminNewsPage = () => {
  const { token } = useAuth();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ message: "", type: "success" });
  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: "", type }), 2000);
  };

  // Filters
  const [filterTitle, setFilterTitle] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Popup
  const [showModal, setShowModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState(true);

  // Images
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const fixPath = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_URL}/${url.replace(/^\//, "")}`;
  };

  const loadNews = async () => {
    try {
      if (!token) return;
      setLoading(true);

      const { data } = await axios.get("/api/news", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNews(data);
    } catch (err) {
      console.error(err);
      showToast("Không thể tải tin tức!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadNews();
  }, [token]);

  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];

    const urls = [];
    for (const file of imageFiles) {
      const fd = new FormData();
      fd.append("image", file);

      const { data } = await axios.post("/api/news/upload", fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      urls.push(data.url);
    }
    return urls;
  };

  /* ============================
      CREATE NEWS
  ============================== */
  const createNews = async () => {
    if (!title.trim()) return showToast("Vui lòng nhập tiêu đề!", "error");
    if (!content.trim()) return showToast("Vui lòng nhập nội dung!", "error");

    try {
      const uploadedUrls = await uploadImages();

      await axios.post(
        "/api/news",
        {
          title,
          description,
          content,
          images: uploadedUrls,
          status,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Thêm tin tức thành công!");
      setShowModal(false);
      resetForm();
      loadNews();
    } catch (err) {
      console.log(err);
      showToast("Không thể tạo tin tức!", "error");
    }
  };

  /* ============================
      OPEN EDIT
  ============================== */
  const openEdit = (item) => {
    setEditItem(item);
    setTitle(item.title);
    setDescription(item.description || "");
    setContent(item.content || "");
    setStatus(item.status);

    setExistingImages(
      Array.isArray(item.images)
        ? item.images.map((img) =>
            typeof img === "string" ? img : img?.url || img?.path || ""
          )
        : []
    );

    setImageFiles([]);

    setShowEdit(true);
  };

  /* ============================
      UPDATE NEWS
  ============================== */
  const updateNews = async () => {
    if (!title.trim())
      return showToast("Tiêu đề không được để trống!", "error");
    if (!content.trim())
      return showToast("Nội dung không được để trống!", "error");

    try {
      const uploadedUrls = await uploadImages();
      const finalImages = [...existingImages, ...uploadedUrls];

      const oldImages = editItem.images || [];

      const noChange =
        title.trim() === editItem.title &&
        description.trim() === (editItem.description || "").trim() &&
        content.trim() === (editItem.content || "").trim() &&
        status === editItem.status &&
        JSON.stringify(finalImages) === JSON.stringify(oldImages);

      if (!imageFiles.length && noChange) {
        return showToast("Bạn chưa thay đổi gì!", "error");
      }

      await axios.put(
        `/api/news/${editItem._id}`,
        {
          title,
          description,
          content,
          images: finalImages,
          status,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Cập nhật tin tức thành công!");
      setShowEdit(false);
      resetForm();
      loadNews();
    } catch (err) {
      console.log(err);
      showToast("Không thể cập nhật tin tức!", "error");
    }
  };

  /* ============================
      DELETE NEWS
  ============================== */
  const deleteNews = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá?")) return;

    try {
      await axios.delete(`/api/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast("Xoá thành công!");
      loadNews();
    } catch {
      showToast("Không thể xoá tin tức!", "error");
    }
  };

  /* ============================
      TOGGLE STATUS
  ============================== */
  const toggleStatus = async (item) => {
    try {
      const updated = await axios.put(
        `/api/news/${item._id}`,
        { ...item, status: !item.status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNews((prev) =>
        prev.map((n) => (n._id === item._id ? updated.data : n))
      );

      showToast("Đã đổi trạng thái!");
    } catch {
      showToast("Không thể đổi trạng thái!", "error");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContent("");
    setStatus(true);
    setImageFiles([]);
    setExistingImages([]);
    setEditItem(null);
  };

  const filteredNews = useMemo(() => {
    return news.filter((n) => {
      const byTitle = n.title
        ?.toLowerCase()
        .includes(filterTitle.toLowerCase());

      const byStatus =
        filterStatus === ""
          ? true
          : filterStatus === "1"
          ? n.status === true
          : n.status === false;

      return byTitle && byStatus;
    });
  }, [news, filterTitle, filterStatus]);

  const handlePickImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles((prev) => [...prev, ...files]);
    e.target.value = null;
  };

  const removeNewImage = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ============================
        RENDER
  ============================== */
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <Toast message={toast.message} type={toast.type} />

      {/* HEADER */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 pt-[96px] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-500 mb-2">
              Admin panel
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-1">
              Quản lý tin tức
            </h1>
            <p className="text-sm md:text-base text-emerald-900/80 max-w-xl">
              Tạo, chỉnh sửa và quản lý các tin tức hiển thị trên trang cho
              khách hàng.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl bg-emerald-600 text-white text-sm font-semibold shadow-md hover:bg-emerald-700 transition-colors"
          >
            <span className="mr-2 text-lg">＋</span> Thêm tin mới
          </button>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* CREATE POPUP */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[80px] px-4"
            onClick={() => setShowModal(false)}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative bg-white p-6 rounded-2xl shadow-2xl w-full max-w-3xl border border-emerald-50 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-500">
                    Tạo mới
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Tạo tin tức mới
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Thêm bài viết mới để hiển thị cho người dùng.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <input
                  className="w-full border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none px-3 py-2.5 rounded-xl"
                  placeholder="Tiêu đề"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                  className="w-full border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none px-3 py-2.5 rounded-xl"
                  placeholder="Mô tả ngắn"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ảnh minh hoạ
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePickImages}
                    className="border border-dashed border-gray-300 hover:border-emerald-400 transition-colors px-3 py-2.5 rounded-xl w-full text-xs"
                  />
                  {imageFiles.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {imageFiles.map((file, idx) => (
                        <div key={idx} className="relative">
                          <button
                            onClick={() => removeNewImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center shadow hover:bg-red-700"
                          >
                            ×
                          </button>

                          <img
                            src={URL.createObjectURL(file)}
                            className="w-32 h-24 object-cover rounded-xl border border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <textarea
                  className="w-full border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none px-3 py-2.5 rounded-xl"
                  placeholder="Nội dung (có thể là HTML đã format sẵn)"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={status}
                      onChange={(e) => setStatus(e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-800">
                      Hiển thị tin tức (Bật / Tắt)
                    </span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={createNews}
                      className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                    >
                      Lưu tin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT POPUP */}
        {showEdit && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[80px] px-4"
            onClick={() => setShowEdit(false)}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative bg-white p-6 rounded-2xl shadow-2xl w-full max-w-3xl border border-emerald-50 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-500">
                    Chỉnh sửa
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Chỉnh sửa tin tức
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Cập nhật nội dung và hình ảnh cho bài viết hiện tại.
                  </p>
                </div>
                <button
                  onClick={() => setShowEdit(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <input
                  className="w-full border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none px-3 py-2.5 rounded-xl"
                  placeholder="Tiêu đề"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                  className="w-full border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none px-3 py-2.5 rounded-xl"
                  rows={2}
                  placeholder="Mô tả ngắn"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Thêm ảnh mới
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePickImages}
                    className="border border-dashed border-gray-300 hover:border-emerald-400 transition-colors px-3 py-2.5 rounded-xl w-full text-xs"
                  />
                </div>

                {/* Existing images */}
                {existingImages.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Ảnh hiện tại
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {existingImages.map((url, idx) => (
                        <div key={idx} className="relative">
                          <button
                            onClick={() => removeExistingImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center shadow hover:bg-red-700"
                          >
                            ×
                          </button>

                          <img
                            src={fixPath(url)}
                            className="w-32 h-24 object-cover rounded-xl border border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New images */}
                {imageFiles.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Ảnh mới thêm
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {imageFiles.map((file, idx) => (
                        <div key={idx} className="relative">
                          <button
                            onClick={() => removeNewImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center shadow hover:bg-red-700"
                          >
                            ×
                          </button>

                          <img
                            src={URL.createObjectURL(file)}
                            className="w-32 h-24 object-cover rounded-xl border border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  className="w-full border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none px-3 py-2.5 rounded-xl"
                  rows={6}
                  placeholder="Nội dung"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={status}
                      onChange={(e) => setStatus(e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-800">
                      Hiển thị tin tức (Bật / Tắt)
                    </span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEdit(false)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={updateNews}
                      className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                    >
                      Cập nhật
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Tiêu đề
              </label>
              <input
                className="border border-gray-200 px-3 py-2.5 w-full rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                value={filterTitle}
                onChange={(e) => setFilterTitle(e.target.value)}
                placeholder="Tìm theo tiêu đề"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Trạng thái
              </label>
              <select
                className="border border-gray-200 px-3 py-2.5 w-full rounded-xl bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="1">Bật</option>
                <option value="0">Tắt</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={loadNews}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm"
              >
                Tải lại
              </button>

              <button
                onClick={() => {
                  setFilterTitle("");
                  setFilterStatus("");
                }}
                className="px-5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 hover:bg-gray-100"
              >
                Xoá lọc
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-emerald-50/70 border-b border-gray-200">
              <tr className="text-gray-700">
                <th className="p-3 w-36 text-left font-semibold">Hình ảnh</th>
                <th className="p-3 text-left font-semibold">Tiêu đề</th>
                <th className="p-3 w-32 text-left font-semibold">Trạng thái</th>
                <th className="p-3 w-40 text-left font-semibold">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filteredNews.map((item) => {
                  const firstImg =
                    item.thumbnail ||
                    item.images?.[0] ||
                    "https://via.placeholder.com/160x120?text=No+Image";

                  return (
                    <tr
                      key={item._id}
                      className="border-t border-gray-100 hover:bg-emerald-50/40"
                    >
                      <td className="p-3 align-top">
                        <img
                          src={fixPath(firstImg)}
                          className="w-28 h-20 object-cover rounded-xl border border-gray-200"
                        />
                      </td>

                      <td className="p-3 align-top">
                        <p className="font-semibold text-gray-900 line-clamp-2">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </td>

                      <td className="p-3 align-top">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleStatus(item);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            item.status
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {item.status ? "Bật" : "Tắt"}
                        </button>
                      </td>

                      <td className="p-3 align-top">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700"
                          >
                            Sửa
                          </button>

                          <button
                            onClick={() => deleteNews(item._id)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-medium hover:bg-red-600"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && filteredNews.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="p-10 text-center text-gray-500 text-sm"
                  >
                    Chưa có tin tức nào.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan="4"
                    className="p-8 text-center text-gray-600 text-sm"
                  >
                    Đang tải tin tức...
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

export default AdminNewsPage;
