import React, { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import AdminInvoiceDetailModal from "./AdminInvoiceDetailModal";
const API_BASE = "http://localhost:5000";

const Toast = ({ message, type }) => {
  if (!message) return null;
  return (
    <div className={`fixed bottom-4 right-4 text-white px-4 py-2 rounded shadow-lg z-50 animate-slideIn ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
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
  const [settings, setSettings] = useState({ commonFee: 0, cleaningFee: 0, electricityPrice: 0 });
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

  // --- LOAD DATA ---
  useEffect(() => {
    if (activeTab === "settings") fetchSettings();
    if (activeTab === "create") fetchPrepareList();
    if (activeTab === "list") fetchInvoices();
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab === "list") fetchInvoices();
  }, [filterMonth, filterYear, filterStatus]);

  // API Calls
  const fetchSettings = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/invoices/settings`, { headers: { Authorization: `Bearer ${token}` } });
      setSettings(data);
    } catch (err) { console.error(err); }
  };

  const fetchPrepareList = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/invoices/prepare`, { headers: { Authorization: `Bearer ${token}` } });
      setPrepareList(data.map(item => ({ ...item, electricNewIndex: "" })));
    } catch (err) { showToast("Lỗi tải danh sách", "error"); } finally { setLoading(false); }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/invoices/admin/all`, {
        params: { month: filterMonth, year: filterYear, status: filterStatus },
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(data);
    } catch (err) { showToast("Lỗi tải hóa đơn", "error"); } finally { setLoading(false); }
  };

  // --- HANDLERS ---
  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API_BASE}/api/invoices/settings`, settings, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Đã lưu cài đặt!");
    } catch (err) { showToast("Lỗi lưu", "error"); }
  };

  const handleInputChange = (index, field, value) => {
    if (Number(value) < 0) return;
    const newList = [...prepareList];
    newList[index][field] = value; 
    setPrepareList(newList);
  };

  const handleCreateInvoices = async () => {
    const validItems = prepareList.filter(item => item.electricNewIndex !== "" && Number(item.electricNewIndex) >= item.electricOldIndex);
    if (validItems.length === 0) return showToast("Vui lòng nhập số điện mới hợp lệ.", "error");
    if (!window.confirm(`Tạo ${validItems.length} hóa đơn?`)) return;

    try {
      await axios.post(`${API_BASE}/api/invoices/create`, 
        { invoices: validItems, month: filterMonth, year: filterYear }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Tạo thành công!", "success");
      setActiveTab("list"); 
    } catch (err) { showToast("Lỗi tạo hóa đơn", "error"); }
  };

  const handleManualPay = async (id) => {
    if(!window.confirm("Xác nhận đã thu tiền mặt?")) return;
    try {
      await axios.put(`${API_BASE}/api/payments/admin/manual-pay-invoice/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast("Đã cập nhật thanh toán!");
      fetchInvoices();
    } catch (err) { showToast("Lỗi cập nhật", "error"); }
  };

  return (
    <div className="max-w-[90%] mx-auto mt-10 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center text-green-800 mb-8">Quản lý Dịch vụ & Hóa đơn</h1>

      {/* TABS */}
      <div className="flex justify-center gap-4 mb-8">
        <button onClick={() => setActiveTab("list")} className={`px-6 py-2 rounded-full font-bold transition shadow-md ${activeTab === "list" ? "bg-green-700 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
          Danh sách hóa đơn
        </button>
        <button onClick={() => setActiveTab("create")} className={`px-6 py-2 rounded-full font-bold transition shadow-md ${activeTab === "create" ? "bg-green-700 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
          Lập hóa đơn tháng
        </button>
        <button onClick={() => setActiveTab("settings")} className={`px-6 py-2 rounded-full font-bold transition shadow-md ${activeTab === "settings" ? "bg-green-700 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
        Thiết lập đơn giá
        </button>
      </div>

      {/* === TAB 1: DANH SÁCH HÓA ĐƠN (MỚI) === */}
      {activeTab === "list" && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-4 items-center mb-6 bg-green-50 p-3 rounded-lg">
            <span className="font-bold text-gray-700">Bộ lọc:</span>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border p-2 rounded">
               {Array.from({length: 12}, (_, i) => <option key={i} value={i+1}>Tháng {i+1}</option>)}
            </select>
            <input type="number" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="border p-2 rounded w-24"/>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border p-2 rounded">
               <option value="">Tất cả trạng thái</option>
               <option value="unpaid">Chưa thanh toán</option>
               <option value="paid">Đã thanh toán</option>
            </select>
            <button onClick={fetchInvoices} className="ml-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Làm mới</button>
          </div>

          {/* Table */}
          {loading ? <p className="text-center p-10">Đang tải...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-green-800 text-white">
                    <th className="p-3 rounded-tl-lg bg-green-700">Căn hộ</th>
                    <th className="p-3 bg-green-700 border-l px-3">Khách thuê</th>
                    <th className="p-3 text-center bg-green-700 border-l px-3">Kỳ HĐ</th>
                    <th className="p-3 text-center bg-green-700 border-l px-3">Tổng tiền</th>
                    <th className="p-3 text-center bg-green-700 border-l px-3">Trạng thái</th>
                    <th className="p-3 text-center bg-green-700 rounded-tr-lg border-l px-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-gray-500">Không tìm thấy hóa đơn nào.</td></tr>}
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-bold">{inv.apartment?.title}</td>
                      <td className="p-3">{inv.user?.name}</td>
                      <td className="p-3 text-center">T{inv.month}/{inv.year}</td>
                      <td className="p-3 text-right font-bold text-red-600">{inv.totalAmount.toLocaleString()} đ</td>
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {inv.status === 'paid' ? 'Đã thanh toán' : 'Chưa trả'}
                        </span>
                      </td>
                      <td className="p-3 flex justify-center gap-2">
                        <button 
                          onClick={() => setViewingInvoice(inv)}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-200 border border-gray-300"
                        >
                          Xem chi tiết
                        </button>
                        {inv.status === 'unpaid' && (
                          <button onClick={() => handleManualPay(inv._id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 shadow">
                             Đã Thu tiền
                          </button>
                        )}
                        {inv.status === 'paid' && <span className="text-gray-400 text-xs">Hoàn tất</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* === TAB 2: LẬP HÓA ĐƠN (Giữ nguyên thiết kế cũ) === */}
      {activeTab === "create" && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex gap-4 items-center mb-6 bg-green-50 p-4 rounded-xl">
            <span className="font-bold text-green-800">Kỳ hóa đơn:</span>
            <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="border p-2 rounded">
               {Array.from({length: 12}, (_, i) => <option key={i} value={i+1}>Tháng {i+1}</option>)}
            </select>
            <input type="number" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="border p-2 rounded w-20"/>
            <button onClick={handleCreateInvoices} className="ml-auto bg-green-700 text-white px-6 py-2 rounded font-bold hover:bg-green-800 shadow">Gửi Hóa Đơn</button>
          </div>

          {loading ? <p className="text-center p-10">Đang tải...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-green-700 text-white">
                    <th className="p-3 rounded-tl-lg border-r px-3">Căn hộ</th>
                    <th className="p-3">Khách</th>
                    {/* 🔥 MÀU XANH DƯƠNG NHƯ CŨ */}
                    <th className="p-3 bg-green-700 w-28 border-l px-3 ">Phí chung</th>
                    <th className="p-3 bg-green-700 w-28 border-l px-3 ">Vệ sinh</th>
                    <th className="p-3 bg-green-700 text-center w-20 border-l px-3">Số cũ</th>
                    <th className="p-3 bg-green-700 text-center w-28 border-l px-3">Số mới</th>
                    <th className="p-3 text-center border-l px-3">Tiêu thụ</th>
                    <th className="p-3 text-right rounded-tr-lg border-l px-3">Tổng cộng</th>
                  </tr>
                </thead>
                <tbody>
                  {prepareList.length === 0 && <tr><td colSpan="8" className="p-4 text-center">Không có căn hộ nào đang thuê.</td></tr>}
                  {prepareList.map((item, index) => {
                    const usage = (item.electricNewIndex && Number(item.electricNewIndex) >= item.electricOldIndex) ? Number(item.electricNewIndex) - item.electricOldIndex : 0;
                    const total = Number(item.commonFee) + Number(item.cleaningFee) + (usage * item.electricPrice);
                    return (
                      <tr key={item.rentalId} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.apartmentTitle}</td>
                        <td className="p-3 text-gray-600 text-xs">{item.userName}</td>
                        
                        {/* 🔥 MÀU XANH DƯƠNG NHƯ CŨ */}
                        <td className="text-gray-600">
                          <input type="number" className="w-full p-1 border border-green-300 rounded text-right text-blue-800" value={item.commonFee} onChange={(e) => handleInputChange(index, 'commonFee', e.target.value)}/>
                        </td>
                        <td className="p-2 text-gray-600 border-r border-gray-200">
                          <input type="number" className="w-full p-1 border border-green-300 rounded text-right text-blue-800" value={item.cleaningFee} onChange={(e) => handleInputChange(index, 'cleaningFee', e.target.value)}/>
                        </td>

                        <td className="p-3 text-center bg-yellow-50">{item.electricOldIndex}</td>
                        <td className="p-2 text-gray-600"><input type="number" className="w-full p-1 border border-green-300 rounded text-center font-bold text-green-700" value={item.electricNewIndex} onChange={(e) => handleInputChange(index, 'electricNewIndex', e.target.value)} placeholder="..."/></td>
                        <td className="p-3 text-center">{usage} kW</td>
                        <td className="p-3 text-right font-bold text-red-600">{total.toLocaleString()} đ</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* === TAB 3: SETTINGS === */}
      {activeTab === "settings" && (
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">Cài đặt giá mặc định</h3>
          <div className="space-y-3">
            <label className="block">Phí chung <input type="number" className="w-full border p-2 rounded mt-1" value={settings.commonFee} onChange={(e) => setSettings({...settings, commonFee: Number(e.target.value)})}/></label>
            <label className="block">Vệ sinh <input type="number" className="w-full border p-2 rounded mt-1" value={settings.cleaningFee} onChange={(e) => setSettings({...settings, cleaningFee: Number(e.target.value)})}/></label>
            <label className="block">Giá điện/kW <input type="number" className="w-full border p-2 rounded mt-1" value={settings.electricityPrice} onChange={(e) => setSettings({...settings, electricityPrice: Number(e.target.value)})}/></label>
            <button onClick={handleSaveSettings} className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 mt-2">Lưu cài đặt</button>
          </div>
        </div>
      )}
<AdminInvoiceDetailModal 
        invoice={viewingInvoice} 
        onClose={() => setViewingInvoice(null)} 
      />

      <Toast message={toast.message} type={toast.type} />
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
};

export default AdminInvoiceManagement;