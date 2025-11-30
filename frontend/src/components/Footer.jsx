import React from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaYoutube,
  FaGooglePlusG,
  FaLinkedinIn,
  FaRss,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-emerald-50 border-t border-emerald-100 mt-16 pt-12">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* GRID CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-gray-700">

          {/* Column 1 */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-700 mb-3">
              Văn bản pháp lý
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="hover:text-emerald-600 cursor-pointer">Văn bản chung</li>
              <li className="hover:text-emerald-600 cursor-pointer">Đầu tư - xây dựng</li>
              <li className="hover:text-emerald-600 cursor-pointer">Quản lý - vận hành</li>
              <li className="hover:text-emerald-600 cursor-pointer">Kinh doanh bất động sản</li>
              <li className="hover:text-emerald-600 cursor-pointer">Thủ tục kinh doanh bể bơi</li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-700 mb-3">
              Công tác quản lý
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="hover:text-emerald-600 cursor-pointer">Thành lập Ban quản trị</li>
              <li className="hover:text-emerald-600 cursor-pointer">Sửa chữa bảo trì</li>
              <li className="hover:text-emerald-600 cursor-pointer">Quản lý tài chính</li>
              <li className="hover:text-emerald-600 cursor-pointer">Đấu thầu mua sắm</li>
              <li className="hover:text-emerald-600 cursor-pointer">Bảo hiểm chung cư</li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-700 mb-3">
              Liên kết nhanh
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="hover:text-emerald-600 cursor-pointer">Sổ tay - quy trình quản lý</li>
              <li className="hover:text-emerald-600 cursor-pointer">Tìm kiếm căn hộ</li>
              <li className="hover:text-emerald-600 cursor-pointer">Tư vấn</li>
              <li className="hover:text-emerald-600 cursor-pointer">Bản tin chung cư</li>
              <li className="hover:text-emerald-600 cursor-pointer">Tin tức</li>
              <li className="hover:text-emerald-600 cursor-pointer">Cộng đồng</li>
              <li className="hover:text-emerald-600 cursor-pointer">Danh sách dự án</li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h3 className="text-lg font-semibold text-emerald-700 mb-4">
              Kết nối với SMARTBUILDING
            </h3>

            <div className="flex gap-3">
              {[FaFacebookF, FaTwitter, FaYoutube, FaGooglePlusG, FaLinkedinIn, FaRss].map(
                (Icon, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 flex items-center justify-center 
                    rounded-full bg-white border border-emerald-200 text-emerald-700 
                    hover:bg-emerald-600 hover:text-white transition cursor-pointer shadow-sm"
                  >
                    <Icon size={18} />
                  </div>
                )
              )}
            </div>
          </div>

        </div>

        {/* COPYRIGHT */}
        <div className="text-center py-6 text-sm text-gray-600 mt-12 border-t border-emerald-100">
          SMARTBUILDING © 2024 - 2025. All rights reserved.
        </div>

      </div>
    </footer>
  );
};

export default Footer;
