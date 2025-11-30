import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error" | ""

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email");
  const otp = searchParams.get("otp");

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (password !== confirm) {
      setMessage("Mật khẩu xác nhận không trùng khớp!");
      setMessageType("error");
      return;
    }

    try {
      await axios.post("/api/auth/reset-password", {
        email,
        otp,
        newPassword: password,
      });

      setMessage("Đặt mật khẩu thành công!");
      setMessageType("success");

      setTimeout(() => navigate("/login"), 1500);
    } catch {
      setMessage("Không thể đặt lại mật khẩu!");
      setMessageType("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-emerald-900/30 backdrop-blur-sm flex justify-center items-center px-4 z-50">
      <div className="bg-white/95 w-full max-w-4xl rounded-3xl shadow-2xl grid grid-cols-1 lg:grid-cols-2 relative border border-emerald-50">
        {/* Close */}
        <button
          onClick={() => navigate("/")}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/70 hover:bg-white text-gray-500 hover:text-gray-700 flex items-center justify-center text-xl shadow-sm"
        >
          ×
        </button>

        {/* Left: Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-2">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-500 mb-1">
              Khôi phục mật khẩu
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-emerald-800">
              Đặt lại mật khẩu
            </h2>
          </div>

          <p className="text-sm text-gray-600 mt-1 mb-6">
            Cho tài khoản{" "}
            <span className="font-semibold text-gray-800">{email}</span>
          </p>

          {message && (
            <div
              className={`p-3 mb-4 rounded-xl text-center text-sm font-medium border ${
                messageType === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Mật khẩu mới
              </label>
              <input
                type="password"
                className="w-full px-4 h-11 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                placeholder="Nhập mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                className="w-full px-4 h-11 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                placeholder="Nhập lại mật khẩu"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <button className="w-full h-11 mt-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-emerald-700">
              Đặt lại mật khẩu
            </button>
          </form>
        </div>

        {/* Right: Image */}
        <div className="hidden lg:block bg-emerald-900/5">
          <img
            src="https://images.unsplash.com/photo-1501183638710-841dd1904471"
            alt="reset"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
