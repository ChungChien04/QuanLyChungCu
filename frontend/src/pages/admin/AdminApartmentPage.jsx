import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/apartments";

/* ============================
   TOAST COMPONENT
============================ */
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

export default function AdminApartmentPage() {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [toast, setToast] = useState({ message: "", type: "success" });

  const [form, setForm] = useState({
    title: "",
    area: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    address: "",
    floor: "",
    utilities: "",
    description: "",
    status: "available",
    featured: false,
  });

  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [oldImages, setOldImages] = useState([]);

  const token = localStorage.getItem("userToken");
  const axiosAuth = axios.create({
    headers: { Authorization: `Bearer ${token}` },
  });

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: "", type }), 2000);
  };

  const fetchApartments = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}?page=${page}&limit=6`);
      setApartments(res.data.apartments);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.currentPage);
    } catch {
      showToast("Lỗi tải căn hộ!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  const onChangeForm = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const onChangeImages = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    setPreviewImages((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const getImageUrl = (img) =>
    img.startsWith("http")
      ? img
      : `http://localhost:5000/${img.replace(/\\/g, "/")}`;

  const removePreviewImage = (index) => {
    const removed = previewImages[index];

    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setOldImages((prev) => prev.filter((img) => getImageUrl(img) !== removed));
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setForm({
      title: "",
      area: "",
      price: "",
      bedrooms: "",
      bathrooms: "",
      address: "",
      floor: "",
      utilities: "",
      description: "",
      status: "available",
      featured: false,
    });

    setImages([]);
    setPreviewImages([]);
    setOldImages([]);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDATION CHUNG
    if (!form.title.trim())
      return showToast("Vui lòng nhập tên căn hộ!", "error");
    if (!form.area) return showToast("Vui lòng nhập diện tích!", "error");
    if (!form.price) return showToast("Vui lòng nhập giá!", "error");
    if (!form.bedrooms)
      return showToast("Vui lòng nhập số phòng ngủ!", "error");
    if (!form.bathrooms)
      return showToast("Vui lòng nhập số phòng vệ sinh!", "error");
    if (!form.address.trim())
      return showToast("Vui lòng nhập địa chỉ!", "error");
    if (!form.description.trim())
      return showToast("Vui lòng nhập mô tả!", "error");

    // VALIDATION THÊM MỚI
    if (!editingId && !form.floor) {
      return showToast("Vui lòng nhập tầng căn hộ!", "error");
    }
    if (!editingId && !form.utilities.trim()) {
      return showToast("Vui lòng nhập tiện ích căn hộ!", "error");
    }
    if (!editingId && images.length === 0) {
      return showToast("Vui lòng chọn ít nhất 1 ảnh căn hộ!", "error");
    }

    // VALIDATION SỬA
    if (editingId) {
      if (form.floor === "" || form.floor === null) {
        return showToast("Không được xoá trường Tầng!", "error");
      }
      if (form.utilities.trim() === "") {
        return showToast("Không được xoá trường Tiện ích!", "error");
      }
    }

    // CHECK: KHÔNG CÓ THAY ĐỔI
    if (editingId) {
      const old = apartments.find((a) => a._id === editingId);

      const hasChange =
        form.title !== old.title ||
        form.area != old.area ||
        form.price != old.price ||
        form.bedrooms != old.bedrooms ||
        form.bathrooms != old.bathrooms ||
        form.address !== old.location?.address ||
        form.floor != old.location?.floor ||
        form.utilities !== (old.utilities?.join(", ") || "") ||
        form.description !== old.description ||
        form.status !== old.status ||
        form.featured !== old.featured ||
        images.length > 0 ||
        JSON.stringify(oldImages) !== JSON.stringify(old.images || []);

      if (!hasChange) {
        return showToast("Bạn chưa thay đổi gì để cập nhật!", "error");
      }
    }

    try {
      const fd = new FormData();

      Object.entries(form).forEach(([key, value]) => fd.append(key, value));

      if (form.utilities.trim() !== "") {
        fd.set(
          "utilities",
          JSON.stringify(form.utilities.split(",").map((u) => u.trim()))
        );
      }

      fd.append("oldImages", JSON.stringify(oldImages));
      images.forEach((img) => fd.append("images", img));

      let res;

      if (editingId) {
        res = await axiosAuth.put(`${API_URL}/${editingId}`, fd);
        setApartments((prev) =>
          prev.map((a) => (a._id === editingId ? res.data : a))
        );
        showToast("Cập nhật căn hộ thành công!", "success");
      } else {
        res = await axiosAuth.post(API_URL, fd);
        setApartments((prev) => [...prev, res.data]);
        showToast("Thêm căn hộ thành công!", "success");
      }

      resetForm();
      setShowModal(false);
    } catch (err) {
      console.log(err);
      showToast("Lỗi lưu căn hộ!", "error");
    }
  };

  const handleEdit = (apt) => {
    setEditingId(apt._id);

    setForm({
      title: apt.title,
      area: apt.area,
      price: apt.price,
      bedrooms: apt.bedrooms,
      bathrooms: apt.bathrooms,
      address: apt.location?.address || "",
      floor: apt.location?.floor || "",
      utilities: apt.utilities?.join(", ") || "",
      description: apt.description,
      status: apt.status,
      featured: apt.featured || false,
    });

    setImages([]);
    setOldImages(apt.images || []);
    setPreviewImages(apt.images?.map((img) => getImageUrl(img)) || []);

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá căn hộ?")) return;

    try {
      await axiosAuth.delete(`${API_URL}/${id}`);
      setApartments((prev) => prev.filter((a) => a._id !== id));

      showToast("Đã xoá!", "success");
    } catch {
      showToast("Lỗi xoá căn hộ!", "error");
    }
  };

  const renderStatusBadge = (status) => {
    if (status === "available") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          Còn trống
        </span>
      );
    }
    if (status === "rented") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-100">
          Đang thuê
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
        Tạm khóa
      </span>
    );
  };

  // ====== THỐNG KÊ NHANH GIỐNG DASHBOARD HÓA ĐƠN ======
  const totalApts = apartments.length;
  const availableCount = apartments.filter((a) => a.status === "available")
    .length;
  const rentedCount = apartments.filter((a) => a.status === "rented").length;
  const reservedCount = apartments.filter((a) => a.status === "reserved").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <Toast message={toast.message} type={toast.type} />

      {/* HEADER ADMIN – hero giống Hóa đơn */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 pt-[96px] pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-500 mb-2">
            Admin panel
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-1 text-balance">
            Trung tâm quản lý danh sách căn hộ
          </h1>
          <p className="text-sm md:text-base text-emerald-900/80 max-w-2xl">
            Thêm, chỉnh sửa và quản lý trạng thái căn hộ để hiển thị chính xác
            cho khách hàng trên website.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* HÀNG ACTION + THỐNG KÊ (giống style invoice) */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-emerald-700">
                Dashboard /{" "}
              </span>
              <span className="font-semibold text-slate-900">
                Quản lý căn hộ
              </span>
            </div>

            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-emerald-600 text-white text-xs md:text-sm font-semibold shadow-md hover:bg-emerald-700 transition-colors"
            >
              <span className="mr-2 text-lg">＋</span> Thêm căn hộ mới
            </button>
          </div>

          {/* Cards thống kê */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm px-4 py-3.5">
              <p className="text-xs text-slate-500 mb-1">Tổng căn hộ</p>
              <p className="text-xl font-semibold text-emerald-800">
                {totalApts}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm px-4 py-3.5">
              <p className="text-xs text-emerald-700 mb-1">Còn trống</p>
              <p className="text-xl font-semibold text-emerald-700">
                {availableCount}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm px-4 py-3.5">
              <p className="text-xs text-yellow-700 mb-1">Đang thuê</p>
              <p className="text-xl font-semibold text-yellow-700">
                {rentedCount}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3.5">
              <p className="text-xs text-slate-600 mb-1">Tạm khóa</p>
              <p className="text-xl font-semibold text-slate-700">
                {reservedCount}
              </p>
            </div>
          </div>
        </section>

        {/* MODAL */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[80px] px-4"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-emerald-50 p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-500">
                    {editingId ? "Chỉnh sửa" : "Thêm mới"}
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingId ? "Cập nhật căn hộ" : "Thêm căn hộ mới"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Điền đầy đủ thông tin chi tiết để hiển thị căn hộ rõ ràng
                    với khách.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm"
              >
                <input
                  name="title"
                  value={form.title}
                  onChange={onChangeForm}
                  placeholder="Tên căn hộ"
                  className="border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none p-2.5 rounded-xl"
                  required
                />

                <input
                  name="area"
                  type="number"
                  value={form.area}
                  onChange={onChangeForm}
                  placeholder="Diện tích (m²)"
                  className="border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none p-2.5 rounded-xl"
                  required
                />

                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={onChangeForm}
                  placeholder="Giá thuê"
                  className="border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none p-2.5 rounded-xl"
                  required
                />

                <select
                  name="status"
                  value={form.status}
                  onChange={onChangeForm}
                  className="border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none p-2.5 rounded-xl bg-white"
                >
                  <option value="available">Còn trống</option>
                  <option value="rented">Đang thuê</option>
                  <option value="reserved">Tạm khóa</option>
                </select>

                <input
                  name="bedrooms"
                  type="number"
                  value={form.bedrooms}
                  onChange={onChangeForm}
                  placeholder="Số phòng ngủ"
                  className="border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none p-2.5 rounded-xl"
                />

                <input
                  name="bathrooms"
                  type="number"
                  value={form.bathrooms}
                  onChange={onChangeForm}
                  placeholder="Số phòng vệ sinh"
                  className="border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none p-2.5 rounded-xl"
                />

                <input
                  name="address"
                  value={form.address}
                  onChange={onChangeForm}
                  placeholder="Địa chỉ"
                  className="border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none p-2.5 rounded-xl md:col-span-2"
                />

                <input
                  name="floor"
                  type="number"
                  value={form.floor}
                  onChange={onChangeForm}
                  placeholder="Tầng"
                  className="border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none p-2.5 rounded-xl"
                />

                <input
                  name="utilities"
                  value={form.utilities}
                  onChange={onChangeForm}
                  placeholder="Tiện ích (ngăn cách bằng dấu phẩy)"
                  className="border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none p-2.5 rounded-xl md:col-span-2"
                />

                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChangeForm}
                  placeholder="Mô tả căn hộ"
                  className="border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none p-2.5 rounded-xl md:col-span-2 min-h-[80px]"
                />

                <label className="flex items-center gap-2 md:col-span-2 mt-1">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={form.featured}
                    onChange={onChangeForm}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-gray-800">
                    Đặt làm căn hộ nổi bật
                  </span>
                </label>

                <div className="md:col-span-2 mt-2">
                  <label className="block mb-1 font-medium text-gray-800">
                    Ảnh căn hộ
                  </label>

                  <input
                    type="file"
                    multiple
                    onChange={onChangeImages}
                    className="border border-dashed border-gray-300 hover:border-emerald-400 transition-colors p-2.5 rounded-xl w-full text-sm"
                  />

                  {previewImages.length > 0 && (
                    <div className="flex gap-3 mt-3 flex-wrap">
                      {previewImages.map((src, i) => (
                        <div key={i} className="relative">
                          <button
                            type="button"
                            onClick={() => removePreviewImage(i)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center shadow hover:bg-red-700"
                          >
                            ×
                          </button>
                          <img
                            src={src}
                            className="w-20 h-20 rounded-xl border border-gray-200 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 md:col-span-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowModal(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
                  >
                    Hủy
                  </button>

                  <button className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm">
                    {editingId ? "Cập nhật" : "Thêm mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="mt-4 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-x-auto">
          {loading ? (
            <p className="p-8 text-center text-gray-600 text-sm">
              Đang tải danh sách căn hộ...
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white">
                  <th className="p-3 text-left font-semibold bg-emerald-700 rounded-tl-2xl">
                    Tên
                  </th>
                  <th className="p-3 text-left font-semibold bg-emerald-700 border-l border-emerald-600">
                    Diện tích
                  </th>
                  <th className="p-3 text-left font-semibold bg-emerald-700 border-l border-emerald-600">
                    Giá
                  </th>
                  <th className="p-3 text-left font-semibold bg-emerald-700 border-l border-emerald-600">
                    Trạng thái
                  </th>
                  <th className="p-3 text-left font-semibold bg-emerald-700 border-l border-emerald-600">
                    Ảnh
                  </th>
                  <th className="p-3 text-left font-semibold bg-emerald-700 border-l border-emerald-600">
                    Nổi bật
                  </th>
                  <th className="p-3 text-right font-semibold bg-emerald-700 rounded-tr-2xl border-l border-emerald-600">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody>
                {apartments.map((apt) => (
                  <tr
                    key={apt._id}
                    className="border-t border-gray-100 hover:bg-emerald-50/40"
                  >
                    <td className="p-3 align-top bg-white">
                      <p className="font-medium text-gray-900 line-clamp-2">
                        {apt.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {apt.location?.address}
                      </p>
                    </td>

                    <td className="p-3 align-top text-gray-700 bg-white">
                      {apt.area} m²
                    </td>

                    <td className="p-3 align-top text-emerald-700 font-semibold bg-white">
                      {apt.price.toLocaleString()} đ
                    </td>

                    <td className="p-3 align-top bg-white">
                      {renderStatusBadge(apt.status)}
                    </td>

                    <td className="p-3 align-top bg-white">
                      <div className="flex gap-1">
                        {apt.images?.slice(0, 3).map((img, i) => (
                          <img
                            key={i}
                            src={getImageUrl(img)}
                            className="w-12 h-12 object-cover rounded-xl border border-gray-200"
                          />
                        ))}
                      </div>
                    </td>

                    <td className="p-3 align-top bg-white">
                      {apt.featured ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-100">
                          ⭐ Nổi bật
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                          Không
                        </span>
                      )}
                    </td>

                    <td className="p-3 align-top text-right space-x-2 bg-white">
                      <button
                        onClick={() => handleEdit(apt)}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => handleDelete(apt._id)}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl bg-red-500 text-xs font-medium text-white hover:bg-red-600"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* PAGINATION */}
          <div className="flex justify-center gap-2 p-6 border-t border-gray-100 bg-white rounded-b-2xl">
            <button
              disabled={currentPage === 1}
              onClick={() => fetchApartments(currentPage - 1)}
              className="px-3 py-1.5 rounded-full border border-gray-200 text-xs md:text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => fetchApartments(i + 1)}
                className={`px-3 py-1.5 rounded-full border text-xs md:text-sm ${
                  currentPage === i + 1
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => fetchApartments(currentPage + 1)}
              className="px-3 py-1.5 rounded-full border border-gray-200 text-xs md:text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
