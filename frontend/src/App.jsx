import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatbotPage from "./pages/ChatbotPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyOTPPage from "./pages/VerifyOTPPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import ApartmentListPage from "./pages/ApartmentListPage";
import ApartmentDetailPage from "./pages/ApartmentDetailPage";
import AdminReviewPage from "./pages/admin/AdminReviewPage";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import AdminApartmentPage from "./pages/admin/AdminApartmentPage";
import GoogleCallback from "./pages/GoogleCallback";
import NewsListPage from "./pages/NewsListPage";

import AdminNewsPage from "./pages/admin/AdminNewsPage";

function App() {
  return (
    <>
      <Navbar />

      {/* FIX navbar đè trang */}
      <div style={{ paddingTop: "80px" }}>

        <Routes>

          {/* HOME */}
          <Route path="/" element={<HomePage />} />

          {/* PUBLIC */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/apartments" element={<ApartmentListPage />} />
          <Route path="/admin/reviews" element={<AdminReviewPage />} />
          <Route path="/google/callback" element={<GoogleCallback />} />
          <Route path="/news" element={<ProtectedRoute><NewsListPage /></ProtectedRoute>} />
          <Route path="/admin/news" element={<AdminRoute><AdminNewsPage /></AdminRoute>} />



          {/* PROTECTED */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          

          {/* ⭐⭐⭐ PUBLIC — CHI TIẾT CĂN HỘ ⭐⭐⭐ */}
          <Route path="/apartment/:id" element={<ApartmentDetailPage />} />

          {/* ⭐⭐⭐ ADMIN — ĐẶT CUỐI CÙNG ⭐⭐⭐ */}
          <Route
            path="/admin/apartments"
            element={
              <AdminRoute>
                <AdminApartmentPage />
              </AdminRoute>
            }
          />

        </Routes>
      </div>
    </>
  );
}

export default App;
