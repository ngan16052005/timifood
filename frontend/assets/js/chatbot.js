/**
 * =======================================================
 * 🧠 UPGRADED INTELLIGENT AI CHATBOT (TiMiFood AI Assistant)
 * =======================================================
 * Hybrid rules engine with Context Memory, Accent Insensitivity,
 * Budget-based Smart Querying, and Dynamic Empathy Responses.
 */

document.addEventListener("DOMContentLoaded", () => {
    initChatbot();
});

// Tiền tệ formatter fallback phòng hờ main.js chưa load kịp
function chatbotFormatVND(val) {
    if (typeof vnd === 'function') {
        return vnd(val);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

// Chuẩn hóa loại bỏ dấu tiếng Việt để so khớp từ khóa siêu chính xác
function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Hợp nhất các dấu unicode tổ hợp
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
    str = str.replace(/\u02C6|\u0306|\u031B/g, "");
    str = str.replace(/ + /g," ");
    return str.trim().toLowerCase();
}

// Đồng bộ thêm vào giỏ hàng
async function chatbotAddCart(productId) {
    let currentuser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
    let productcart = {
        id: parseInt(productId),
        soluong: 1,
        note: "Đặt hàng qua Trợ lý ảo"
    };

    try {
        const products = await window.api.getProducts();
        const pInfo = products.find(p => p.id == productId);
        if (!pInfo) {
            toast({ title: 'Lỗi', message: 'Món ăn không tồn tại!', type: 'error', duration: 3000 });
            return;
        }

        if (currentuser) {
            let vitri = currentuser.cart.findIndex(item => item.id == productcart.id);
            if (vitri == -1) {
                currentuser.cart.push(productcart);
            } else {
                currentuser.cart[vitri].soluong = parseInt(currentuser.cart[vitri].soluong) + 1;
            }
            await window.api.updateCart(currentuser.phone, currentuser.cart);
            localStorage.setItem('currentuser', JSON.stringify(currentuser));
        } else {
            let guestCart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
            let vitri = guestCart.findIndex(item => item.id == productcart.id);
            if (vitri == -1) {
                guestCart.push(productcart);
            } else {
                guestCart[vitri].soluong = parseInt(guestCart[vitri].soluong) + 1;
            }
            localStorage.setItem('cart', JSON.stringify(guestCart));
        }

        if (typeof updateAmount === 'function') updateAmount();
        if (typeof updateCartTotal === 'function') await updateCartTotal();

        toast({ 
            title: 'Thành công', 
            message: `Đã thêm món "${pInfo.title}" vào giỏ hàng!`, 
            type: 'success', 
            duration: 2500 
        });

        const headerCart = document.querySelector(".count-product-cart");
        if (headerCart) {
            headerCart.style.animation = "slidein ease 1s";
            setTimeout(() => { headerCart.style.animation = "none"; }, 1000);
        }
    } catch (error) {
        console.error("Chatbot add to cart error:", error);
        toast({ title: 'Lỗi', message: 'Không thể thêm món vào giỏ!', type: 'error', duration: 3000 });
    }
}

function initChatbot() {
    const toggleBtn = document.getElementById("chatbot-toggle-btn");
    const container = document.getElementById("chatbot-container");
    const minimizeBtn = document.getElementById("chatbot-minimize");
    const sendBtn = document.getElementById("chatbot-send-btn");
    const inputField = document.getElementById("chatbot-input");
    const messagesBody = document.getElementById("chatbot-messages");
    const quickRepliesContainer = document.getElementById("chatbot-quick-replies");

    let hasWelcomed = false;
    let liveChatActive = false;
    let clientSocket = null;
    let tempPhoneForLiveChat = null;

    // 🧠 BỘ NHỚ BỐI CẢNH HỘI THOẠI (Context Memory State Machine)
    const context = {
        waitingFor: null,  // "phone_number" | "search_keyword" | "budget" | "live_chat_phone" | "live_chat_fullname"
        lastIntent: null,
        userPhone: null
    };

    let aiChatHistory = []; // Lưu trữ lịch sử hội thoại AI

    // Danh sách câu fallback đồng cảm tự nhiên tránh trùng lặp nhàm chán
    const fallbacks = [
        "Ối, câu hỏi này hơi sâu sắc so với dữ liệu hiện tại của mình. Bạn có thể nói rõ hơn hoặc thử chọn nhanh một trong các gợi ý hữu ích dưới đây không? 🥺",
        "TiMiFood Bot chưa hiểu ý bạn lắm. Bạn có muốn mình tìm món ăn ngon, tra cứu đơn hàng hay giới thiệu voucher không nhỉ? 👇",
        "Mình vẫn đang học hỏi thêm mỗi ngày. Hãy thử gõ từ khóa đơn giản như *'tìm gà'*, *'địa chỉ'*, hoặc *'mã giảm giá'* nhé! 🌸",
        "Mình chưa bắt kịp ý của bạn. Hãy bấm các nút chức năng nhanh phía dưới để mình hỗ trợ bạn tức thì nha! 🚀"
    ];

    if (!toggleBtn || !container) return;

    // Toggle Chatbot
    toggleBtn.addEventListener("click", () => {
        const isOpen = container.classList.toggle("open");
        if (isOpen && !hasWelcomed) {
            sendWelcomeMessage();
            hasWelcomed = true;
        }
    });

    minimizeBtn.addEventListener("click", () => {
        container.classList.remove("open");
    });

    sendBtn.addEventListener("click", () => { handleUserSubmit(); });

    inputField.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleUserSubmit();
    });

    // Lời chào thông minh cá nhân hóa theo buổi trong ngày
    function sendWelcomeMessage() {
        const hour = new Date().getHours();
        let sessionGreeting = "";
        
        if (hour < 11) {
            sessionGreeting = "Chào buổi sáng tốt lành! ☀️ Chúc bạn một ngày mới ngập tràn năng lượng. Bạn đã chuẩn bị ăn sáng/trưa chưa?";
        } else if (hour >= 11 && hour < 14) {
            sessionGreeting = "Chào buổi trưa vui vẻ! 🌤️ Bụng bạn đã kêu chưa nhỉ? Để mình gợi ý vài món ăn trưa lấp đầy chiếc bụng đói nhé!";
        } else if (hour >= 14 && hour < 18) {
            sessionGreeting = "Chào buổi chiều mát mẻ! ☕ Giờ này làm một ly trà sữa kèm chút đồ ăn vặt là tuyệt vời nhất đó!";
        } else {
            sessionGreeting = "Chào buổi tối ấm áp! 🌙 Sau một ngày làm việc học tập vất vả, hãy tự thưởng cho mình bữa tối thật ngon miệng cùng TiMiFood nhé!";
        }

        showBotResponse(
            `🌸 **${sessionGreeting}**<br><br>` +
            `Mình là **Trợ lý ảo TiMiFood** 🍕. Mình có thể giúp gì cho bạn hôm nay?`
        );
        renderQuickReplies([
            { text: "🔥 Món HOT", value: "hot" },
            { text: "🔍 Tìm món ăn", value: "search" },
            { text: "💵 Gợi ý theo ví tiền", value: "budget_prompt" },
            { text: "📦 Tra cứu đơn hàng", value: "track" },
            { text: "🎁 Mã giảm giá", value: "voucher" },
            { text: "💬 Gặp nhân viên", value: "request_live_chat" }
        ]);
    }

    function renderQuickReplies(replies) {
        quickRepliesContainer.innerHTML = "";
        replies.forEach(reply => {
            const btn = document.createElement("button");
            btn.className = "quick-reply-btn";
            btn.innerText = reply.text;
            btn.addEventListener("click", () => {
                appendMessage("user", reply.text);
                processResponse(reply.value, reply.text);
            });
            quickRepliesContainer.appendChild(btn);
        });
    }

    function appendMessage(sender, text, isHTML = false) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `chat-msg ${sender}`;
        
        let formattedText = text;
        if (!isHTML) {
            formattedText = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
        }
        
        msgDiv.innerHTML = formattedText;
        messagesBody.appendChild(msgDiv);
        messagesBody.scrollTop = messagesBody.scrollHeight;
        return msgDiv;
    }

    function showTypingIndicator() {
        const indicator = document.createElement("div");
        indicator.className = "typing-indicator";
        indicator.id = "chatbot-typing-indicator";
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messagesBody.appendChild(indicator);
        messagesBody.scrollTop = messagesBody.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById("chatbot-typing-indicator");
        if (indicator) indicator.remove();
    }

    function showBotResponse(text, isHTML = false, customReplies = null) {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            appendMessage("bot", text, isHTML);
            
            if (customReplies) {
                renderQuickReplies(customReplies);
            } else {
                renderQuickReplies([
                    { text: "🔥 Món HOT", value: "hot" },
                    { text: "🔍 Tìm món ăn", value: "search" },
                    { text: "💵 Món dưới 50k", value: "under_50k" },
                    { text: "📦 Tra cứu đơn", value: "track" },
                    { text: "💬 Gặp nhân viên", value: "request_live_chat" }
                ]);
            }
        }, 700);
    }

    function handleUserSubmit() {
        const text = inputField.value.trim();
        if (text === "") return;

        appendMessage("user", text);
        inputField.value = "";
        
        if (liveChatActive) {
            // Direct message to agent via socket
            if (clientSocket && clientSocket.connected) {
                const currentuser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
                const phone = currentuser ? currentuser.phone : (tempPhoneForLiveChat || 'guest');
                clientSocket.emit('send_chat_message', {
                    room: phone,
                    sender: 'customer',
                    text: text
                });
            } else {
                appendMessage("bot", "⚠️ Mất kết nối tới máy chủ. Vui lòng thử lại sau ít giây.");
            }
        } else {
            processUserQuery(text);
        }
    }

    // 🤖 TRÌNH PHÂN TÍCH TỪ KHÓA NÂNG CAO & QUẢN LÝ BỐI CẢNH (Intelligent Intent Router)
    function processUserQuery(query) {
        const cleanQuery = query.toLowerCase();
        const normQuery = removeVietnameseTones(query);

        // A. KIỂM TRA BỐI CẢNH HỘI THOẠI TRƯỚC (Contextual States)
        if (context.waitingFor === "phone_number") {
            const phoneRegex = /\b(03|05|07|08|09)\d{8}\b/;
            const matchPhone = cleanQuery.match(phoneRegex);
            if (matchPhone) {
                context.waitingFor = null;
                processResponse("track_phone", matchPhone[0]);
                return;
            } else if (normQuery.length >= 9 && !isNaN(normQuery.replace(/\s/g, ""))) {
                context.waitingFor = null;
                processResponse("track_phone", normQuery.replace(/\s/g, ""));
                return;
            }
        }

        if (context.waitingFor === "search_keyword") {
            context.waitingFor = null;
            processResponse("search_keyword", query);
            return;
        }

        if (context.waitingFor === "budget") {
            context.waitingFor = null;
            processBudgetQuery(query);
            return;
        }

        if (context.waitingFor === "live_chat_phone") {
            const phoneRegex = /\b(03|05|07|08|09)\d{8}\b/;
            const matchPhone = cleanQuery.match(phoneRegex);
            if (matchPhone || (normQuery.length >= 9 && !isNaN(normQuery.replace(/\s/g, "")))) {
                tempPhoneForLiveChat = matchPhone ? matchPhone[0] : normQuery.replace(/\s/g, "");
                context.waitingFor = "live_chat_fullname";
                showBotResponse(
                    "Cảm ơn bạn! Cho mình xin thêm **Họ và tên** của bạn để nhân viên tiện xưng hô nhé! 🥰",
                    false,
                    [{ text: "❌ Hủy bỏ", value: "cancel_live_chat" }]
                );
            } else {
                showBotResponse("Số điện thoại không hợp lệ. Vui lòng nhập lại số điện thoại 10 chữ số.");
            }
            return;
        }

        if (context.waitingFor === "live_chat_fullname") {
            const fullname = query.trim();
            if (fullname.length >= 2) {
                context.waitingFor = null;
                startLiveChatSession(tempPhoneForLiveChat, fullname);
            } else {
                showBotResponse("Vui lòng nhập tên đầy đủ của bạn.");
            }
            return;
        }

        // B. CÁC Ý ĐỊNH ĐẶC BIỆT CẦN UI RIÊNG
        
        // 1. Ý định tra cứu đơn hàng
        const phoneDirect = cleanQuery.match(/\b(03|05|07|08|09)\d{8}\b/);
        if (phoneDirect) {
            processResponse("track_phone", phoneDirect[0]);
            return;
        }

        if (normQuery.includes("don hang") || normQuery.includes("tra cuu") || normQuery.includes("lich su") || normQuery.includes("theo doi") || normQuery.includes("don dat")) {
            processResponse("track");
            return;
        }

        // 2. Gặp nhân viên hỗ trợ trực tuyến
        if (normQuery.includes("nhan vien") || normQuery.includes("live chat") || normQuery.includes("livechat") || normQuery.includes("gap nguoi") || normQuery.includes("ho tro vien")) {
            processResponse("request_live_chat");
            return;
        }

        // C. GIAO TIẾP VỚI AI
        // Chuyển toàn bộ các truy vấn tự nhiên khác cho AI xử lý

        // C. FALLBACK THÔNG MINH (Smart Fallback Router)
        // Nếu không khớp từ khóa đặc biệt nào, bot sẽ tự động so khớp thử cụm từ đó như tên món ăn
        processResponse("search_keyword_silent", query);
    }

    // Trích xuất số tiền trong chuỗi nhập liệu
    function extractBudgetNumber(str) {
        const match = str.match(/\b(\d+)\s*(k|000)?\b/i);
        if (match) {
            let num = parseInt(match[1]);
            let suffix = match[2];
            if (suffix && suffix.toLowerCase() === 'k') return num * 1000;
            if (suffix === '000') return num * 1000;
            if (num < 1000) return num * 1000; // Tránh 50 -> 50đ, tự động hiểu 50k
            return num;
        }
        return null;
    }

    // Lọc theo ngân sách khi nhận phản hồi bối cảnh
    function processBudgetQuery(query) {
        const budget = extractBudgetNumber(removeVietnameseTones(query));
        if (budget) {
            processResponse("budget_query", budget);
        } else {
            showBotResponse("Bạn nhập số tiền chưa đúng định dạng rồi. Ví dụ bạn muốn tìm món dưới 50k, hãy gõ *'50k'* hoặc *'50000'* nhé!");
        }
    }

    // Xử lý luồng nghiệp vụ thông minh cho từng loại phản hồi
    async function processResponse(actionType, extraData = "") {
        switch (actionType) {
            case "hot":
                try {
                    const products = await window.api.getProducts();
                    const activeProducts = products.filter(p => p.status == 1);
                    activeProducts.sort((a,b) => (b.avgRating || 0) - (a.avgRating || 0));
                    const topProducts = activeProducts.slice(0, 3);

                    if (topProducts.length === 0) {
                        showBotResponse("TiMiFood hiện đang làm mới thực đơn, bạn vui lòng tham khảo các món ăn khác trên thanh Menu chính nhé!");
                    } else {
                        let html = `🏆 Dưới đây là **Top 3 món ăn được yêu thích hàng đầu hôm nay** tại TiMiFood. Bạn có thể nhấn đặt nhanh trực tiếp nhé!
                                    <div class="chat-products-wrapper">`;
                        topProducts.forEach(p => {
                            html += `
                                <div class="chat-product-card">
                                    <img src="${p.img}" class="chat-product-img" onerror="this.src='./assets/img/blank-image.png'">
                                    <div class="chat-product-info">
                                        <p class="chat-product-title">${p.title}</p>
                                        <p class="chat-product-price">${chatbotFormatVND(p.price)}</p>
                                        <button class="chat-product-btn" onclick="chatbotAddCart('${p.id}')"><i class="fa-solid fa-cart-plus"></i> Đặt món</button>
                                    </div>
                                </div>
                            `;
                        });
                        html += `</div>`;
                        showBotResponse(html, true);
                    }
                } catch (error) {
                    showBotResponse("Đã xảy ra lỗi khi lấy danh sách món ăn, bạn vui lòng reload lại trang nhé!");
                }
                break;

            case "search":
                context.waitingFor = "search_keyword";
                showBotResponse(
                    "Bạn muốn tìm kiếm món ăn gì nào? 🔍 Hãy gõ từ khóa tên món ăn (ví dụ: *'cà phê'*, *'mì'*, *'bánh mì'*) để mình quét thực đơn tìm giúp bạn ngay nhé!"
                );
                break;

            case "search_keyword":
                try {
                    const products = await window.api.getProducts();
                    const matched = products.filter(p => 
                        p.status == 1 && 
                        (p.title.toLowerCase().includes(extraData.toLowerCase()) || 
                         removeVietnameseTones(p.title).includes(removeVietnameseTones(extraData)))
                    );

                    if (matched.length === 0) {
                        showBotResponse(
                            `Tiếc quá, mình chưa tìm thấy món ăn nào khớp với từ khóa **"${extraData}"** của bạn. 😢<br>` +
                            "Bạn hãy thử tìm từ khóa khác đơn giản hơn như *'cơm'*, *'mì'*, *'trà sữa'* hoặc xem đầy đủ thực đơn tại trang chủ nhé!"
                        );
                    } else {
                        const topResults = matched.slice(0, 3);
                        let html = `🎉 Tìm thấy **${matched.length}** món ăn phù hợp với yêu cầu của bạn. Dưới đây là các kết quả nổi bật nhất:<br>
                                    <div class="chat-products-wrapper">`;
                        topResults.forEach(p => {
                            html += `
                                <div class="chat-product-card">
                                    <img src="${p.img}" class="chat-product-img" onerror="this.src='./assets/img/blank-image.png'">
                                    <div class="chat-product-info">
                                        <p class="chat-product-title">${p.title}</p>
                                        <p class="chat-product-price">${chatbotFormatVND(p.price)}</p>
                                        <button class="chat-product-btn" onclick="chatbotAddCart('${p.id}')"><i class="fa-solid fa-cart-plus"></i> Đặt món</button>
                                    </div>
                                </div>
                            `;
                        });
                        html += `</div>`;
                        showBotResponse(html, true);
                    }
                } catch (e) {
                    showBotResponse("Không thể hoàn tất tìm kiếm món ăn lúc này. Vui lòng thử lại sau!");
                }
                break;

            case "search_keyword_silent":
                try {
                    const response = await fetch(`${window.BACKEND_URL}/api/chat/ai`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: extraData, history: aiChatHistory.slice(-4) }) // Giữ 4 tin nhắn gần nhất làm context
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        // Chỉ cập nhật lịch sử khi API thành công
                        aiChatHistory.push({ role: 'customer', text: extraData });
                        aiChatHistory.push({ role: 'bot', text: result.reply });

                        let html = result.reply;

                        // Parse [SUGGEST:id] tags embedded in text
                        const suggestRegex = /\[SUGGEST:(.*?)\]/g;
                        let match;
                        let suggestedIds = [];
                        
                        while ((match = suggestRegex.exec(html)) !== null) {
                            // Bỏ 'SP' prefix nếu có
                            suggestedIds.push(match[1].replace('SP', '').trim());
                        }
                        
                        // Remove the tags from the text so they don't show up in UI
                        html = html.replace(/\[SUGGEST:(.*?)\]/g, '');
                        
                        if (result.suggestedProduct) {
                            suggestedIds.push(result.suggestedProduct.replace('SP', '').trim());
                        }

                        // Remove duplicates
                        suggestedIds = [...new Set(suggestedIds)];

                        if (suggestedIds.length > 0) {
                            const products = await window.api.getProducts();
                            let productsHtml = `<div class="chat-products-wrapper" style="margin-top: 10px;">`;
                            let hasProducts = false;
                            
                            suggestedIds.forEach(id => {
                                const p = products.find(prod => prod.id == id);
                                if (p) {
                                    hasProducts = true;
                                    productsHtml += `
                                    <div class="chat-product-card">
                                        <img src="${p.img}" class="chat-product-img" onerror="this.src='./assets/img/blank-image.png'">
                                        <div class="chat-product-info">
                                            <p class="chat-product-title">${p.title}</p>
                                            <p class="chat-product-price">${chatbotFormatVND(p.price)}</p>
                                            <button class="chat-product-btn" onclick="chatbotAddCart('${p.id}')"><i class="fa-solid fa-cart-plus"></i> Đặt món</button>
                                        </div>
                                    </div>`;
                                }
                            });
                            
                            productsHtml += `</div>`;
                            if (hasProducts) {
                                html += productsHtml;
                            }
                        }

                        // Replace markdown bold with strong
                        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                   .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                   .replace(/\n/g, '<br>');
                        showBotResponse(html, true);
                    } else {
                        // Nếu AI fail hoặc API lỗi, dùng fallback mặc định
                        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
                        showBotResponse(randomFallback);
                    }
                } catch (e) {
                    console.error('AI Error:', e);
                    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
                    showBotResponse(randomFallback);
                }
                break;

            case "budget_prompt":
                context.waitingFor = "budget";
                showBotResponse(
                    "💵 Bạn muốn tìm món ăn trong tầm giá khoảng bao nhiêu tiền nào? <br>" +
                    "Hãy gõ số tiền (ví dụ: *'30k'*, *'50k'*, *'100k'*) để mình tự động sàng lọc những món phù hợp nhất với ví tiền của bạn nhé! 😄"
                );
                break;

            case "budget_query":
                try {
                    const limit = parseInt(extraData);
                    const products = await window.api.getProducts();
                    const matched = products.filter(p => p.status == 1 && p.price <= limit);

                    if (matched.length === 0) {
                        showBotResponse(
                            `Rất tiếc, hiện tại TiMiFood không có món nào có giá dưới **${chatbotFormatVND(limit)}**. 😢<br>` +
                            "Bạn hãy nâng hạn mức chi tiêu lên một chút hoặc xem danh sách món ăn HOT nhất của tiệm nhé!"
                        );
                    } else {
                        // Sắp xếp rating giảm dần
                        matched.sort((a,b) => (b.avgRating || 0) - (a.avgRating || 0));
                        const topResults = matched.slice(0, 3);
                        let html = `🎯 Mình tìm thấy **${matched.length}** món ăn cực ngon có giá dưới **${chatbotFormatVND(limit)}** cực kỳ vừa vặn túi tiền của bạn đây:<br>
                                    <div class="chat-products-wrapper">`;
                        topResults.forEach(p => {
                            html += `
                                <div class="chat-product-card">
                                    <img src="${p.img}" class="chat-product-img" onerror="this.src='./assets/img/blank-image.png'">
                                    <div class="chat-product-info">
                                        <p class="chat-product-title">${p.title}</p>
                                        <p class="chat-product-price">${chatbotFormatVND(p.price)}</p>
                                        <button class="chat-product-btn" onclick="chatbotAddCart('${p.id}')"><i class="fa-solid fa-cart-plus"></i> Đặt món</button>
                                    </div>
                                </div>
                            `;
                        });
                        html += `</div>`;
                        showBotResponse(html, true);
                    }
                } catch (error) {
                    showBotResponse("Đã xảy ra lỗi khi lọc món ăn theo ngân sách. Vui lòng thử lại sau!");
                }
                break;

            case "track":
                const currentuser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
                if (!currentuser) {
                    context.waitingFor = "phone_number";
                    showBotResponse(
                        "Bạn chưa đăng nhập tài khoản khách hàng.<br>" +
                        "Hãy gõ **số điện thoại** dùng để đặt đơn hàng của bạn (ví dụ: *'0345975990'*) để mình tra cứu trạng thái giao nhận trực tuyến giúp nhé! 📦"
                    );
                } else {
                    renderUserOrdersTimeline(currentuser.phone);
                }
                break;

            case "track_phone":
                renderUserOrdersTimeline(extraData);
                break;

            case "voucher":
                showBotResponse(
                    "🎁 **Danh sách các mã ưu đãi / Vouchers HOT nhất tại TiMiFood:**<br><br>" +
                    "1️⃣ **TIMI50** - Giảm **50%** tối đa 50K cho hóa đơn đầu tiên.<br>" +
                    "2️⃣ **HELLOTIMI** - Giảm trực tiếp **20.000đ** cho đơn từ 100K.<br>" +
                    "3️⃣ **FREESHIP** - Miễn phí vận chuyển (tối đa 30K) cho mọi đơn từ 150K.<br><br>" +
                    "💡 *Cách sử dụng:* Nhập mã trên vào ô **Mã giảm giá** ở bước thanh toán đơn hàng để được áp dụng ngay lập tức nhé! 🎉"
                );
                break;

            case "guide":
                showBotResponse(
                    "🛒 **Các bước đặt hàng vô cùng đơn giản tại TiMiFood:**<br>" +
                    "1️⃣ **Bước 1 (Chọn món):** Nhấn **'Đặt món'** trực tiếp từ trang chủ hoặc chi tiết món để đưa vào giỏ hàng.<br>" +
                    "2️⃣ **Bước 2 (Vào giỏ):** Click biểu tượng giỏ hàng ở góc phải phía trên màn hình, điền mã giảm giá nếu có.<br>" +
                    "3️⃣ **Bước 3 (Thanh toán):** Chọn **'Thanh toán'**, cập nhật địa chỉ, tên, sđt và hình thức nhận (Giao tận nơi hoặc Tự đến lấy). Nhấp **'Đặt hàng'** là xong!<br><br>" +
                    "Chúc bạn có một trải nghiệm đặt món trọn vẹn và ngon miệng nhé! 🍕"
                );
                break;

            case "request_live_chat":
                handleLiveChatEscalation();
                break;

            case "cancel_live_chat":
                context.waitingFor = null;
                tempPhoneForLiveChat = null;
                showBotResponse("Đã hủy yêu cầu gặp nhân viên. Trợ lý ảo sẵn sàng giải đáp các câu hỏi khác của bạn!");
                break;

            case "exit_live_chat":
                if (clientSocket) {
                    const currentuser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
                    const phone = currentuser ? currentuser.phone : (tempPhoneForLiveChat || 'guest');
                    clientSocket.emit('end_live_chat', {
                        customerPhone: phone
                    });
                }
                endLiveChatSessionLocal();
                break;
        }
    }

    // Trích xuất đơn hàng thực tế và render Timeline trạng thái trực quan
    async function renderUserOrdersTimeline(phone) {
        try {
            const orders = await window.api.getOrders();
            const userOrders = orders.filter(o => o.phone == phone || o.sdtnhan == phone);

            if (userOrders.length === 0) {
                showBotResponse(`Không tìm thấy dữ liệu đơn hàng nào được liên kết với số điện thoại **${phone}**. Bạn vui lòng kiểm tra chính xác lại số điện thoại đặt hàng nhé!`);
                return;
            }

            userOrders.sort((a,b) => new Date(b.thoigiandat) - new Date(a.thoigiandat));
            const latestOrders = userOrders.slice(0, 2);

            let html = `Đã tìm thấy lịch sử giao dịch liên kết với số điện thoại **${phone}**. Dưới đây là trạng thái đơn hàng thời gian thực:<br>`;

            latestOrders.forEach(order => {
                let statusText = "Chờ xử lý";
                let timelineHtml = "";
                
                if (order.trangthai === 0) {
                    statusText = "Đang chuẩn bị 🍳";
                    timelineHtml = `
                        <div class="chat-order-timeline">
                            <div class="chat-timeline-item completed">Đã đặt hàng</div>
                            <div class="chat-timeline-item active">Đang chuẩn bị</div>
                            <div class="chat-timeline-item">Đang giao hàng</div>
                            <div class="chat-timeline-item">Đã nhận hàng</div>
                        </div>
                    `;
                } else if (order.trangthai === 1) {
                    statusText = "Đang giao hàng 🚚";
                    timelineHtml = `
                        <div class="chat-order-timeline">
                            <div class="chat-timeline-item completed">Đã đặt hàng</div>
                            <div class="chat-timeline-item completed">Đang chuẩn bị</div>
                            <div class="chat-timeline-item active">Đang giao hàng</div>
                            <div class="chat-timeline-item">Đã nhận hàng</div>
                        </div>
                    `;
                } else if (order.trangthai === 2) {
                    statusText = "Đã hoàn thành 🎉";
                    timelineHtml = `
                        <div class="chat-order-timeline">
                            <div class="chat-timeline-item completed">Đã đặt hàng</div>
                            <div class="chat-timeline-item completed">Đang chuẩn bị</div>
                            <div class="chat-timeline-item completed">Đang giao hàng</div>
                            <div class="chat-timeline-item completed active">Đã nhận hàng</div>
                        </div>
                    `;
                } else {
                    statusText = "Đã hủy đơn ❌";
                    timelineHtml = `
                        <div class="chat-order-timeline">
                            <div class="chat-timeline-item active" style="color: var(--red);">Đơn hàng đã bị hủy bỏ</div>
                        </div>
                    `;
                }

                html += `
                    <div style="margin-top: 14px; padding: 10px; border-radius: 8px; background: white; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.02);">
                        <p style="margin:0 0 4px 0; font-size:12.5px;">Mã đơn: <span style="font-weight:700; color:var(--red);">${order.id}</span></p>
                        <p style="margin:0 0 4px 0; font-size:12px; color:#64748b;">Tổng tiền: <strong>${chatbotFormatVND(order.tongtien)}</strong></p>
                        <p style="margin:0 0 8px 0; font-size:12px; color:#64748b;">Trạng thái: <span style="font-weight:600; color:#1e293b;">${statusText}</span></p>
                        ${timelineHtml}
                    </div>
                `;
            });

            showBotResponse(html, true);

        } catch (error) {
            console.error("Error fetching order for chatbot:", error);
            showBotResponse("Đã xảy ra lỗi hệ thống khi kiểm tra đơn hàng, vui lòng thử lại sau!");
        }
    }

    // --- 💬 Live Chat Escalation System Helpers ---

    function handleLiveChatEscalation() {
        const currentuser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
        if (currentuser) {
            // User logged in, immediately start live chat
            startLiveChatSession(currentuser.phone, currentuser.fullname);
        } else {
            // Not logged in, prompt for credentials
            context.waitingFor = "live_chat_phone";
            showBotResponse(
                "Để kết nối trực tiếp với nhân viên hỗ trợ, bạn vui lòng nhập **Số điện thoại** của mình nhé! 😊",
                false,
                [{ text: "❌ Hủy bỏ", value: "cancel_live_chat" }]
            );
        }
    }

    function startLiveChatSession(phone, fullname) {
        liveChatActive = true;
        showBotResponse(
            `🔄 Đang kết nối bạn tới Nhân viên hỗ trợ...<br>` +
            `*Khách hàng: ${fullname} (${phone})*<br>` +
            `Vui lòng chờ trong giây lát.`,
            false,
            [{ text: "❌ Thoát Live Chat", value: "exit_live_chat" }]
        );

        if (clientSocket) {
            try {
                clientSocket.disconnect();
            } catch (e) {}
            clientSocket = null;
        }

        if (typeof io !== 'undefined') {
            clientSocket = io(window.SOCKET_URL, { autoConnect: false, transports: ['websocket'] });
            
            clientSocket.on('connect', () => {
                console.log('[Socket] Customer connected for live chat:', phone);
                clientSocket.emit('joinUser', phone);
                clientSocket.emit('client_request_live_chat', {
                    phone: phone,
                    fullname: fullname
                });
            });

            clientSocket.on('staff_join_chat', (data) => {
                appendMessage("bot", `👨‍💼 Nhân viên **${data.staffName}** đã tham gia hỗ trợ bạn! Bạn có thể gửi tin nhắn trao đổi trực tiếp.`);
            });

            clientSocket.on('receive_chat_message', (data) => {
                if (data.sender === 'staff' || data.message?.sender === 'staff') {
                    const text = data.text || data.message?.text;
                    if (text) appendMessage("bot", text);
                }
            });

            clientSocket.on('end_live_chat', () => {
                appendMessage("bot", `🌸 Phiên hỗ trợ trực tuyến đã kết thúc. Bạn đã được chuyển lại về Trợ lý ảo TiMiFood.`);
                endLiveChatSessionLocal();
            });

            clientSocket.on('disconnect', () => {
                console.warn('[Socket] Customer socket disconnected');
            });

            clientSocket.connect();
        } else {
            appendMessage("bot", "⚠️ Lỗi: Không thể tải thư viện kết nối real-time.");
            liveChatActive = false;
        }
    }

    function endLiveChatSessionLocal() {
        liveChatActive = false;
        if (clientSocket) {
            clientSocket.disconnect();
            clientSocket = null;
        }
        tempPhoneForLiveChat = null;
        context.waitingFor = null;
        showBotResponse(
            "Đã quay trở lại chế độ Trợ lý ảo TiMiFood. Hãy chọn các nút gợi ý nhanh bên dưới nếu cần giúp đỡ nhé! 👇"
        );
    }
}
