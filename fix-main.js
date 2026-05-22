const fs = require('fs');
let text = fs.readFileSync('d:/TiMiFood/frontend/assets/js/main.js', 'utf8');

const cutIndex = text.lastIndexOf('closeModal();');
if (cutIndex === -1) {
    console.log('Cut index not found');
    process.exit(1);
}

text = text.slice(0, cutIndex) + `closeModal();
                kiemtradangnhap();
                updateAmount();
                if (typeof startUserNotifications === 'function') startUserNotifications();
            } else {
                toast({ title: 'Lỗi', message: data.message || 'Đăng ký thất bại', type: 'error', duration: 3000 });
            }
        } catch (err) {
            toast({ title: 'Lỗi', message: 'Lỗi kết nối máy chủ', type: 'error', duration: 3000 });
        } finally {
            fbCompleteBtn.innerText = 'Xác nhận & Đăng nhập';
            fbCompleteBtn.disabled = false;
        }
    });
}

// ===================== NEWS SECTION LOGIC =====================
let globalNewsList = [];

async function showNewsSection() {
    document.getElementById('trangchu').style.display = 'none';
    const wishlistSection = document.getElementById('wishlist-section');
    if (wishlistSection) wishlistSection.style.display = 'none';
    
    document.getElementById('news-detail-section').style.display = 'none';
    document.getElementById('news-section').style.display = 'block';

    const res = await window.api.getNews();
    if (res.success) {
        globalNewsList = res.data;
        const newsListContainer = document.getElementById('news-list');
        
        if (globalNewsList.length === 0) {
            newsListContainer.innerHTML = '<div class="no-result" style="grid-column: 1 / -1; margin-top: 40px;"><div class="no-result-i" style="font-size: 80px; color: #cbd5e1; margin-bottom: 20px;"><i class="fa-light fa-newspaper"></i></div><div class="no-result-h" style="font-size: 1.2rem; color: #64748b;">Chưa có bài viết / tin tức nào</div></div>';
            return;
        }

        let html = '';
        globalNewsList.forEach(item => {
            const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN');
            html += \`
                <div class="news-card" style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease;" onclick="readNews(\${item.id})" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 25px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
                    <img src="\${item.thumbnail}" alt="" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.src='./assets/img/blank-image.png'">
                    <div class="news-card-body" style="padding: 20px;">
                        <h3 style="font-size: 1.1rem; color: #1e293b; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;">\${item.title}</h3>
                        <div style="display: flex; justify-content: space-between; color: #64748b; font-size: 0.85rem; margin-top: 15px;">
                            <span><i class="fa-light fa-user-pen"></i> \${item.author}</span>
                            <span><i class="fa-light fa-calendar"></i> \${dateStr}</span>
                        </div>
                    </div>
                </div>
            \`;
        });
        newsListContainer.innerHTML = html;
    }
}

function readNews(id) {
    const item = globalNewsList.find(n => n.id === id);
    if (!item) return;

    document.getElementById('news-section').style.display = 'none';
    document.getElementById('news-detail-section').style.display = 'block';

    const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN');
    const html = \`
        <h1 style="font-size: 2rem; color: #1e293b; margin-bottom: 15px; line-height: 1.3;">\${item.title}</h1>
        <div style="display: flex; gap: 20px; color: #64748b; font-size: 0.95rem; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
            <span><i class="fa-light fa-user-pen"></i> Tác giả: <strong>\${item.author}</strong></span>
            <span><i class="fa-light fa-calendar"></i> Xuất bản: \${dateStr}</span>
        </div>
        <div class="news-content-body" style="font-size: 1.05rem; line-height: 1.8; color: #334155;">
            <img src="\${item.thumbnail}" style="max-width: 100%; height: auto; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 25px; display: block;" onerror="this.style.display='none'">
            \${item.content}
        </div>
    \`;
    
    document.getElementById('news-detail-content').innerHTML = html;
    window.scrollTo(0, 0);
}
`;

fs.writeFileSync('d:/TiMiFood/frontend/assets/js/main.js', text, 'utf8');
console.log('Fixed main.js');
