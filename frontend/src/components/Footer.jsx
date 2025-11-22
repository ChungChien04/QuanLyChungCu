import React from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaYoutube,
  FaGooglePlusG,
  FaLinkedinIn,
  FaRss
} from "react-icons/fa";


const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t mt-12">
    

      {/* CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 p-10 text-gray-700">
        {/* Column 1 */}
        <div>
          <h3 className="font-semibold mb-2">Văn bản pháp lý</h3>
          <ul className="space-y-1 text-sm">
            <li>Văn bản chung</li>
            <li>Đầu tư - xây dựng</li>
            <li>Quản lý - vận hành</li>
            <li>Kinh doanh bất động sản</li>
            <li>Thủ tục kinh doanh bể bơi</li>
          </ul>
        </div>

        {/* Column 2 */}
        <div>
          <h3 className="font-semibold mb-2">Công tác quản lý</h3>
          <ul className="space-y-1 text-sm">
            <li>Thành lập Ban quản trị</li>
            <li>Sửa chữa bảo trì</li>
            <li>Quản lý tài chính</li>
            <li>Đấu thầu mua sắm</li>
            <li>Bảo hiểm chung cư</li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3 className="font-semibold mb-2">Link khác</h3>
          <ul className="space-y-1 text-sm">
            <li>Sổ tay - quy trình quản lý</li>
            <li>Tìm kiếm căn hộ</li>
            <li>Tư vấn</li>
            <li>Bản tin chung cư</li>
            <li>Tin tức</li>
            <li>Cộng đồng</li>
            <li>Danh sách dự án</li>
          </ul>
        </div>

        {/* Column 4 */}
        <div>


          <h3 className="font-semibold mt-6 mb-3">Kết nối với SMARTBUILDING</h3>
          <div className="flex gap-4 text-gray-600 text-xl">
            <FaFacebookF />
            <FaTwitter />
            <FaYoutube />
            <FaGooglePlusG />
            <FaLinkedinIn />
            <FaRss />
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="text-center py-4 text-sm text-gray-500 border-t">
        SMARTBUILDING © 2024 - 2025
      </div>
    </footer>
  );
};

export default Footer;
