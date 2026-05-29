let newsDataStore = [];

async function showNews() {
    try {
        const response = await window.api.getAdminNews();
        if (response.success) {
            newsDataStore = response.data;
            renderNewsTable(newsDataStore);
        }
    } catch (error) {
        console.error("Lỗi lấy danh sách tin tức:", error);
        toast({ title: 'Lỗi', message: 'Không thể tải danh sách bài viết!', type: 'error', duration: 3000 });
    }
}

function renderNewsTable(data) {
    const tbody = document.getElementById('show-news');
    const searchInput = document.getElementById('form-search-news').value.toLowerCase();
    
    let filteredData = data;
    if (searchInput) {
        filteredData = data.filter(item => 
            item.title.toLowerCase().includes(searchInput) || 
            item.author.toLowerCase().includes(searchInput)
        );
    }

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="no-result" style="padding: 30px 0;"><div class="no-result-i" style="font-size: 60px; color: #cbd5e1; margin-bottom: 15px;"><i class="fa-light fa-newspaper"></i></div><div class="no-result-h" style="font-size: 1.1rem; color: #64748b;">Chưa có bài viết / tin tức nào</div></div></td></tr>';
        return;
    }

    let html = '';
    filteredData.forEach(item => {
        const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN');
        const statusBadge = item.status === 1 
            ? '<span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Hiển thị</span>'
            : '<span style="background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Đã ẩn</span>';

        html += `
            <tr>
                <td>${item.id}</td>
                <td><img src="${item.thumbnail}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.src='./assets/img/blank-image.png'"></td>
                <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.title}">${item.title}</td>
                <td>${item.author}</td>
                <td>${dateStr}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-edit" onclick="editNews('${item.id}')" title="Chỉnh sửa"><i class="fa-light fa-pen-to-square"></i></button>
                    <button class="btn-delete" onclick="deleteNews('${item.id}')" title="Xóa"><i class="fa-light fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function openAddNewsModal() {
    document.querySelectorAll('.add-news-e').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.edit-news-e').forEach(el => el.style.display = 'none');
    
    // Clear form
    document.getElementById('news-form').reset();
    document.getElementById('news-id').value = '';
    document.getElementById('news-img-url').value = '';
    document.getElementById('news-img-preview').src = './assets/img/blank-image.png';
    document.getElementById('news-author').value = 'Admin';
    document.getElementById('news-status').value = '1';
    
    document.querySelector('.add-news-modal').classList.add('open');
}

function closeNewsModal() {
    document.querySelector('.add-news-modal').classList.remove('open');
}

function uploadNewsImage(input) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("news-img-preview").src = e.target.result;
            // Vì chúng ta đang dùng LocalStorage/Frontend API, lưu trực tiếp chuỗi Base64
            document.getElementById("news-img-url").value = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function submitNews(e) {
    e.preventDefault();
    
    const title = document.getElementById('news-title').value;
    const author = document.getElementById('news-author').value;
    const status = document.getElementById('news-status').value;
    const content = document.getElementById('news-content').value;
    let thumbnail = document.getElementById('news-img-url').value || './assets/img/blank-image.png';

    const newsData = { title, author, status: parseInt(status), content, thumbnail };

    try {
        const res = await window.api.addNews(newsData);
        if (res.success) {
            toast({ title: 'Thành công', message: 'Thêm bài viết mới thành công!', type: 'success', duration: 3000 });
            closeNewsModal();
            showNews();
        }
    } catch (error) {
        toast({ title: 'Lỗi', message: error.message || 'Không thể thêm bài viết!', type: 'error', duration: 3000 });
    }
}

function editNews(id) {
    const newsItem = newsDataStore.find(n => n.id === id);
    if (!newsItem) return;

    document.querySelectorAll('.add-news-e').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.edit-news-e').forEach(el => el.style.display = 'block');

    document.getElementById('news-id').value = newsItem.id;
    document.getElementById('news-title').value = newsItem.title;
    document.getElementById('news-author').value = newsItem.author;
    document.getElementById('news-status').value = newsItem.status;
    document.getElementById('news-content').value = newsItem.content;
    document.getElementById('news-img-url').value = newsItem.thumbnail;
    document.getElementById('news-img-preview').src = newsItem.thumbnail || './assets/img/blank-image.png';

    document.querySelector('.add-news-modal').classList.add('open');
}

async function updateNews() {
    const id = document.getElementById('news-id').value;
    const title = document.getElementById('news-title').value;
    const author = document.getElementById('news-author').value;
    const status = document.getElementById('news-status').value;
    const content = document.getElementById('news-content').value;
    let thumbnail = document.getElementById('news-img-url').value || './assets/img/blank-image.png';

    const newsData = { title, author, status: parseInt(status), content, thumbnail };

    try {
        const res = await window.api.updateNews(id, newsData);
        if (res.success) {
            toast({ title: 'Thành công', message: 'Cập nhật bài viết thành công!', type: 'success', duration: 3000 });
            closeNewsModal();
            showNews();
        }
    } catch (error) {
        toast({ title: 'Lỗi', message: error.message || 'Không thể cập nhật bài viết!', type: 'error', duration: 3000 });
    }
}

async function deleteNews(id) {
    if (confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.")) {
        try {
            const res = await window.api.deleteNews(id);
            if (res.success) {
                toast({ title: 'Thành công', message: 'Đã xóa bài viết!', type: 'success', duration: 3000 });
                showNews();
            }
        } catch (error) {
            toast({ title: 'Lỗi', message: error.message || 'Không thể xóa bài viết!', type: 'error', duration: 3000 });
        }
    }
}
