import React, { useEffect, useState } from "react";
import axios from "axios";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

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

  // Hiện/ẩn mật khẩu
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Lỗi mật khẩu mới
  const [passwordError, setPasswordError] = useState("");

  // ====================
  // VALIDATION PASSWORD
  // ====================
  const validatePassword = (password) => {
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự!";
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
    const { name, value } = e.target;
    setPassForm({ ...passForm, [name]: value });

    if (name === "newPassword") {
      const err = validatePassword(value);
      setPasswordError(err || "");
    }
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

    try {
      await uploadAvatar();

      const token = localStorage.getItem("userToken");

      const payload = {
        name: form.name,
        phone: form.phone,
        address: form.address,
        gender: form.gender,
        birthday: form.birthday,
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

  const handleChangePassword = async (e) => {
    e.preventDefault();

    const { oldPassword, newPassword, confirmPassword } = passForm;

    if (!oldPassword || !newPassword || !confirmPassword)
      return alert("Vui lòng nhập đầy đủ thông tin!");

    if (newPassword !== confirmPassword)
      return alert("Mật khẩu mới và xác nhận không trùng khớp!");

    const error = validatePassword(newPassword);
    if (error) {
      setPasswordError(error);
      return;
    }

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
      setPasswordError("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* HERO HEADER giống các trang khác */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-4xl mx-auto px-6 pt-[96px] pb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-emerald-700 mb-2">
            Hồ sơ cá nhân
          </h1>
          <p className="text-sm md:text-base text-emerald-900/80 max-w-xl">
            Quản lý thông tin, liên hệ và mật khẩu tài khoản SMARTBUILDING của
            bạn tại đây.
          </p>
        </div>
      </section>

      {/* CARD CHÍNH */}
      <div className="max-w-4xl mx-auto px-6 py-10 -mt-4">
        <div className="bg-white shadow-xl rounded-3xl border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-8">
          {/* CỘT TRÁI: AVATAR + THÔNG TIN TÓM TẮT */}
          <div className="md:w-1/3 flex flex-col items-center md:items-start gap-4">
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
                className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover shadow-md border border-emerald-50"
              />

              <label className="absolute bottom-1 right-1 bg-emerald-600 text-white px-2 py-1 rounded-full text-[11px] cursor-pointer shadow-md hover:bg-emerald-700">
                Đổi ảnh
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div className="text-center md:text-left space-y-1">
              <p className="text-base font-semibold text-gray-900">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 break-all">{user.email}</p>
              <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-medium text-emerald-700 uppercase tracking-wide">
                Cư dân SMARTBUILDING
              </span>
            </div>
          </div>

          {/* CỘT PHẢI: TABS + FORM */}
          <div className="md:w-2/3">
            {/* Tabs */}
            <div className="flex mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-3 text-center text-sm md:text-base font-semibold transition border-b-2 ${
                  activeTab === "profile"
                    ? "text-emerald-700 border-emerald-600"
                    : "text-gray-500 border-transparent hover:text-emerald-600"
                }`}
              >
                Thông tin cá nhân
              </button>

              <button
                onClick={() => setActiveTab("password")}
                className={`flex-1 py-3 text-center text-sm md:text-base font-semibold transition border-b-2 ${
                  activeTab === "password"
                    ? "text-emerald-700 border-emerald-600"
                    : "text-gray-500 border-transparent hover:text-emerald-600"
                }`}
              >
                Đổi mật khẩu
              </button>
            </div>

            {/* TAB PROFILE */}
            {activeTab === "profile" && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Field
                  label="Họ tên"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
                <Field
                  label="Số điện thoại"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
                <Field
                  label="Địa chỉ"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 text-sm">
                      Giới tính
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full p-3 border rounded-xl bg-gray-50 
                        focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 
                        outline-none transition text-sm"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>

                  <Field
                    label="Ngày sinh"
                    name="birthday"
                    type="date"
                    value={form.birthday}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-emerald-700 transition"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu thông tin"}
                </button>
              </form>
            )}

            {/* TAB CHANGE PASSWORD */}
            {activeTab === "password" && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Mật khẩu cũ */}
                <div>
                  <label className="block font-semibold text-sm mb-1 text-gray-700">
                    Mật khẩu cũ
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      name="oldPassword"
                      value={passForm.oldPassword}
                      onChange={handlePassChange}
                      className="w-full px-4 py-3 pr-12 border rounded-xl bg-gray-50 
                        focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 
                        outline-none transition text-sm"
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() =>
                        setShowOldPassword(!showOldPassword)
                      }
                      aria-label={
                        showOldPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                    >
                      {showOldPassword ? (
                        <EyeIcon className="w-5 h-5" />
                      ) : (
                        <EyeSlashIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label className="block font-semibold text-sm mb-1 text-gray-700">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passForm.newPassword}
                      onChange={handlePassChange}
                      className={`w-full px-4 py-3 pr-12 border rounded-xl bg-gray-50 
                        focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 
                        outline-none transition text-sm ${
                          passwordError ? "border-red-500" : ""
                        }`}
                      placeholder="Nhập mật khẩu mới"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() =>
                        setShowNewPassword(!showNewPassword)
                      }
                      aria-label={
                        showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                    >
                      {showNewPassword ? (
                        <EyeIcon className="w-5 h-5" />
                      ) : (
                        <EyeSlashIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-red-500 text-xs mt-1">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div>
                  <label className="block font-semibold text-sm mb-1 text-gray-700">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passForm.confirmPassword}
                      onChange={handlePassChange}
                      className="w-full px-4 py-3 pr-12 border rounded-xl bg-gray-50 
                        focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 
                        outline-none transition text-sm"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="w-5 h-5" />
                      ) : (
                        <EyeSlashIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-emerald-700 transition"
                >
                  Đổi mật khẩu
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

/* INPUT REUSE */
const Field = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block font-semibold text-sm mb-1 text-gray-700">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full p-3 border rounded-xl bg-gray-50 
        focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 
        outline-none transition text-sm"
    />
  </div>
);
