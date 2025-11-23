import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/apartments";

export default function AdminApartmentPage() {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

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

  // Ảnh upload mới
  const [images, setImages] = useState([]);

  // Preview để UI hiển thị
  const [previewImages, setPreviewImages] = useState([]);

  // Ảnh cũ (để gửi lên backend)
  const [oldImages, setOldImages] = useState([]);

  const token = localStorage.getItem("userToken");
  const axiosAuth = axios.create({
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchApartments = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}?page=${page}&limit=6`);
      setApartments(res.data.apartments);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.currentPage);
    } catch {
      alert("Lỗi tải căn hộ!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  const onChangeForm = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const onChangeImages = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    setPreviewImages((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removePreviewImage = (index) => {
    const removed = previewImages[index];

    setPreviewImages((prev) => prev.filter((_, i) => i !== index));

    // XÓA ẢNH CŨ
    setOldImages((prev) => prev.filter((img) => getImageUrl(img) !== removed));

    // XÓA ẢNH MỚI
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

  try {
    const fd = new FormData();

    Object.entries(form).forEach(([key, value]) => fd.append(key, value));

    if (form.utilities.trim() !== "") {
      fd.set(
        "utilities",
        JSON.stringify(form.utilities.split(",").map((u) => u.trim()))
      );
    }

    // gửi danh sách ảnh cũ còn giữ lại
    fd.append("oldImages", JSON.stringify(oldImages));

    // gửi ảnh mới
    images.forEach((img) => fd.append("images", img));

    let res;
    if (editingId) {
      res = await axiosAuth.put(`${API_URL}/${editingId}`, fd);
      setApartments((prev) =>
        prev.map((a) => (a._id === editingId ? res.data : a))
      );

      // ❗ ĐÓNG MODAL TRƯỚC
      resetForm();
      setShowModal(false);

      // ❗ SAU 50ms mới hiện alert để tránh kẹt render
      setTimeout(() => {
        alert("Cập nhật thành công!");
      }, 50);

    } else {
      res = await axiosAuth.post(API_URL, fd);
      setApartments((prev) => [...prev, res.data]);

      resetForm();
      setShowModal(false);
      console.log("Cập nhật thành công!");
    }

  } catch (err) {
    console.log(err);
    alert("Lỗi lưu căn hộ!");
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

    // Ảnh mới reset
    setImages([]);

    // lưu ảnh cũ
    setOldImages(apt.images || []);

    // load preview ảnh cũ
    setPreviewImages(apt.images?.map((img) => getImageUrl(img)) || []);

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá căn hộ?")) return;

    try {
      await axiosAuth.delete(`${API_URL}/${id}`);
      setApartments((prev) => prev.filter((a) => a._id !== id));
    } catch {
      alert("Lỗi xoá căn hộ!");
    }
  };

  const getImageUrl = (img) =>
    img.startsWith("http")
      ? img
      : `http://localhost:5000/${img.replace(/\\/g, "/")}`;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Quản lý căn hộ</h1>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-green-700 text-white rounded-xl shadow hover:bg-green-800"
        >
          + Thêm mới
        </button>
      </div>

      {/* POPUP FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-4 relative">
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="absolute top-2 right-4 text-2xl hover:text-red-500"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-3">
              {editingId ? "Cập nhật căn hộ" : "Thêm căn hộ mới"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="title"
                value={form.title}
                onChange={onChangeForm}
                placeholder="Tên căn hộ"
                className="border p-2.5 rounded-xl"
                required
              />

              <input
                name="area"
                type="number"
                value={form.area}
                onChange={onChangeForm}
                placeholder="Diện tích (m²)"
                className="border p-2.5 rounded-xl"
                required
              />

              <input
                name="price"
                type="number"
                value={form.price}
                onChange={onChangeForm}
                placeholder="Giá thuê"
                className="border p-2.5 rounded-xl"
                required
              />

              <select
                name="status"
                value={form.status}
                onChange={onChangeForm}
                className="border p-2.5 rounded-xl"
              >
                <option value="available">Còn trống</option>
                <option value="rented">Đang thuê</option>
                <option value="sold">Đã bán</option>
              </select>

              <input
                name="bedrooms"
                type="number"
                value={form.bedrooms}
                onChange={onChangeForm}
                placeholder="Phòng ngủ"
                className="border p-2.5 rounded-xl"
              />

              <input
                name="bathrooms"
                type="number"
                value={form.bathrooms}
                onChange={onChangeForm}
                placeholder="Phòng vệ sinh"
                className="border p-2.5 rounded-xl"
              />

              <input
                name="address"
                value={form.address}
                onChange={onChangeForm}
                placeholder="Địa chỉ"
                className="border p-2.5 rounded-xl md:col-span-2"
              />

              <input
                name="floor"
                type="number"
                value={form.floor}
                onChange={onChangeForm}
                placeholder="Tầng"
                className="border p-2.5 rounded-xl"
              />

              <input
                name="utilities"
                value={form.utilities}
                onChange={onChangeForm}
                placeholder="Tiện ích (ngăn cách bằng dấu phẩy)"
                className="border p-2.5 rounded-xl md:col-span-2"
              />

              <textarea
                name="description"
                value={form.description}
                onChange={onChangeForm}
                placeholder="Mô tả căn hộ"
                className="border p-2.5 rounded-xl md:col-span-2"
              />

              {/* FEATURED */}
              <label className="flex items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={onChangeForm}
                />
                <span className="font-medium">Đặt làm căn hộ nổi bật</span>
              </label>

              {/* Ảnh */}
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium">Ảnh căn hộ:</label>

                <input
                  type="file"
                  multiple
                  onChange={onChangeImages}
                  className="border p-2.5 rounded-xl w-full"
                />

                {previewImages.length > 0 && (
                  <div className="flex gap-3 mt-3 flex-wrap">
                    {previewImages.map((src, i) => (
                      <div key={i} className="relative">
                        <button
                          onClick={() => removePreviewImage(i)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center shadow hover:bg-red-700"
                        >
                          ×
                        </button>
                        <img src={src} className="w-20 h-20 rounded-xl border object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                  className="px-4 py-2 border rounded-xl hover:bg-gray-100"
                >
                  Hủy
                </button>

                <button className="px-6 py-2 bg-green-700 text-white rounded-xl hover:bg-green-800">
                  {editingId ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="mt-10 bg-white rounded-2xl shadow-xl border overflow-x-auto">
        {loading ? (
          <p className="p-6 text-center">Đang tải...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-green-50">
                <th className="p-3 text-left">Tên</th>
                <th className="p-3 text-left">Diện tích</th>
                <th className="p-3 text-left">Giá</th>
                <th className="p-3 text-left">Trạng thái</th>
                <th className="p-3 text-left">Ảnh</th>
                <th className="p-3 text-left">Nổi bật</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {apartments.map((apt) => (
                <tr key={apt._id} className="border-t">
                  <td className="p-3">{apt.title}</td>
                  <td className="p-3">{apt.area} m²</td>
                  <td className="p-3">{apt.price.toLocaleString()} đ</td>
                  <td className="p-3">{apt.status}</td>

                  <td className="p-3">
                    <div className="flex gap-1">
                      {apt.images?.slice(0, 3).map((img, i) => (
                        <img
                          key={i}
                          src={getImageUrl(img)}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </td>

                  <td className="p-3">
                    {apt.featured ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                        ⭐ Có
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">
                        Không
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(apt)}
                      className="px-3 py-1 border rounded-xl hover:bg-gray-100"
                    >
                      Sửa
                    </button>

                    <button
                      onClick={() => handleDelete(apt._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-xl hover:bg-red-600"
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
        <div className="flex justify-center gap-2 p-6">
          <button
            disabled={currentPage === 1}
            onClick={() => fetchApartments(currentPage - 1)}
            className="px-3 py-1 border rounded-xl disabled:opacity-40 hover:bg-gray-100"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => fetchApartments(i + 1)}
              className={`px-3 py-1 border rounded-xl ${
                currentPage === i + 1 ? "bg-green-700 text-white" : "hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => fetchApartments(currentPage + 1)}
            className="px-3 py-1 border rounded-xl disabled:opacity-40 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
