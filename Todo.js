// ============================================================
//  Todo.js — Xử lý todo list (gọi API backend)
// ============================================================

const API = window.location.origin;
const addViec = document.getElementById("inputViec");

// ────────────────────────────────────────
//  HELPER: lấy token từ localStorage
// ────────────────────────────────────────
function layToken() {
  return localStorage.getItem("token");
}

function layTrangThaiDangNhap() {
  return localStorage.getItem("daDangNhap") === "true";
}

// Header dùng chung cho mọi request cần auth
function authHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${layToken()}`,
  };
}

// ────────────────────────────────────────
//  KHỞI ĐỘNG: load danh sách việc khi mở trang
// ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  if (!layTrangThaiDangNhap()) return; // Chưa đăng nhập thì thôi

  try {
    const res = await fetch(`${API}/api/todos`, { headers: authHeader() });
    const data = await res.json();

    if (!res.ok) return;

    // Render từng việc lên bảng
    data.forEach((viec) =>
      themViecVaoBang(viec.tieu_de, viec.id, viec.trang_thai),
    );
  } catch (err) {
    console.error("Không thể tải danh sách việc:", err);
  }
});

// ────────────────────────────────────────
//  THÊM VIỆC MỚI
// ────────────────────────────────────────
async function xacNhan() {
  const congViec = addViec.value.trim();

  if (congViec === "") {
    alert("Vui lòng nhập công việc!");
    return;
  }

  if (!layTrangThaiDangNhap()) {
    alert("Vui lòng đăng nhập để thêm công việc!");
    window.location.href = "./loginToDo.html";
    return;
  }

  try {
    const res = await fetch(`${API}/api/todos`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ tieuDe: congViec }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.loi || "Không thể thêm việc!");
      return;
    }

    // Thêm vào bảng với id trả về từ server
    themViecVaoBang(congViec, data.id, "chua_lam");
    addViec.value = "";
  } catch (err) {
    alert("Không thể kết nối đến server!");
  }
}

// ────────────────────────────────────────
//  RENDER HÀNG VÀO BẢNG + GẮN SỰ KIỆN
// ────────────────────────────────────────
function themViecVaoBang(congViec, id, trangThai) {
  const table = document.querySelector(".BangHienThi");
  const row = table.insertRow();
  row.dataset.id = id; // Lưu id để gọi API sau

  const daLam = trangThai === "da_lam";

  row.innerHTML = `
    <td class="tenViec">${daLam ? "" : congViec}</td>
    <td><input type="checkbox" class="viecChuaLam" title="Đánh dấu hoàn thành" ${daLam ? "checked disabled" : ""}></td>
    <td class="tenViecDaLam">${daLam ? congViec : ""}</td>
    <td><input type="checkbox" class="viecDaLam" title="Phục hồi về chưa làm"></td>
    <td><input type="checkbox" class="xoaViec" title="Xóa công việc"></td>
  `;

  if (daLam) row.style.opacity = "0.6";

  // ✅ Đánh dấu hoàn thành
  row
    .querySelector(".viecChuaLam")
    .addEventListener("change", async function () {
      if (this.checked) {
        const ok = await capNhatTrangThai(id, "da_lam");
        if (!ok) {
          this.checked = false;
          return;
        }

        const ten = row.querySelector(".tenViec").textContent;
        row.querySelector(".tenViecDaLam").textContent = ten;
        row.querySelector(".tenViec").textContent = "";
        row.style.opacity = "0.6";
        this.disabled = true;
      }
    });

  // 🔄 Phục hồi về chưa làm
  row.querySelector(".viecDaLam").addEventListener("change", async function () {
    if (this.checked) {
      const ok = await capNhatTrangThai(id, "chua_lam");
      if (!ok) {
        this.checked = false;
        return;
      }

      const ten = row.querySelector(".tenViecDaLam").textContent;
      row.querySelector(".tenViec").textContent = ten;
      row.querySelector(".tenViecDaLam").textContent = "";
      row.style.opacity = "1";
      row.querySelector(".viecChuaLam").checked = false;
      row.querySelector(".viecChuaLam").disabled = false;
      this.checked = false;
    }
  });

  // 🗑️ Xóa công việc
  row.querySelector(".xoaViec").addEventListener("change", async function () {
    if (this.checked) {
      if (confirm("Bạn có chắc muốn xóa công việc này?")) {
        const ok = await xoaViec(id);
        if (ok) {
          row.remove();
        } else {
          this.checked = false;
        }
      } else {
        this.checked = false;
      }
    }
  });
}

// ────────────────────────────────────────
//  API CALLS
// ────────────────────────────────────────
async function capNhatTrangThai(id, trangThai) {
  try {
    const res = await fetch(`${API}/api/todos/${id}`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({ trangThai }),
    });
    return res.ok;
  } catch {
    alert("Không thể kết nối đến server!");
    return false;
  }
}

async function xoaViec(id) {
  try {
    const res = await fetch(`${API}/api/todos/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    return res.ok;
  } catch {
    alert("Không thể kết nối đến server!");
    return false;
  }
}

// ────────────────────────────────────────
//  NHẤN ENTER ĐỂ THÊM VIỆC
// ────────────────────────────────────────
addViec.addEventListener("keydown", (e) => {
  if (e.key === "Enter") xacNhan();
});
