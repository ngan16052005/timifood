function emailIsValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function openCreateAccount() {
    document.querySelector(".signup").classList.add("open");
    document.querySelectorAll(".edit-account-e").forEach(item => {
        item.style.display = "none"
    })
    document.querySelectorAll(".add-account-e").forEach(item => {
        item.style.display = "block"
    })
}

function signUpFormReset() {
    document.getElementById('fullname').value = ""
    document.getElementById('user-email').value = ""
    document.getElementById('phone').value = ""
    document.getElementById('password').value = ""
    document.querySelector('.form-message-name').innerHTML = '';
    document.querySelector('.form-message-email').innerHTML = '';
    document.querySelector('.form-message-phone').innerHTML = '';
    document.querySelector('.form-message-password').innerHTML = '';
}

function showUserArr(arr) {
    let accountHtml = '';
    if (!Array.isArray(arr) || arr.length == 0) {
        accountHtml = `<td colspan="5">Không có dữ liệu</td>`
    } else {
        arr.forEach((account, index) => {
            let roleLabel = "";
            if (account.userType == 1) roleLabel = `<span class="status-complete" style="background-color: #ff4757;">Quản trị</span>`;
            else if (account.userType == 2) roleLabel = `<span class="status-complete" style="background-color: #3742fa;">Nhân viên</span>`;
            else if (account.userType == 3) roleLabel = `<span class="status-complete" style="background-color: #ffa502;">Vận chuyển</span>`;
            else roleLabel = `<span class="status-no-complete" style="background-color: #747d8c;">Khách hàng</span>`;

            let tinhtrang = account.status == 0 ? `<span class="status-no-complete">Bị khóa</span>` : `<span class="status-complete">Hoạt động</span>`;
            accountHtml += ` <tr>
            <td>${index + 1}</td>
            <td>${account.fullname}</td>
            <td>${account.phone}</td>
            <td>${account.email || 'Chưa có'}</td>
            <td>${formatDate(account.join)}</td>
            <td>${roleLabel}</td>
            <td>${tinhtrang}</td>
            <td class="control control-table">
            <button class="btn-edit" id="edit-account" onclick="editAccount('${account.phone}')" ><i class="fa-light fa-pen-to-square"></i></button>
            <button class="btn-delete" id="delete-account" onclick="deleteAcount('${account.phone}')"><i class="fa-regular fa-trash"></i></button>
            </td>
        </tr>`
        })
    }
    document.getElementById('show-user').innerHTML = accountHtml;
}

async function showUser() {
    let tinhTrang = parseInt(document.getElementById("tinh-trang-user").value);
    let ct = document.getElementById("form-search-user").value;
    let timeStart = document.getElementById("time-start-user").value;
    let timeEnd = document.getElementById("time-end-user").value;

    if (timeEnd < timeStart && timeEnd != "" && timeStart != "") {
        alert("Lựa chọn thời gian sai !");
        return;
    }

    try {
        const accounts = await window.api.getUsers();
        let result = tinhTrang == 2 ? accounts : accounts.filter(item => item.status == tinhTrang);

        result = ct == "" ? result : result.filter((item) => {
            return (item.fullname.toLowerCase().includes(ct.toLowerCase()) || item.phone.toString().toLowerCase().includes(ct.toLowerCase()));
        });

        if (timeStart != "" && timeEnd == "") {
            result = result.filter((item) => {
                return new Date(item.join) >= new Date(timeStart).setHours(0, 0, 0);
            });
        } else if (timeStart == "" && timeEnd != "") {
            result = result.filter((item) => {
                return new Date(item.join) <= new Date(timeEnd).setHours(23, 59, 59);
            });
        } else if (timeStart != "" && timeEnd != "") {
            result = result.filter((item) => {
                return (new Date(item.join) >= new Date(timeStart).setHours(0, 0, 0) && new Date(item.join) <= new Date(timeEnd).setHours(23, 59, 59)
                );
            });
        }
        showUserArr(result);
    } catch (error) {
        console.error("Error searching users:", error);
    }
}

async function cancelSearchUser() {
    document.getElementById("tinh-trang-user").value = 2;
    document.getElementById("form-search-user").value = "";
    document.getElementById("time-start-user").value = "";
    document.getElementById("time-end-user").value = "";
    await initAdmin();
}

// Removed duplicate window.onload assignment

