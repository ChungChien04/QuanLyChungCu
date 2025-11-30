import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email");
  const flow = searchParams.get("flow"); // register | reset-password

  const handleChange = (value, index) => {
    if (isNaN(value)) return;

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) inputsRef.current[index + 1].focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const code = otp.join("");

    try {
      // FLOW ĐĂNG KÝ
      if (flow === "register") {
        const name = localStorage.getItem("reg_name");
        const password = localStorage.getItem("reg_password");

        await axios.post("/api/auth/register/verify", {
          name,
          email,
          password,
          otp: code,
        });

        localStorage.removeItem("reg_name");
        localStorage.removeItem("reg_email");
        localStorage.removeItem("reg_password");

        navigate("/login");
        return;
      }

      // FLOW QUÊN MẬT KHẨU
      if (flow === "reset-password") {
        await axios.post("/api/auth/verify-otp", {
          email,
          otp: code,
          purpose: "reset",
        });

        navigate(`/reset-password?email=${email}&otp=${code}`);
        return;
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "OTP không đúng!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center px-4 z-50">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative">

        {/* nút đóng */}
        <button
          onClick={() => navigate("/")}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-700 text-2xl"
        >
          ×
        </button>

        {/* LEFT FORM */}
        <div className="p-10 flex flex-col justify-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-gray-900">
            Xác minh OTP
          </h2>

          <p className="text-center text-gray-600 mt-2 mb-6 text-sm">
            Mã OTP đã được gửi tới <br />
            <strong className="text-emerald-700">{email}</strong>
          </p>

          {message && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-center mb-4 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP INPUTS */}
            <div className="flex justify-between gap-2 sm:gap-3">
              {otp.map((v, i) => (
                <input
                  key={i}
                  maxLength="1"
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="text"
                  className="w-12 h-14 text-2xl text-center rounded-2xl border border-gray-300 bg-gray-50
                    focus:ring-2 focus:ring-emerald-400/70 focus:border-emerald-500 transition outline-none"
                  value={v}
                  onChange={(e) => handleChange(e.target.value, i)}
                  required
                />
              ))}
            </div>

            {/* BUTTON */}
            <button
              className="w-full h-12 rounded-full font-semibold text-white shadow-md transition
                bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Đang xác minh..." : "Xác minh OTP"}
            </button>
          </form>
        </div>

        {/* RIGHT IMAGE */}
        <div className="hidden lg:block bg-gray-100">
          <img
            src="https://images.unsplash.com/photo-1501183638710-841dd1904471"
            alt="otp"
            className="w-full h-full object-cover rounded-r-3xl"
          />
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
