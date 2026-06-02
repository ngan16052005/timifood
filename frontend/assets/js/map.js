let locationPickerMap = null;
let locationPickerMarker = null;
let currentTargetInputId = '';

function openLocationPicker(targetInputId) {
    currentTargetInputId = targetInputId;
    const modal = document.getElementById('location-picker-modal');
    if(modal) {
        modal.classList.add('open');
    }
    
    document.getElementById('map-address-text').textContent = "Đang tải vị trí...";
    document.getElementById('btn-confirm-location').disabled = true;

    // Initialize map if not already done
    if (!locationPickerMap) {
        locationPickerMap = L.map('map', { zoomControl: false }).setView([21.028511, 105.804817], 13); // Default Hanoi
        L.control.zoom({ position: 'bottomright' }).addTo(locationPickerMap);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(locationPickerMap);

        locationPickerMap.on('click', function(e) {
            locationPickerMap.flyTo(e.latlng, locationPickerMap.getZoom());
            setMapMarker(e.latlng.lat, e.latlng.lng);
        });
    }

    // Fix map size issues due to being hidden initially
    setTimeout(() => {
        locationPickerMap.invalidateSize();
        
        if (!locationPickerMarker) {
            getCurrentMapLocation();
        } else {
             locationPickerMap.flyTo(locationPickerMarker.getLatLng(), 15);
             // Trigger reverse geocoding to update text
             setMapMarker(locationPickerMarker.getLatLng().lat, locationPickerMarker.getLatLng().lng);
        }
    }, 200);
}

function getCurrentMapLocation() {
    if (navigator.geolocation) {
        document.getElementById('map-address-text').textContent = "Đang tải vị trí GPS...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                locationPickerMap.flyTo([lat, lng], 16);
                setMapMarker(lat, lng);
            },
            (error) => {
                console.log("GPS Error:", error);
                document.getElementById('map-address-text').textContent = "Hãy chọn vị trí trên bản đồ";
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        document.getElementById('map-address-text').textContent = "Hãy chọn vị trí trên bản đồ";
    }
}

function closeLocationPicker() {
    const modal = document.getElementById('location-picker-modal');
    if(modal) {
        modal.classList.remove('open');
    }
}

function setMapMarker(lat, lng) {
    if (locationPickerMarker) {
        locationPickerMap.removeLayer(locationPickerMarker);
    }
    
    const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    
    locationPickerMarker = L.marker([lat, lng], {icon: redIcon}).addTo(locationPickerMap);
    
    document.getElementById('map-address-text').textContent = "Đang lấy địa chỉ...";
    document.getElementById('btn-confirm-location').disabled = true;
    
    // Reverse geocoding using Nominatim with language=vi and zoom level 18 (street/building level)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi&addressdetails=1&zoom=18`)
        .then(response => response.json())
        .then(data => {
            if (data && data.address) {
                // Lọc và sắp xếp địa chỉ đẹp, chuẩn Việt Nam (Bỏ postcode, country...)
                const addr = data.address;
                const parts = [];
                if (addr.house_number || addr.street_number) parts.push(addr.house_number || addr.street_number);
                if (addr.road || addr.street) parts.push(addr.road || addr.street);
                if (addr.suburb || addr.quarter || addr.neighbourhood) parts.push(addr.suburb || addr.quarter || addr.neighbourhood);
                if (addr.city_district || addr.district || addr.county) parts.push(addr.city_district || addr.district || addr.county);
                if (addr.city || addr.town || addr.province || addr.state) parts.push(addr.city || addr.town || addr.province || addr.state);
                
                const finalAddress = parts.length > 0 ? parts.join(', ') : data.display_name.replace(/, Việt Nam|, Vietnam/g, '');
                
                document.getElementById('map-address-text').textContent = finalAddress;
                document.getElementById('btn-confirm-location').disabled = false;
            } else if (data && data.display_name) {
                document.getElementById('map-address-text').textContent = data.display_name.replace(/, Việt Nam|, Vietnam/g, '');
                document.getElementById('btn-confirm-location').disabled = false;
            } else {
                document.getElementById('map-address-text').textContent = "Không tìm thấy địa chỉ tại vị trí này";
            }
        })
        .catch(error => {
            console.error("Error geocoding:", error);
            document.getElementById('map-address-text').textContent = "Lỗi khi lấy địa chỉ";
        });
}

function searchLocationMap() {
    const query = document.getElementById('map-search-input').value;
    if (!query) return;
    
    document.getElementById('map-address-text').textContent = "Đang tìm kiếm...";
    
    // Giới hạn tìm kiếm chỉ trong lãnh thổ Việt Nam và ưu tiên tiếng Việt
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=vn&accept-language=vi`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                locationPickerMap.flyTo([lat, lon], 16);
                setMapMarker(lat, lon);
            } else {
                document.getElementById('map-address-text').textContent = "Không tìm thấy địa điểm";
            }
        })
        .catch(error => {
            console.error("Search error:", error);
            document.getElementById('map-address-text').textContent = "Lỗi tìm kiếm";
        });
}

function confirmLocation() {
    const address = document.getElementById('map-address-text').textContent;
    if (currentTargetInputId && address && address !== "Chưa chọn vị trí" && address !== "Đang lấy địa chỉ..." && address !== "Lỗi khi lấy địa chỉ" && address !== "Không tìm thấy địa chỉ tại vị trí này") {
        document.getElementById(currentTargetInputId).value = address;
        closeLocationPicker();
    }
}
