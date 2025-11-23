import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";

const HomePage = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  // ⭐ Lấy danh sách featured
  const fetchFeatured = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/apartments/featured`);
      setApartments(data.apartments || []);
    } catch {
      setError("Không thể tải căn hộ nổi bật");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Tìm kiếm nhưng vẫn chỉ lấy các featured
  const handleSearch = async () => {
    if (!keyword.trim()) return fetchFeatured();

    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/apartments/search`, {
        params: { q: keyword },
      });

      const featuredOnly = data.filter((apt) => apt.featured === true);
      setApartments(featuredOnly);

    } catch {
      setError("Tìm kiếm thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* LOADING UI */}
      {loading && (
        <div className="w-full flex justify-center items-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* HERO + SEARCH */}
      {!loading && (
        <>
          <section className="relative w-full h-[360px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=60"
              alt="Hero"
              className="absolute inset-0 w-full h-full object-cover brightness-75"
            />
            <div className="relative z-10 flex items-center justify-center h-full">
              <div className="w-11/12 md:w-1/2 mx-auto px-4 -mt-8">
                <div className="bg-white shadow-2xl rounded-2xl p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Tìm kiếm căn hộ nổi bật
                  </h2>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="Nhập từ khóa (tên căn hộ, mô tả...)"
                        className="w-full p-4 pl-12 border border-gray-300 rounded-xl
                                  focus:ring-2 focus:ring-green-300 focus:border-green-600
                                  outline-none text-gray-800"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                      />
                      <span className="absolute left-4 top-4 text-gray-400 text-xl">🔍</span>
                    </div>
                    <button
                      onClick={handleSearch}
                      className="bg-green-700 hover:bg-green-800 
                                 px-6 py-3 rounded-xl text-white font-semibold shadow
                                 transition"
                    >
                      Tìm kiếm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TITLE */}
          <h2 className="mt-5 text-3xl font-bold text-center text-green-700 mb-8">
            CĂN HỘ NỔI BẬT
          </h2>

          {/* ⭐ SLIDER NGANG */}
          <div className="max-w-7xl mx-auto px-6 mb-16">
            <div className="w-full overflow-x-auto scrollbar-hide">
              <div className="flex gap-6 pb-4">
                {apartments.map((apt) => (
                  <Link
                    key={apt._id}
                    to={`/apartment/${apt._id}`}
                    className="min-w-[300px] max-w-[300px] bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl border border-gray-100 transition-all"
                  >
                    <div className="relative h-48 w-full overflow-hidden">
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
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-5">
                      <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                        {apt.title}
                      </h4>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {apt.description}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xl font-bold text-green-700">
                          {apt.price.toLocaleString()} VNĐ
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default HomePage;
