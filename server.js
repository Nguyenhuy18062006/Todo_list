// ============================================================
//  server.js — Backend cho Todo App
//  Cài thư viện: npm install express mysql2 bcrypt jsonwebtoken dotenv cors
//  Chạy: node server.js
// ============================================================

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────
//  MIDDLEWARE
// ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Phục vụ các file HTML/CSS/JS frontend

// ────────────────────────────────────────
//  KẾT NỐI MySQL
// ────────────────────────────────────────
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "toDoList",
  waitForConnections: true,
});

// ────────────────────────────────────────
//  MIDDLEWARE XÁC THỰC JWT
// ────────────────────────────────────────
function xacThucToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ loi: "Chưa đăng nhập" });

  jwt.verify(token, process.env.JWT_SECRET || "secret_key", (err, user) => {
    if (err) return res.status(403).json({ loi: "Token không hợp lệ" });
    req.user = user; // { id, email, tenHienThi }
    next();
  });
}

// ============================================================
//  AUTH ROUTES
// ============================================================

// POST /api/dang-ky
app.post("/api/dang-ky", async (req, res) => {
  const { tenHienThi, email, matKhau } = req.body;

  if (!tenHienThi || !email || !matKhau)
    return res.status(400).json({ loi: "Vui lòng điền đầy đủ thông tin" });

  try {
    // Kiểm tra email đã tồn tại chưa
    const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length > 0)
      return res.status(409).json({ loi: "Email này đã được đăng ký" });

    // Hash mật khẩu
    const matKhauHash = await bcrypt.hash(matKhau, 10);

    // Lưu vào DB
    await db.query(
      "INSERT INTO users (ten_hien_thi, email, mat_khau) VALUES (?, ?, ?)",
      [tenHienThi, email, matKhauHash],
    );

    res.status(201).json({ thanhCong: true, thongBao: "Đăng ký thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ loi: "Lỗi server" });
  }
});

// POST /api/dang-nhap
app.post("/api/dang-nhap", async (req, res) => {
  const { email, matKhau } = req.body;

  if (!email || !matKhau)
    return res.status(400).json({ loi: "Vui lòng điền đầy đủ thông tin" });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(401).json({ loi: "Email hoặc mật khẩu không đúng" });

    const user = rows[0];

    // So sánh mật khẩu
    const hopLe = await bcrypt.compare(matKhau, user.mat_khau);
    if (!hopLe)
      return res.status(401).json({ loi: "Email hoặc mật khẩu không đúng" });

    // Tạo JWT token (hết hạn sau 7 ngày)
    const token = jwt.sign(
      { id: user.id, email: user.email, tenHienThi: user.ten_hien_thi },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "7d" },
    );

    res.json({
      thanhCong: true,
      token,
      tenHienThi: user.ten_hien_thi,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ loi: "Lỗi server" });
  }
});

// ============================================================
//  TODO ROUTES (cần đăng nhập)
// ============================================================

// GET /api/todos — Lấy danh sách việc của user
app.get("/api/todos", xacThucToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, tieu_de, trang_thai, created_at FROM todos WHERE user_id = ? AND trang_thai != 'da_xoa' ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ loi: "Lỗi server" });
  }
});

// POST /api/todos — Thêm việc mới
app.post("/api/todos", xacThucToken, async (req, res) => {
  const { tieuDe } = req.body;

  if (!tieuDe || tieuDe.trim() === "")
    return res.status(400).json({ loi: "Tiêu đề không được để trống" });

  try {
    const [result] = await db.query(
      "INSERT INTO todos (user_id, tieu_de) VALUES (?, ?)",
      [req.user.id, tieuDe.trim()],
    );
    res.status(201).json({ thanhCong: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ loi: "Lỗi server" });
  }
});

// PATCH /api/todos/:id — Cập nhật trạng thái (da_lam / chua_lam / da_xoa)
app.patch("/api/todos/:id", xacThucToken, async (req, res) => {
  const { trangThai } = req.body;
  const { id } = req.params;

  const trangThaiHopLe = ["chua_lam", "da_lam", "da_xoa"];
  if (!trangThaiHopLe.includes(trangThai))
    return res.status(400).json({ loi: "Trạng thái không hợp lệ" });

  try {
    const [result] = await db.query(
      "UPDATE todos SET trang_thai = ? WHERE id = ? AND user_id = ?",
      [trangThai, id, req.user.id],
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ loi: "Không tìm thấy công việc" });

    res.json({ thanhCong: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ loi: "Lỗi server" });
  }
});

// DELETE /api/todos/:id — Xóa cứng
app.delete("/api/todos/:id", xacThucToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM todos WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ loi: "Không tìm thấy công việc" });

    res.json({ thanhCong: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ loi: "Lỗi server" });
  }
});

// ────────────────────────────────────────
//  KHỞI ĐỘNG SERVER
// ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
