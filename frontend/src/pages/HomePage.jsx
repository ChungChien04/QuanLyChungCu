import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";

const HomePage = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  // Pagination (giữ nguyên nhưng không dùng)


  // ⭐ Lấy căn hộ nổi bật
  const fetchApartments = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/apartments/featured`);
      setApartments(data.apartments || []);
      
    } catch {
      setError("Không thể tải dữ liệu căn hộ nổi bật");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Search sẽ không dùng featured
  const handleSearch = async () => {
    if (!keyword.trim()) return fetchApartments();

    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/apartments/search`, {
        params: { q: keyword },
      });
      setApartments(data);
      
    } catch {
      setError("Tìm kiếm thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* HERO */}
      <section className="relative w-full h-[360px] overflow-hidden">

        <img
          src="https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=60"
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover brightness-75"
        />

        {/* SEARCH BOX */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="w-11/12 md:w-1/2 mx-auto px-4 -mt-8">
            <div className="bg-white shadow-2xl rounded-2xl p-6 border border-gray-100">

              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tìm kiếm căn hộ
              </h2>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Nhập từ khóa (tên căn hộ, mô tả...)"
                    className="
                      w-full p-4 pl-12 border border-gray-300 rounded-xl
                      focus:ring-2 focus:ring-green-300 focus:border-green-600
                      outline-none text-gray-800
                    "
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  <span className="absolute left-4 top-4 text-gray-400 text-xl">🔍</span>
                </div>

                <button
                  onClick={handleSearch}
                  className="
                    bg-green-700 hover:bg-green-800 
                    px-6 py-3 rounded-xl text-white font-semibold shadow
                    transition
                  "
                >
                  Tìm kiếm
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* TITLE */}
      <h2 className="mt-5 text-3xl font-bold text-center text-green-700 mb-10">
        CĂN HỘ NỔI BẬT TẠI SMARTBUILDING
      </h2>

      {/* LIST */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        {loading ? (
          <p className="text-center text-gray-500 text-lg">
            Đang tải dữ liệu...
          </p>
        ) : (
          <>
            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {apartments.map((apt) => (
                <Link
                  key={apt._id}
                  to={`/apartment/${apt._id}`}
                  className="
                    group bg-white rounded-2xl overflow-hidden
                    shadow-md hover:shadow-2xl
                    border border-gray-100
                    transition-all duration-300
                  "
                >
                  {/* IMAGE */}
                  <div className="relative h-56 w-full overflow-hidden">

                    {/* ⭐ Badge Nổi bật */}
                    {apt.featured && (
                      <span className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        NỔI BẬT
                      </span>
                    )}

                    <img
                      src={
                        apt.images?.[0]
                          ? apt.images[0].startsWith("http")
                            ? apt.images[0]
                            : `${API_BASE}/${apt.images[0].replace(/\\/g, "/")}`
                          : "https://placehold.co/600x400"
                      }
                      alt={apt.title}
                      className="
                        w-full h-full object-cover 
                        group-hover:scale-105 transition-transform duration-300
                      "
                    />
                  </div>

                  {/* INFO */}
                  <div className="p-5">
                    <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                      {apt.title}
                    </h4>

                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {apt.description}
                    </p>

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xl font-bold text-green-700">
                        {apt.price.toLocaleString()} VNĐ
                      </span>

                      <span
                        className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${
                            apt.status === "available"
                              ? "bg-green-100 text-green-700"
                              : apt.status === "rented"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }
                        `}
                      >
                        {apt.status === "available"
                          ? "Còn trống"
                          : apt.status === "rented"
                          ? "Đang thuê"
                          : "Đã bán"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
