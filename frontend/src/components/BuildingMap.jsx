import React from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "16px",
};

const center = {
  lat: 10.780083, // ⭐ Thay bằng tọa độ tòa nhà của bạn
  lng: 106.699981,
};

const BuildingMap = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-red-600">
        Không tải được bản đồ (API Key lỗi hoặc chưa enable Maps API)
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin h-7 w-7 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={16}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
      }}
    >
      <Marker position={center} />
    </GoogleMap>
  );
};

export default React.memo(BuildingMap);
