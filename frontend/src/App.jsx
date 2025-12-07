import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import useAuth from "./hooks/useAuth";

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
import AdminInvoiceManagement from "./pages/admin/AdminInvoiceManagement";
import AdminDashboard from "./pages/admin/AdminDashboard";

// Client Pages
import MyInvoicesPage from "./pages/MyInvoicesPage";
import MyRentals from "./pages/MyRentals";
import NewsListPage from "./pages/NewsListPage";

// Route Guards
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

// ⭐ Nút hỗ trợ Zalo + Hotline
import FloatingSupportButton from "./components/FloatingSupportButton";

function App() {
  const { user } = useAuth(); // ⭐ Lấy thông tin user để kiểm tra role

  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      {/* NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-[80px]">
        <Routes>
          {/* HOME */}
          <Route path="/" element={<HomePage />} />

          {/* PUBLIC ROUTES */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* APARTMENTS */}
          <Route path="/apartments" element={<ApartmentListPage />} />
          <Route path="/apartments/:id" element={<ApartmentDetailPage />} />
          <Route path="/apartment/:id" element={<ApartmentDetailPage />} />

          <Route path="/google/callback" element={<GoogleCallback />} />

          {/* CLIENT - INVOICES */}
          <Route
            path="/my-invoices"
            element={
              <ProtectedRoute>
                <MyInvoicesPage />
              </ProtectedRoute>
            }
          />

          {/* CLIENT - NEWS */}
          <Route
            path="/news"
            element={
              <ProtectedRoute>
                <NewsListPage />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/news"
            element={
              <AdminRoute>
                <AdminNewsPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/reviews"
            element={
              <AdminRoute>
                <AdminReviewPage />
              </AdminRoute>
            }
          />

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

          <Route
            path="/admin/invoices"
            element={
              <AdminRoute>
                <AdminInvoiceManagement />
              </AdminRoute>
            }
          />

          {/* CLIENT ROUTES */}
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
      </main>

      {/* ⭐ NÚT HỖ TRỢ CHỈ CHO KHÁCH HÀNG */}
      {user && user.role === "resident" && <FloatingSupportButton />}

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

export default App;
