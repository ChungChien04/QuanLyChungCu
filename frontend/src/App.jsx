import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages - Public
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
import GoogleCallback from "./pages/GoogleCallback";

// Admin Pages
import AdminReviewPage from "./pages/admin/AdminReviewPage";
import AdminApartmentPage from "./pages/admin/AdminApartmentPage";
import AdminRentalsPage from "./pages/AdminRentalManagement";
import AdminNewsPage from "./pages/admin/AdminNewsPage";

// Client Pages
import MyRentals from "./pages/MyRentals";
import NewsListPage from "./pages/NewsListPage";

// Route Guards
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

function App() {
  return (
    <>
      {/* NAVBAR */}
      <Navbar />

      {/* Avoid navbar overlap */}
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

          {/* LIST OF APARTMENTS (ĐẶT TRƯỚC) */}
          <Route path="/apartments" element={<ApartmentListPage />} />

          {/* DETAIL ROUTE CHUẨN (CHATBOT & HỆ THỐNG MỚI DÙNG) */}
          <Route path="/apartments/:id" element={<ApartmentDetailPage />} />

          {/* DETAIL ROUTE CŨ - để tránh lỗi backward compatibility */}
          <Route path="/apartment/:id" element={<ApartmentDetailPage />} />

          <Route path="/google/callback" element={<GoogleCallback />} />

          {/* CLIENT - NEWS */}
          <Route
            path="/news"
            element={
              <ProtectedRoute>
                <NewsListPage />
              </ProtectedRoute>
            }
          />

          {/* ADMIN - NEWS */}
          <Route
            path="/admin/news"
            element={
              <AdminRoute>
                <AdminNewsPage />
              </AdminRoute>
            }
          />

          {/* ADMIN PUBLIC */}
          <Route path="/admin/reviews" element={<AdminReviewPage />} />

          {/* ADMIN PAGES */}
          <Route
            path="/admin/apartments"
            element={
              <AdminRoute>
                <AdminApartmentPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/rentals"
            element={
              <AdminRoute>
                <AdminRentalsPage />
              </AdminRoute>
            }
          />

          {/* PROTECTED CLIENT PAGES */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-rentals"
            element={
              <ProtectedRoute>
                <MyRentals />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {/* FOOTER */}
      <Footer />
    </>
  );
}

export default App;
