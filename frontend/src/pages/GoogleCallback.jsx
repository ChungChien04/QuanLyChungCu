import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      return navigate("/login");
    }

    // Giải mã token bằng backend hoặc dùng backend trả user info sau này
    // Tạm thời backend đã gắn user vào req.user → bạn trả về user luôn thì tốt hơn

    // Nhưng nếu backend chỉ trả về token → lưu tạm token
    localStorage.setItem("userToken", token);

    // (Tùy chọn) gọi API lấy profile user từ token
    fetch("http://localhost:5000/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((user) => {
        // lưu user
        localStorage.setItem("userData", JSON.stringify(user));
        login({ user, token });

        // chuyển về trang chủ
        navigate("/", { replace: true });
      });
  }, []);

  return <p>Đang đăng nhập bằng Google...</p>;
}
