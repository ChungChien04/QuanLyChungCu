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
      className={`fixed bottom-6 right-6 px-4 py-2 rounded-xl text-white shadow-lg z-50
        ${type === "success" ? "bg-green-600" : "bg-red-600"}`}
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

  /* ============================
        FIX ĐƯỜNG DẪN ẢNH
  ============================== */
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

    // ⭐ FIX QUAN TRỌNG: CHUẨN HÓA ẢNH CŨ THÀNH STRING[]
    setExistingImages(
      Array.isArray(item.images)
        ? item.images.map((img) =>
            typeof img === "string"
              ? img
              : img?.url || img?.path || ""
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
    if (!title.trim()) return showToast("Tiêu đề không được để trống!", "error");
    if (!content.trim()) return showToast("Nội dung không được để trống!", "error");

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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Toast message={toast.message} type={toast.type} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Tin tức</h1>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-green-700 text-white rounded-xl shadow hover:bg-green-800"
        >
          + Thêm mới
        </button>
      </div>

      {/* CREATE POPUP */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-3 text-xl"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold mb-4">Tạo tin mới</h2>

            <div className="space-y-4">
              <input
                className="w-full border p-3 rounded-xl"
                placeholder="Tiêu đề"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <textarea
                className="w-full border p-3 rounded-xl"
                placeholder="Mô tả"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePickImages}
                className="border p-2 rounded-xl w-full"
              />

              {imageFiles.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {imageFiles.map((file, idx) => (
                    <div key={idx} className="relative">
                      <button
                        onClick={() => removeNewImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center shadow"
                      >
                        ×
                      </button>

                      <img
                        src={URL.createObjectURL(file)}
                        className="w-32 h-24 object-cover rounded-xl border"
                      />
                    </div>
                  ))}
                </div>
              )}

              <textarea
                className="w-full border p-3 rounded-xl"
                placeholder="Nội dung"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <button
                onClick={createNews}
                className="px-5 py-2 bg-green-600 text-white rounded-lg"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT POPUP */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl relative">
            <button
              onClick={() => setShowEdit(false)}
              className="absolute right-4 top-3 text-xl"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold mb-4">Chỉnh sửa tin</h2>

            <div className="space-y-4">
              <input
                className="w-full border p-3 rounded-xl"
                placeholder="Tiêu đề"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <textarea
                className="w-full border p-3 rounded-xl"
                rows={2}
                placeholder="Mô tả"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePickImages}
                className="border p-2 rounded-xl w-full"
              />

              {/* Existing images */}
              {existingImages.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {existingImages.map((url, idx) => (
                    <div key={idx} className="relative">
                      <button
                        onClick={() => removeExistingImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center shadow"
                      >
                        ×
                      </button>

                      <img
                        src={fixPath(url)}
                        className="w-32 h-24 object-cover rounded-xl border"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* New images */}
              {imageFiles.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {imageFiles.map((file, idx) => (
                    <div key={idx} className="relative">
                      <button
                        onClick={() => removeNewImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center shadow"
                      >
                        ×
                      </button>

                      <img
                        src={URL.createObjectURL(file)}
                        className="w-32 h-24 object-cover rounded-xl border"
                      />
                    </div>
                  ))}
                </div>
              )}

              <textarea
                className="w-full border p-3 rounded-xl"
                rows={6}
                placeholder="Nội dung"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <button
                onClick={updateNews}
                className="px-5 py-2 bg-green-700 text-white rounded-lg"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm">Tiêu đề</label>
            <input
              className="border px-3 py-2.5 w-full rounded-xl"
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">Trạng thái</label>
            <select
              className="border px-3 py-2.5 w-full rounded-xl"
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
              className="px-5 py-2.5 bg-green-700 text-white rounded-xl"
            >
              Lọc
            </button>

            <button
              onClick={() => {
                setFilterTitle("");
                setFilterStatus("");
              }}
              className="px-5 py-2.5 bg-gray-100 rounded-xl"
            >
              Xoá lọc
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50">
            <tr className="text-gray-700 text-sm">
              <th className="p-3 w-36">Hình ảnh</th>
              <th className="p-3">Tiêu đề</th>
              <th className="p-3 w-32">Trạng thái</th>
              <th className="p-3 w-40">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              filteredNews.map((item, idx) => {
                const firstImg =
                  item.images?.[0] ||
                  item.thumbnail ||
                  "https://via.placeholder.com/160x120?text=No+Image";

                return (
                  <tr
                    key={item._id}
                    className={`border-b ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-3">
                      <img
                        src={fixPath(firstImg)}
                        className="w-28 h-20 object-cover rounded-lg"
                      />
                    </td>

                    <td className="p-3">
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </td>

                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleStatus(item);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {item.status ? "Bật" : "Tắt"}
                      </button>
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="px-3 py-1.5 bg-green-700 text-white rounded-lg text-sm"
                        >
                          Sửa
                        </button>

                        <button
                          onClick={() => deleteNews(item._id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm"
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
                <td colSpan="4" className="p-10 text-center text-gray-500">
                  Chưa có tin tức nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminNewsPage;
