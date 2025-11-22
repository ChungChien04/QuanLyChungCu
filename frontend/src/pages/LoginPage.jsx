import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

        <button
          className="absolute right-5 top-5 text-gray-400 hover:text-black text-2xl"
          onClick={() => navigate("/")}
        >
          ×
        </button>

        <div className="p-10 flex flex-col justify-center">

          <h2 className="text-3xl font-bold text-gray-900">
            Chào mừng bạn đến với
          </h2>

          <h2 className="text-3xl font-bold text-green-700 mb-8">
            SMARTBUILDING
          </h2>

          <h3 className="text-lg font-semibold mb-4">Đăng nhập</h3>

          {message && (
            <div
              className={`p-3 rounded-lg mb-4 text-sm text-center ${
                message.includes("thành công")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="email"
              placeholder="Email hoặc Số điện thoại"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Mật khẩu"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex justify-between text-sm text-gray-600">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="w-4 h-4" />
                <span>Ghi nhớ tôi</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-green-700 font-medium hover:underline"
              >
                Quên mật khẩu
              </Link>
            </div>

            <button
              disabled={loading}
              className="w-full py-3 bg-green-700 text-white rounded-full font-semibold hover:bg-green-800 transition"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>

            {/* ⭐⭐ GOOGLE LOGIN BUTTON ⭐⭐ */}
            <div className="flex items-center justify-center mt-4">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "http://localhost:5000/api/auth/google";
                }}
                className="w-full flex items-center justify-center gap-3 py-3 
                           border rounded-full text-gray-700 font-medium 
                           hover:bg-gray-50 transition"
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

          <p className="text-center mt-6 text-sm text-gray-600">
            Bạn chưa có tài khoản?{" "}
            <Link
              className="text-green-700 font-bold hover:underline"
              to="/register"
            >
              Đăng ký ngay
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

export default LoginPage;
