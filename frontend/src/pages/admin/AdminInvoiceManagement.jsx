import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import AdminInvoiceDetailModal from "./AdminInvoiceDetailModal";

const API_BASE = "http://localhost:5000";

/* ============================
   TOAST
============================= */
const Toast = ({ message, type }) => {
  if (!message) return null;
  return (
    <div
      className={`fixed bottom-4 right-4 text-white px-4 py-2 rounded-2xl shadow-lg z-50 animate-slideIn ${
        type === "error" ? "bg-red-600" : "bg-emerald-600"
      }`}
    >
      {message}
    </div>
  );
};

const AdminInvoiceManagement = () => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState("list"); // 'list', 'create', 'settings'
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [viewingInvoice, setViewingInvoice] = useState(null);

  // Data Settings & Create
  const [settings, setSettings] = useState({
    commonFee: 0,
    cleaningFee: 0,
    electricityPrice: 0,
  });
  const [prepareList, setPrepareList] = useState([]);

  // Data List (Tab Xem hóa đơn)
  const [invoices, setInvoices] = useState([]);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  /* ============================
     LOAD DATA
  ============================== */
  useEffect(() => {
    if (!token) return;
    if (activeTab === "settings") fetchSettings();
    if (activeTab === "create") fetchPrepareList();
    if (activeTab === "list") fetchInvoices();
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab === "list" && token) fetchInvoices();
  }, [filterMonth, filterYear, filterStatus]);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/invoices/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrepareList = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/invoices/prepare`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrepareList(
        data.map((item) => ({
          ...item,
          electricNewIndex: "",
        }))
      );
    } catch {
      showToast("Lỗi tải danh sách", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/invoices/admin/all`, {
        params: {
          month: Number(filterMonth),
          year: Number(filterYear),
          status: filterStatus,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(data);
    } catch {
      showToast("Lỗi tải hóa đơn", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     HANDLERS
  ============================== */
  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API_BASE}/api/invoices/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Đã lưu cài đặt!");
    } catch {
      showToast("Lỗi lưu", "error");
    }
  };

  const handleInputChange = (index, field, value) => {
    if (Number(value) < 0) return;
    const newList = [...prepareList];
    newList[index][field] = value;
    setPrepareList(newList);
  };

  const handleCreateInvoices = async () => {
    const validItems = prepareList.filter(
      (item) =>
        item.electricNewIndex !== "" &&
        Number(item.electricNewIndex) >= item.electricOldIndex
    );

    if (validItems.length === 0)
      return showToast("Vui lòng nhập số điện mới hợp lệ.", "error");
    if (!window.confirm(`Tạo ${validItems.length} hóa đơn?`)) return;

    try {
      await axios.post(
        `${API_BASE}/api/invoices/create`,
        { invoices: validItems, month: filterMonth, year: filterYear },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Tạo thành công!", "success");
      setActiveTab("list");
    } catch {
      showToast("Lỗi tạo hóa đơn", "error");
    }
  };

  const handleManualPay = async (id) => {
    if (!window.confirm("Xác nhận đã thu tiền mặt?")) return;
    try {
      await axios.put(
        `${API_BASE}/api/payments/admin/manual-pay-invoice/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showToast("Đã cập nhật thanh toán!");
      fetchInvoices();
    } catch {
      showToast("Lỗi cập nhật", "error");
    }
  };

  /* ============================
     DERIVED STATS (LIST TAB)
  ============================== */
  const sortedInvoices = useMemo(
    () =>
      [...invoices].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [invoices]
  );

  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((i) => i.status === "paid").length;
    const unpaid = invoices.filter((i) => i.status === "unpaid").length;
    const totalAmount = invoices.reduce(
      (sum, i) => sum + (i.totalAmount || 0),
      0
    );
    return { total, paid, unpaid, totalAmount };
  }, [invoices]);

  const renderLoading = (
    <div className="py-12 flex flex-col items-center gap-2 text-sm text-slate-600">
      <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span>Đang tải dữ liệu...</span>
    </div>
  );

  /* ============================
        RENDER
  ============================== */
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* HEADER */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 pt-[96px] pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-500 mb-2">
            Admin panel
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-1 text-balance">
            Quản lý dịch vụ & hóa đơn
          </h1>
          <p className="text-sm md:text-base text-emerald-900/80 max-w-2xl">
            Lập hóa đơn định kỳ, cập nhật trạng thái thanh toán và điều chỉnh
            đơn giá dịch vụ cho toàn bộ căn hộ.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* TABS */}
        <div className="flex justify-center gap-3 md:gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-5 md:px-6 py-2 rounded-full text-sm font-semibold shadow-md border transition ${
              activeTab === "list"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Danh sách hóa đơn
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-5 md:px-6 py-2 rounded-full text-sm font-semibold shadow-md border transition ${
              activeTab === "create"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Lập hóa đơn tháng
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-5 md:px-6 py-2 rounded-full text-sm font-semibold shadow-md border transition ${
              activeTab === "settings"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Thiết lập đơn giá
          </button>
        </div>

        {/* === TAB 1: DANH SÁCH HÓA ĐƠN === */}
        {activeTab === "list" && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3.5">
                <p className="text-xs text-slate-500 mb-1">
                  Tổng hóa đơn (bộ lọc)
                </p>
                <p className="text-xl font-semibold text-slate-900">
                  {stats.total}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm px-4 py-3.5">
                <p className="text-xs text-emerald-700 mb-1">Đã thanh toán</p>
                <p className="text-xl font-semibold text-emerald-700">
                  {stats.paid}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm px-4 py-3.5">
                <p className="text-xs text-red-700 mb-1">Chưa thanh toán</p>
                <p className="text-xl font-semibold text-red-700">
                  {stats.unpaid}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3.5">
                <p className="text-xs text-slate-600 mb-1">
                  Tổng tiền (kỳ đang xem)
                </p>
                <p className="text-lg font-semibold text-emerald-700">
                  {stats.totalAmount.toLocaleString()} đ
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
              {/* Filter Bar */}
              <div className="flex flex-wrap gap-3 items-center mb-6 bg-emerald-50/80 p-3 rounded-xl border border-emerald-100">
                <span className="font-semibold text-gray-800 text-sm">
                  Bộ lọc:
                </span>

                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                  className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="border border-gray-200 px-3 py-2 rounded-xl text-sm w-24 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                />

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="unpaid">Chưa thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                </select>

                <button
                  onClick={fetchInvoices}
                  className="ml-auto px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs md:text-sm font-semibold hover:bg-emerald-700 shadow-sm"
                >
                  Làm mới
                </button>
              </div>

              {/* Table */}
              {loading ? (
                renderLoading
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="text-white">
                        <th className="p-3 rounded-tl-xl bg-emerald-700">
                          Căn hộ
                        </th>
                        <th className="p-3 bg-emerald-700 border-l border-emerald-600">
                          Khách thuê
                        </th>
                        <th className="p-3 text-center bg-emerald-700 border-l border-emerald-600">
                          Kỳ HĐ
                        </th>
                        <th className="p-3 text-center bg-emerald-700 border-l border-emerald-600">
                          Tổng tiền
                        </th>
                        <th className="p-3 text-center bg-emerald-700 border-l border-emerald-600">
                          Trạng thái
                        </th>
                        <th className="p-3 text-center bg-emerald-700 rounded-tr-xl border-l border-emerald-600">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedInvoices.length === 0 && (
                        <tr>
                          <td
                            colSpan="6"
                            className="p-6 text-center text-gray-500 text-sm"
                          >
                            Không tìm thấy hóa đơn nào cho kỳ đã chọn.
                          </td>
                        </tr>
                      )}

                      {sortedInvoices.map((inv) => (
                        <tr
                          key={inv._id}
                          className="border-b border-gray-100 hover:bg-emerald-50/40"
                        >
                          <td className="p-3 font-semibold text-gray-900">
                            {inv.apartment?.title}
                          </td>
                          <td className="p-3 text-gray-800">
                            {inv.user?.name}
                          </td>
                          <td className="p-3 text-center">
                            T{inv.month}/{inv.year}
                          </td>
                          <td className="p-3 text-right font-bold text-red-600">
                            {inv.totalAmount.toLocaleString()} đ
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                inv.status === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {inv.status === "paid"
                                ? "Đã thanh toán"
                                : "Chưa trả"}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center gap-2 flex-wrap">
                              <button
                                onClick={() => setViewingInvoice(inv)}
                                className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-xl text-xs border border-gray-200 hover:bg-gray-100"
                              >
                                Xem chi tiết
                              </button>
                              {inv.status === "unpaid" && (
                                <button
                                  onClick={() => handleManualPay(inv._id)}
                                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                                >
                                  Đã thu tiền
                                </button>
                              )}
                              {inv.status === "paid" && (
                                <span className="text-gray-400 text-xs">
                                  Hoàn tất
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === TAB 2: LẬP HÓA ĐƠN === */}
        {activeTab === "create" && (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex flex-wrap gap-4 items-center mb-6 bg-emerald-50/80 p-4 rounded-xl border border-emerald-100">
              <span className="font-semibold text-emerald-800 text-sm">
                Kỳ hóa đơn:
              </span>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                className="border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="border border-gray-200 px-3 py-2 rounded-xl text-sm w-20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
              <button
                onClick={handleCreateInvoices}
                className="ml-auto bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-emerald-700 shadow-sm"
              >
                Gửi hóa đơn
              </button>
            </div>

            {loading ? (
              renderLoading
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="text-white">
                      <th className="p-3 rounded-tl-xl bg-emerald-700 border-r border-emerald-600">
                        Căn hộ
                      </th>
                      <th className="p-3 bg-emerald-700 border-emerald-600">
                        Khách
                      </th>
                      {/* Giữ màu xanh dương cho số phí như bạn ghi chú */}
                      <th className="p-3 bg-emerald-700 w-28 border-l border-emerald-600">
                        Phí chung
                      </th>
                      <th className="p-3 bg-emerald-700 w-28 border-l border-emerald-600">
                        Vệ sinh
                      </th>
                      <th className="p-3 bg-emerald-700 text-center w-20 border-l border-emerald-600">
                        Số cũ
                      </th>
                      <th className="p-3 bg-emerald-700 text-center w-28 border-l border-emerald-600">
                        Số mới
                      </th>
                      <th className="p-3 text-center bg-emerald-700 border-l border-emerald-600">
                        Tiêu thụ
                      </th>
                      <th className="p-3 text-right bg-emerald-700 rounded-tr-xl border-l border-emerald-600">
                        Tổng cộng
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {prepareList.length === 0 && (
                      <tr>
                        <td
                          colSpan="8"
                          className="p-6 text-center text-gray-500 text-sm"
                        >
                          Không có căn hộ nào đang thuê.
                        </td>
                      </tr>
                    )}
                    {prepareList.map((item, index) => {
                      const usage =
                        item.electricNewIndex &&
                        Number(item.electricNewIndex) >=
                          item.electricOldIndex
                          ? Number(item.electricNewIndex) -
                            item.electricOldIndex
                          : 0;
                      const total =
                        Number(item.commonFee) +
                        Number(item.cleaningFee) +
                        usage * item.electricPrice;

                      return (
                        <tr
                          key={item.rentalId}
                          className="border-b border-gray-100 hover:bg-emerald-50/30"
                        >
                          <td className="p-3 font-medium text-gray-900">
                            {item.apartmentTitle}
                          </td>
                          <td className="p-3 text-gray-700 text-xs">
                            {item.userName}
                          </td>

                          <td className="p-2 text-gray-700">
                            <input
                              type="number"
                              className="w-full p-1 border border-emerald-200 rounded text-right text-blue-800 text-xs"
                              value={item.commonFee}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "commonFee",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td className="p-2 text-gray-700 border-r border-gray-100">
                            <input
                              type="number"
                              className="w-full p-1 border border-emerald-200 rounded text-right text-blue-800 text-xs"
                              value={item.cleaningFee}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "cleaningFee",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td className="p-3 text-center bg-yellow-50 text-gray-800">
                            {item.electricOldIndex}
                          </td>
                          <td className="p-2 text-gray-700">
                            <input
                              type="number"
                              className="w-full p-1 border border-emerald-200 rounded text-center font-semibold text-emerald-700 text-xs"
                              value={item.electricNewIndex}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "electricNewIndex",
                                  e.target.value
                                )
                              }
                              placeholder="..."
                            />
                          </td>
                          <td className="p-3 text-center text-gray-800">
                            {usage} kW
                          </td>
                          <td className="p-3 text-right font-bold text-red-600">
                            {total.toLocaleString()} đ
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* === TAB 3: SETTINGS === */}
        {activeTab === "settings" && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b border-gray-100 pb-2">
              Cài đặt giá mặc định
            </h3>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-gray-700 text-sm">Phí chung</span>
                <input
                  type="number"
                  className="w-full border border-gray-200 p-2 rounded-xl mt-1 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                  value={settings.commonFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      commonFee: Number(e.target.value),
                    })
                  }
                />
              </label>

              <label className="block">
                <span className="text-gray-700 text-sm">Vệ sinh</span>
                <input
                  type="number"
                  className="w-full border border-gray-200 p-2 rounded-xl mt-1 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                  value={settings.cleaningFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cleaningFee: Number(e.target.value),
                    })
                  }
                />
              </label>

              <label className="block">
                <span className="text-gray-700 text-sm">Giá điện / kW</span>
                <input
                  type="number"
                  className="w-full border border-gray-200 p-2 rounded-xl mt-1 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                  value={settings.electricityPrice}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      electricityPrice: Number(e.target.value),
                    })
                  }
                />
              </label>

              <button
                onClick={handleSaveSettings}
                className="w-full bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 mt-3 shadow-sm"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        )}

        <AdminInvoiceDetailModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />

        <Toast message={toast.message} type={toast.type} />
      </main>
    </div>
  );
};

export default AdminInvoiceManagement;