async function deleteAcount(phone) {
    if (confirm("Bạn có chắc muốn xóa?")) {
        try {
            await window.api.deleteUser(phone);
            toast({ title: 'Thành công', message: 'Xóa tài khoản thành công!', type: 'success', duration: 3000 });
            showUser();
        } catch (error) {
            toast({ title: 'Lỗi', message: 'Không thể xóa tài khoản!', type: 'error', duration: 3000 });
        }
    }
}

let indexFlag;
async function editAccount(phone) {
    document.querySelector(".signup").classList.add("open");
    document.querySelectorAll(".add-account-e").forEach(item => {
        item.style.display = "none"
    })
    document.querySelectorAll(".edit-account-e").forEach(item => {
        item.style.display = "block"
    })
    try {
        const accounts = await window.api.getUsers();
        let user = accounts.find(item => item.phone == phone);
        if (!user) return;

        document.getElementById("fullname").value = user.fullname;
        document.getElementById("user-email").value = user.email || "";
        document.getElementById("phone").value = user.phone;
        document.getElementById("phone").disabled = true; // Don't allow changing phone
        document.getElementById("password").value = user.password;
        document.getElementById("user-role").value = user.userType;
        document.getElementById("user-status").checked = user.status == 1 ? true : false;
    } catch (error) {
        console.error("Edit account fetch error:", error);
    }
}

updateAccount.addEventListener("click", async (e) => {
    e.preventDefault();
    let fullname = document.getElementById("fullname").value;
    let email = document.getElementById("user-email").value;
    let phone = document.getElementById("phone").value;
    let password = document.getElementById("password").value;
    let userRole = document.getElementById("user-role").value;
    let status = document.getElementById("user-status").checked ? 1 : 0;

    if (fullname == "" || phone == "" || password == "" || email == "") {
        toast({ title: 'Cảnh báo', message: 'Vui lòng nhập đầy đủ thông tin!', type: 'warning', duration: 3000 });
        return;
    }

    if (!emailIsValid(email)) {
        document.querySelector('.form-message-email').innerHTML = 'Email không hợp lệ';
        return;
    }

    try {
        const userObj = {
            fullname: fullname,
            email: email,
            phone: phone,
            password: password,
            userType: parseInt(userRole),
            status: status
        };
        const result = await window.api.updateUser(phone, userObj);
        if (result && result.success) {
            toast({ title: 'Thành công', message: 'Cập nhật tài khoản thành công!', type: 'success', duration: 3000 });
            document.querySelector(".modal.signup").classList.remove("open");
            signUpFormReset();
            showUser();
        } else {
            toast({ title: 'Lỗi', message: result.message || 'Không thể cập nhật tài khoản!', type: 'error', duration: 3000 });
        }
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Không thể cập nhật tài khoản!', type: 'error', duration: 3000 });
    }
});

addAccount.addEventListener("click", async (e) => {
    e.preventDefault();
    let fullname = document.getElementById("fullname").value;
    let email = document.getElementById("user-email").value;
    let phone = document.getElementById("phone").value;
    let password = document.getElementById("password").value;
    let userRole = document.getElementById("user-role").value;

    if (fullname == "" || phone == "" || password == "" || email == "") {
        toast({ title: 'Cảnh báo', message: 'Vui lòng nhập đầy đủ thông tin!', type: 'warning', duration: 3000 });
        return;
    }

    if (!emailIsValid(email)) {
        document.querySelector('.form-message-email').innerHTML = 'Email không hợp lệ';
        return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
        toast({ title: 'Chú ý', message: 'Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số!', type: 'warning', duration: 3000 });
        return;
    }

    let user = {
        fullname: fullname,
        email: email,
        phone: phone,
        password: password,
        status: 1,
        userType: parseInt(userRole),
        join: new Date().toISOString()
    }

    try {
        const result = await window.api.register(user);
        if (result.success) {
            toast({ title: 'Thành công', message: 'Tạo tài khoản thành công!', type: 'success', duration: 3000 });
            document.querySelector(".signup").classList.remove("open");
            showUser();
            signUpFormReset();
        } else {
            toast({ title: 'Thất bại', message: result.message || 'Lỗi khi tạo tài khoản!', type: 'error', duration: 3000 });
        }
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Tài khoản đã tồn tại hoặc lỗi server!', type: 'error', duration: 3000 });
    }
});

// Logout listener moved to window.onload above

// --- Export to Excel Functions ---