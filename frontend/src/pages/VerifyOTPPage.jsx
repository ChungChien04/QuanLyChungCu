import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

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
      /* --------------------- ✔ FLOW ĐĂNG KÝ --------------------- */
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

      /* ------------------ ✔ FLOW QUÊN MẬT KHẨU ------------------ */
      if (flow === "reset-password") {
        // ⭐ THÊM purpose = reset → KHÔNG THÊM SẼ KHÔNG VERIFY ĐƯỢC
        await axios.post("/api/auth/verify-otp", {
          email,
          otp: code,
          purpose: "reset",
        });

        // Sau đó cho người dùng đặt mật khẩu mới
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
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center px-4 z-50">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl grid grid-cols-1 lg:grid-cols-2 relative">

        <button
          onClick={() => navigate("/")}
          className="absolute right-5 top-5 text-gray-400 text-2xl"
        >
          ×
        </button>

        <div className="p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-center">Xác minh OTP</h2>
          <p className="text-center text-gray-600 mb-4">
            Nhập mã OTP gửi đến <strong>{email}</strong>
          </p>

          {message && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-center mb-4 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-between">
              {otp.map((v, i) => (
                <input
                  key={i}
                  maxLength="1"
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="text"
                  className="w-12 h-14 text-2xl text-center border rounded-xl"
                  value={v}
                  onChange={(e) => handleChange(e.target.value, i)}
                  required
                />
              ))}
            </div>

            <button
              className="w-full h-12 bg-green-700 text-white rounded-xl"
              disabled={loading}
            >
              {loading ? "Đang xác minh..." : "Xác minh OTP"}
            </button>
          </form>
        </div>

        <div className="hidden lg:block bg-gray-100">
          <img
            src="https://images.unsplash.com/photo-1501183638710-841dd1904471"
            alt="otp"
            className="w-full h-full object-cover"
          />
        </div>

      </div>
    </div>
  );
};

export default VerifyOTPPage;
