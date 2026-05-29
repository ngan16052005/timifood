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
        locationPickerMap = L.map('map').setView([21.028511, 105.804817], 13); // Default Hanoi
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(locationPickerMap);

        locationPickerMap.on('click', function(e) {
            setMapMarker(e.latlng.lat, e.latlng.lng);
        });
    }

    // Fix map size issues due to being hidden initially
    setTimeout(() => {
        locationPickerMap.invalidateSize();
        
        // Try to get user's current location if marker is not set yet
        if (!locationPickerMarker && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    locationPickerMap.setView([lat, lng], 15);
                    setMapMarker(lat, lng);
                },
                () => {
                    // Fallback to default
                    document.getElementById('map-address-text').textContent = "Hãy chọn vị trí trên bản đồ";
                }
            );
        } else if (locationPickerMarker) {
             locationPickerMap.setView(locationPickerMarker.getLatLng(), 15);
        } else {
             document.getElementById('map-address-text').textContent = "Hãy chọn vị trí trên bản đồ";
        }
    }, 200);
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
    
    // Reverse geocoding using Nominatim
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.display_name) {
                // Let's use display_name
                document.getElementById('map-address-text').textContent = data.display_name;
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
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                locationPickerMap.setView([lat, lon], 15);
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
