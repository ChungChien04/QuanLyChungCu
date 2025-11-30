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
import AdminInvoiceManagement from "./pages/admin/AdminInvoiceManagement";

// Client Pages
import MyInvoicesPage from "./pages/MyInvoicesPage";
import MyRentals from "./pages/MyRentals";
import NewsListPage from "./pages/NewsListPage";

// Route Guards
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT (được đẩy xuống dưới navbar 80px) */}
      <main className="flex-1 pt-[80px]">
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

          {/* LIST OF APARTMENTS */}
          <Route path="/apartments" element={<ApartmentListPage />} />

          {/* DETAIL ROUTE CHÍNH */}
          <Route path="/apartments/:id" element={<ApartmentDetailPage />} />
          {/* DETAIL ROUTE CŨ - backward compatibility */}
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

          {/* ================= ADMIN ROUTES ================= */}
          <Route
            path="/admin/news"
            element={
              <AdminRoute>
                <AdminNewsPage />
              </AdminRoute>
            }
          />

          <Route path="/admin/reviews" element={<AdminReviewPage />} />

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

          {/* ================= CLIENT ROUTES ================= */}
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

      {/* FOOTER (luôn ở dưới) */}
      <Footer />
    </div>
  );
}

export default App;
