import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Ẩn / hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { data } = await axios.post("/api/auth/login", {
        email,
        password,
      });

      setMessage("Đăng nhập thành công. Đang chuyển hướng...");

      login(data, () => {
        navigate("/", { replace: true });
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center px-4 z-50">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative">

        {/* Nút đóng */}
        <button
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={() => navigate("/")}
        >
          ×
        </button>

        {/* Form bên trái */}
        <div className="p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Chào mừng bạn đến với
          </h2>

          <h2 className="text-3xl font-extrabold text-emerald-700 mb-8 tracking-tight">
            SMARTBUILDING
          </h2>

          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Đăng nhập tài khoản
          </h3>

          {message && (
            <div
              className={`p-3 rounded-xl mb-4 text-sm text-center border ${
                message.includes("thành công")
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL */}
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 
                  focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-500 outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* PASSWORD + ẨN/HIỆN */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-gray-50 
                  focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-500 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            </div>

            {/* Ghi nhớ + Quên mật khẩu */}
            <div className="flex justify-between text-sm text-gray-600">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-emerald-600"
                />
                <span>Ghi nhớ tôi</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-emerald-700 font-medium hover:underline"
              >
                Quên mật khẩu
              </Link>
            </div>

            {/* Nút đăng nhập */}
            <button
              disabled={loading}
              className="w-full py-3 rounded-full text-white font-semibold shadow-md transition
                bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>

            {/* Đăng nhập với Google */}
            <div className="flex items-center justify-center mt-4">
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "http://localhost:5000/api/auth/google";
                }}
                className="w-full flex items-center justify-center gap-3 py-3 
                           border rounded-full text-gray-700 font-medium 
                           hover:bg-gray-100 transition"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-6 h-6"
                />
                Đăng nhập với Google
              </button>
            </div>
          </form>

          {/* Link đăng ký */}
          <p className="text-center mt-6 text-sm text-gray-600">
            Bạn chưa có tài khoản?{" "}
            <Link
              className="text-emerald-700 font-semibold hover:underline"
              to="/register"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* Ảnh bên phải */}
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

export default LoginPage;
