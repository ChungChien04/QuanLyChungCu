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

      setTimeout(() => {
        navigate(
          `/verify-otp?email=${encodeURIComponent(
            email
          )}&flow=reset-password`
        );
      }, 900);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Không thể gửi OTP. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-emerald-900/30 backdrop-blur-sm flex justify-center items-center px-4 z-50">
      <div className="bg-white/95 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative border border-emerald-50">
        {/* Close */}
        <button
          onClick={() => navigate("/")}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/70 hover:bg-white text-gray-500 hover:text-gray-700 flex items-center justify-center text-xl shadow-sm"
        >
          ×
        </button>

        {/* Left: Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-2 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-500 mb-1">
              Khôi phục mật khẩu
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-800">
              Quên mật khẩu
            </h1>
          </div>

          <p className="text-gray-600 text-center mt-2 mb-6 text-sm">
            Nhập email tài khoản của bạn. Chúng tôi sẽ gửi mã OTP để đặt lại mật
            khẩu.
          </p>

          {message && (
            <div
              className={`p-3 mb-6 rounded-xl text-center text-sm font-medium border ${
                message.includes("OTP")
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Email đăng ký
              </label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md text-sm mt-2"
            >
              {loading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Đã nhớ mật khẩu?{" "}
            <Link
              to="/login"
              className="text-emerald-700 font-medium hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>

        {/* Right: Image */}
        <div className="hidden lg:block bg-emerald-900/5">
          <img
            src="https://images.unsplash.com/photo-1501183638710-841dd1904471"
            alt="Quên mật khẩu"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
