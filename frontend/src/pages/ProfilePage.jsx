import React, { useEffect, useState } from "react";
import axios from "axios";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  // Tab: "profile" | "password"
  const [activeTab, setActiveTab] = useState("profile");

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Thông tin cá nhân
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    gender: "",
    birthday: "",
  });

  // Đổi mật khẩu
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ====================
  // VALIDATION PASSWORD
  // ====================
  const validatePassword = (password) => {
    if (password.length < 6)
      return "Mật khẩu phải có ít nhất 6 ký tự!";
    if (!/[A-Z]/.test(password))
      return "Mật khẩu phải chứa ít nhất 1 chữ cái in hoa!";
    if (!/[a-z]/.test(password))
      return "Mật khẩu phải chứa ít nhất 1 chữ cái thường!";
    if (!/[0-9]/.test(password))
      return "Mật khẩu phải chứa ít nhất 1 chữ số!";
    if (!/[^A-Za-z0-9]/.test(password))
      return "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt!";
    return null;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const { data } = await axios.get("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(data);

        setForm({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
          gender: data.gender || "",
          birthday: data.birthday ? data.birthday.substring(0, 10) : "",
        });

        setAvatarPreview(data.avatar || null);
      } catch (error) {
        console.error("Lỗi khi lấy profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePassChange = (e) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;

    try {
      const token = localStorage.getItem("userToken");
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const { data } = await axios.put(
        "/api/auth/profile/avatar",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.avatar) {
        setAvatarPreview(data.avatar);
        setUser((prev) =>
          prev ? { ...prev, avatar: data.avatar } : prev
        );
      }
    } catch (error) {
      console.error("Lỗi upload avatar:", error);
    }
  };

const handleUpdateProfile = async (e) => {
  e.preventDefault();
  setSaving(true);

  // ==========================
  // VALIDATION THEO YÊU CẦU
  // ==========================

  if (!form.name.trim()) {
    setSaving(false);
    return alert("Vui lòng nhập họ tên!");
  }

  if (!form.phone.trim()) {
    setSaving(false);
    return alert("Vui lòng nhập số điện thoại!");
  }

  if (!/^[0-9]{9,11}$/.test(form.phone)) {
    setSaving(false);
    return alert("Số điện thoại không hợp lệ! (9–11 số)");
  }

  if (!form.address.trim()) {
    setSaving(false);
    return alert("Vui lòng nhập địa chỉ!");
  }

  // ❌ gender & birthday KHÔNG bắt buộc – không validate

  try {
    await uploadAvatar();

    const token = localStorage.getItem("userToken");

    const payload = {
      name: form.name,
      phone: form.phone,
      address: form.address,
      gender: form.gender,       // vẫn gửi nếu có chọn
      birthday: form.birthday,   // vẫn gửi nếu có chọn
    };

    const { data } = await axios.put("/api/auth/profile", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    setUser(data.user);
    alert("Cập nhật thông tin thành công!");

  } catch (err) {
    console.error("Lỗi update profile:", err);
    alert("Không thể cập nhật thông tin!");
  } finally {
    setSaving(false);
  }
};


  // ==========================
  // Đổi mật khẩu (FULL LOGIN RULE)
  // ==========================
  const handleChangePassword = async (e) => {
    e.preventDefault();

    const { oldPassword, newPassword, confirmPassword } = passForm;

    if (!oldPassword || !newPassword || !confirmPassword)
      return alert("Vui lòng nhập đầy đủ thông tin!");

    if (newPassword !== confirmPassword)
      return alert("Mật khẩu mới và xác nhận không trùng khớp!");

    const error = validatePassword(newPassword);
    if (error) return alert(error);

    try {
      const token = localStorage.getItem("userToken");

      const { data } = await axios.put(
        "/api/auth/change-password",
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(data.message || "Đổi mật khẩu thành công!");

      setPassForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Change password error:", error);
      alert("Đổi mật khẩu thất bại!");
    }
  };

  if (loading) return <div className="text-center p-4">Đang tải...</div>;
  if (!user)
    return (
      <div className="text-center text-red-500 p-4">
        Không lấy được thông tin người dùng.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-6">
      <div className="max-w-xl w-full bg-white shadow-xl rounded-3xl p-8">

        <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">
          Hồ Sơ Cá Nhân
        </h1>

        {/* Tabs */}
        <div className="flex mb-8 border-b">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 text-center font-semibold ${
              activeTab === "profile"
                ? "text-green-800 border-b-4 border-green-800"
                : "text-gray-500"
            }`}
          >
            Thông tin cá nhân
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={`flex-1 py-3 text-center font-semibold ${
              activeTab === "password"
                ? "text-green-800 border-b-4 border-green-800"
                : "text-gray-500"
            }`}
          >
            Đổi mật khẩu
          </button>
        </div>

        {/* TAB PROFILE */}
        {activeTab === "profile" && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <img
                  src={
                    avatarPreview
                      ? avatarPreview.startsWith("blob:")
                        ? avatarPreview
                        : `http://localhost:5000${avatarPreview}`
                      : "/default-avatar.png"
                  }
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover shadow-md border"
                />

                <label className="absolute bottom-1 right-1 bg-green-600 text-white px-2 py-1 rounded text-xs cursor-pointer shadow">
                  Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>

            <Field label="Họ tên" name="name" value={form.name} onChange={handleChange} />
            <Field label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} />
            <Field label="Địa chỉ" name="address" value={form.address} onChange={handleChange} />

            <div>
              <label className="block font-semibold mb-1 text-gray-700">Giới tính</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl bg-gray-50"
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <Field label="Ngày sinh" name="birthday" type="date" value={form.birthday} onChange={handleChange} />

            <button
              type="submit"
              className="w-full bg-green-800 text-white py-3 rounded-xl font-semibold shadow hover:bg-green-800 transition"
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </form>
        )}

        {/* TAB CHANGE PASSWORD */}
        {activeTab === "password" && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Field label="Mật khẩu cũ" name="oldPassword" type="password" value={passForm.oldPassword} onChange={handlePassChange} />
            <Field label="Mật khẩu mới" name="newPassword" type="password" value={passForm.newPassword} onChange={handlePassChange} />
            <Field label="Xác nhận mật khẩu mới" name="confirmPassword" type="password" value={passForm.confirmPassword} onChange={handlePassChange} />

            <button
              type="submit"
              className="w-full bg-green-800 text-white py-3 rounded-xl font-semibold shadow hover:bg-red-700 transition"
            >
              Đổi mật khẩu
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;

/* COMPONENT REUSE */
const Field = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block font-semibold text-sm mb-1 text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full p-3 border rounded-xl bg-gray-50 
        focus:border-green-500 focus:ring-2 focus:ring-green-200 
        outline-none transition"
    />
  </div>
);
