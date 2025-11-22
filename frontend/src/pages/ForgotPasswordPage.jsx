import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await axios.post("/api/auth/forgot-password", { email });

      setMessage("OTP đã được gửi về email!");

      // ⭐ Điều hướng đúng flow reset-password
      setTimeout(() => {
        navigate(
          `/verify-otp?email=${encodeURIComponent(email)}&flow=reset-password`
        );
      }, 900);

    } catch (error) {
      setMessage(
        error.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center px-4 z-50">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative">

        <button onClick={() => navigate("/")} className="absolute right-5 top-5 text-gray-400 text-2xl">×</button>

        <div className="p-10 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-center">Quên mật khẩu</h1>

          <p className="text-gray-600 text-center mt-2 mb-6">
            Nhập email để nhận mã OTP
          </p>

          {message && (
            <div className={`p-3 mb-6 rounded-lg text-center text-sm font-medium ${
              message.includes("OTP")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              required
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 border rounded-xl"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-white bg-green-700"
            >
              {loading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Đã nhớ mật khẩu?{" "}
            <Link to="/login" className="text-green-700 font-medium">Đăng nhập</Link>
          </p>
        </div>

        <div className="hidden lg:block bg-gray-100">
          <img
            src="https://images.unsplash.com/photo-1501183638710-841dd1904471"
            alt="forgot"
            className="w-full h-full object-cover"
          />
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
