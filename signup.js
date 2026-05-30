// ============================================================
//  signup.js — Xử lý logic đăng ký (gọi API backend)
// ============================================================

const API = window.location.origin;

function kiemTraMatKhau(val) {
  const fill = document.getElementById("strengthFill");
  const label = document.getElementById("strengthLabel");
  let strength = 0;

  if (val.length >= 6) strength++;
  if (val.length >= 10) strength++;
  if (/[A-Z]/.test(val) && /[0-9]/.test(val)) strength++;

  const levels = [
    { w: "0%", bg: "#eee", text: "" },
    { w: "33%", bg: "#e53e3e", text: "Yếu" },
    { w: "66%", bg: "#ed8936", text: "Trung bình" },
    { w: "100%", bg: "#11c48a", text: "Mạnh" },
  ];

  const lv = levels[strength];
  fill.style.width = lv.w;
  fill.style.background = lv.bg;
  label.textContent = lv.text;
  label.style.color = lv.bg;
}

async function dangKy() {
  // Reset tất cả lỗi
  [
    "errTen",
    "errEmail",
    "errEmailTon",
    "errPass",
    "errPass2",
    "errServer",
  ].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });

  const ten = document.getElementById("inputTen").value.trim();
  const email = document.getElementById("inputEmail").value.trim();
  const pass = document.getElementById("inputPass").value;
  const pass2 = document.getElementById("inputPass2").value;
  let valid = true;

  // Validate phía client trước
  if (!ten) {
    document.getElementById("errTen").style.display = "block";
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById("errEmail").style.display = "block";
    valid = false;
  }
  if (pass.length < 6) {
    document.getElementById("errPass").style.display = "block";
    valid = false;
  }
  if (pass !== pass2) {
    document.getElementById("errPass2").style.display = "block";
    valid = false;
  }
  if (!valid) return;

  // Gọi API đăng ký
  try {
    const res = await fetch(`${API}/api/dang-ky`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenHienThi: ten, email, matKhau: pass }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Email đã tồn tại (409) hoặc lỗi khác
      if (res.status === 409) {
        document.getElementById("errEmailTon").style.display = "block";
      } else {
        document.getElementById("errServer").textContent =
          data.loi || "Lỗi server, thử lại sau.";
        document.getElementById("errServer").style.display = "block";
      }
      return;
    }

    // Đăng ký thành công
    const banner = document.getElementById("successBanner");
    banner.style.display = "flex";

    setTimeout(() => {
      window.location.href = "./loginToDo.html";
    }, 1500);
  } catch (err) {
    // Lỗi mạng / không kết nối được server
    document.getElementById("errServer").textContent =
      "Không thể kết nối đến server.";
    document.getElementById("errServer").style.display = "block";
  }
}

// Nhấn Enter để đăng ký
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") dangKy();
});
