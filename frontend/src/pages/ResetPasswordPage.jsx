import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email");
  const otp = searchParams.get("otp");

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirm) {
      setMessage("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    try {
      await axios.post("/api/auth/reset-password", {
        email,
        otp,
        newPassword: password,
      });

      setMessage("Đặt mật khẩu thành công!");

      setTimeout(() => navigate("/login"), 1500);

    } catch  {
      setMessage("Không thể đặt lại mật khẩu!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center px-4 z-50">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl grid grid-cols-1 lg:grid-cols-2 relative">

        <button onClick={() => navigate("/")} className="absolute right-5 top-5 text-gray-400 text-2xl">×</button>

        <div className="p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold">Đặt lại mật khẩu</h2>
          <p className="text-lg text-gray-600 mt-1 mb-6">
            Cho tài khoản <strong>{email}</strong>
          </p>

          {message && (
            <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg mb-4 text-center text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <input
              type="password"
              className="w-full px-4 py-3 border rounded-xl"
              placeholder="Mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              className="w-full px-4 py-3 border rounded-xl"
              placeholder="Xác nhận mật khẩu"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <button className="w-full py-3 bg-green-700 text-white rounded-full font-semibold">
              Đặt lại mật khẩu
            </button>
          </form>
        </div>

        <div className="hidden lg:block bg-gray-100">
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
