import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // ⭐ Hiện/ẩn mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ⭐ Regex mật khẩu mạnh: ≥6, có chữ, có số, có IN HOA, có ký tự đặc biệt
  const strongPassword =
    /^(?=.*[A-Za-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|:;"'<>,.?/]).{6,}$/;

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    if (e.target.name === "password") {
      const value = e.target.value;

      if (value.length < 6) {
        setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      } else if (!/[A-Za-z]/.test(value)) {
        setPasswordError("Mật khẩu phải chứa ít nhất 1 chữ cái");
      } else if (!/[A-Z]/.test(value)) {
        setPasswordError("Mật khẩu phải chứa ít nhất 1 chữ IN HOA");
      } else if (!/\d/.test(value)) {
        setPasswordError("Mật khẩu phải chứa ít nhất 1 số");
      } else if (!/[!@#$%^&*()_+\-={}[\]|:;"'<>,.?/]/.test(value)) {
        setPasswordError("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt");
      } else {
        setPasswordError("");
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // ⭐ Check final
    if (!strongPassword.test(form.password)) {
      setPasswordError(
        "Mật khẩu phải ≥6 ký tự, có chữ cái, chữ IN HOA, số và ký tự đặc biệt"
      );
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Mật khẩu xác nhận không trùng khớp!");
      setLoading(false);
      return;
    }

    try {
      await axios.post("/api/auth/register/request", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("reg_name", form.name);
      localStorage.setItem("reg_email", form.email);
      localStorage.setItem("reg_password", form.password);

      setMessage("OTP đã được gửi về email!");

      setTimeout(() => {
        navigate(`/verify-otp?email=${form.email}&flow=register`);
      }, 900);
    } catch (err) {
      setMessage(err.response?.data?.message || "Lỗi gửi OTP!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center px-4 z-50">

      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative">

        <button
          className="absolute right-5 top-5 text-gray-400 hover:text-black text-2xl"
          onClick={() => navigate("/")}
        >
          ×
        </button>

        {/* LEFT FORM */}
        <div className="p-10 flex flex-col justify-center">

          <h2 className="text-3xl font-bold text-gray-900">Chào mừng bạn đến với</h2>
          <h2 className="text-3xl font-bold text-green-700 mb-8">SMARTBUILDING</h2>

          <h3 className="text-lg font-semibold mb-4">Đăng ký tài khoản</h3>

          {message && (
            <div
              className={`p-3 rounded-lg mb-4 text-sm text-center ${
                message.includes("OTP")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            <input
              type="text"
              name="name"
              placeholder="Họ và tên"
              required
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-300"
              onChange={onChange}
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-300"
              onChange={onChange}
            />

            {/* PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mật khẩu"
                required
                className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-green-300 ${
                  passwordError ? "border-red-500" : ""
                }`}
                onChange={onChange}
              />

             <button
  type="button"
  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
  onClick={() => setShowPassword(!showPassword)}
  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
>
  {showPassword ? (
    <EyeIcon className="w-5 h-5" />
  ) : (
    <EyeSlashIcon className="w-5 h-5" />
  )}
</button>

              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Xác nhận mật khẩu"
                required
                className="w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-green-300"
                onChange={onChange}
              />

              <button
  type="button"
  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
>
  {showConfirmPassword ? (
    <EyeIcon className="w-5 h-5" />
  ) : (
    <EyeSlashIcon className="w-5 h-5" />
  )}
</button>

            </div>

            <button
              disabled={loading}
              className="w-full py-3 bg-green-700 text-white rounded-full font-semibold hover:bg-green-800 transition disabled:bg-green-300"
            >
              {loading ? "Đang gửi OTP..." : "Gửi mã OTP"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Bạn đã có tài khoản?{" "}
            <Link className="text-green-700 font-bold hover:underline" to="/login">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        <div className="hidden lg:block bg-gray-100">
          <img
            src="https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1200&q=60"
            alt="Apartment"
            className="w-full h-full object-cover rounded-r-3xl"
          />
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
