import { useState } from "react";
import AuthContext from "./AuthContext.js";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("userData");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("❌ Lỗi parse userData:", e);
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("userToken") || null;
    } catch (e) {
      console.error("❌ Lỗi lấy token:", e);
      return null;
    }
  });

  // ⭐ LOGIN — đảm bảo React render lại trước khi navigate
  const login = (data, callback) => {
    const { user, token } = data;

    localStorage.setItem("userData", JSON.stringify(user));
    localStorage.setItem("userToken", token);

    setUser(user);
    setToken(token);

    // Đảm bảo React update xong state rồi mới điều hướng
    if (callback) setTimeout(callback, 120);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("userData");
    localStorage.removeItem("userToken");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
