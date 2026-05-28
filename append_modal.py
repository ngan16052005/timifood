import codecs

modal_html = """
    <div class="modal location-picker-modal" id="location-picker-modal">
        <div class="modal-container" style="max-width: 800px; width: 90%; background-color: #fff; border-radius: 8px; position: relative;">
            <h3 class="modal-container-title" style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; margin: 0; font-size: 1.25rem;"><i class="fa-light fa-map-location-dot" style="margin-right: 8px; color: #ef4444;"></i> CHỌN VỊ TRÍ TRÊN BẢN ĐỒ</h3>
            <button type="button" class="btn-close" onclick="closeLocationPicker()" style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer;"><i class="fa-regular fa-xmark"></i></button>
            <div class="modal-content" style="padding: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <input type="text" id="map-search-input" class="form-control" placeholder="Tìm kiếm địa điểm..." style="flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    <button type="button" onclick="searchLocationMap()" style="padding: 0 20px; background-color: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;"><i class="fa-regular fa-search" style="margin-right: 5px;"></i>Tìm</button>
                </div>
                <div id="map" style="height: 400px; width: 100%; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 15px; background-color: #f8fafc; z-index: 1;"></div>
                <div style="padding: 10px 15px; background-color: #f1f5f9; border-radius: 4px; color: #334155; font-size: 0.95rem; display: flex; align-items: flex-start; gap: 10px;">
                    <i class="fa-solid fa-location-dot" style="color: #ef4444; margin-top: 4px;"></i>
                    <span id="map-address-text" style="flex: 1;">Chưa chọn vị trí</span>
                </div>
                <div class="modal-content-bottom" style="display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px;">
                    <button type="button" style="padding: 10px 20px; background-color: #cbd5e1; color: #334155; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;" onclick="closeLocationPicker()">Hủy</button>
                    <button type="button" id="btn-confirm-location" style="padding: 10px 20px; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;" onclick="confirmLocation()" disabled>Xác nhận</button>
                </div>
            </div>
        </div>
    </div>
"""

with codecs.open('frontend/components/modals.html', 'a', encoding='utf-8') as f:
    f.write(modal_html)

print("Modal appended successfully.")
