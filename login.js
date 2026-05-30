// ============================================================
//  login.js — Xử lý logic đăng nhập (gọi API backend)
// ============================================================

const API = window.location.origin;

async function dangNhap() {
  // Reset thông báo lỗi
  document.getElementById("errEmail").style.display = "none";
  document.getElementById("errPass").style.display = "none";
  document.getElementById("errLogin").style.display = "none";
  document.getElementById("errServer").style.display = "none";

  const email = document.getElementById("inputEmail").value.trim();
  const pass = document.getElementById("inputPass").value.trim();
  let valid = true;

  // Validate phía client trước
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById("errEmail").style.display = "block";
    valid = false;
  }
  if (!pass) {
    document.getElementById("errPass").style.display = "block";
    valid = false;
  }
  if (!valid) return;

  // Gọi API đăng nhập
  try {
    const res = await fetch(`${API}/api/dang-nhap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, matKhau: pass }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Sai email hoặc mật khẩu (401)
      document.getElementById("errLogin").style.display = "block";
      return;
    }

    // Lưu token và thông tin user vào localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("daDangNhap", "true");
    localStorage.setItem("tenNguoiDung", data.tenHienThi || email);

    const banner = document.getElementById("successBanner");
    banner.style.display = "flex";

    setTimeout(() => {
      window.location.href = "./index.html";
    }, 1200);
  } catch (err) {
    // Lỗi mạng / không kết nối được server
    document.getElementById("errServer").textContent =
      "Không thể kết nối đến server.";
    document.getElementById("errServer").style.display = "block";
  }
}

// Nhấn Enter để đăng nhập
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") dangNhap();
});
