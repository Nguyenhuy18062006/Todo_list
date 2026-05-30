-- ============================================================
--  TODO APP — DATABASE SCHEMA
--  Database: MySQL / MariaDB
-- ============================================================
 
-- ────────────────────────────────────────
--  BẢNG 1: users — Lưu tài khoản người dùng
-- ────────────────────────────────────────
CREATE DATABASE toDoList;
USE toDoList;

CREATE TABLE users (
    id            INT             AUTO_INCREMENT PRIMARY KEY,
    ten_hien_thi  VARCHAR(100)    NOT NULL,
    email         VARCHAR(150)    NOT NULL UNIQUE,
    mat_khau      VARCHAR(255)    NOT NULL,
    created_at    DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ────────────────────────────────────────
--  BẢNG 2: todos — Lưu công việc của từng user
-- ────────────────────────────────────────
CREATE TABLE todos (
    id            INT             AUTO_INCREMENT PRIMARY KEY,
    user_id       INT             NOT NULL,
    tieu_de       VARCHAR(500)    NOT NULL,
    trang_thai    ENUM('chua_lam', 'da_lam', 'da_xoa') NOT NULL DEFAULT 'chua_lam',
    created_at    DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ────────────────────────────────────────
--  INDEX
-- ────────────────────────────────────────
CREATE INDEX idx_todos_user_id    ON todos(user_id);
CREATE INDEX idx_todos_trang_thai ON todos(trang_thai);
CREATE INDEX idx_users_email      ON users(email);
 
-- ============================================================
--  MẪU DỮ LIỆU THỬ NGHIỆM
-- ============================================================
INSERT INTO users (ten_hien_thi, email, mat_khau) VALUES
    ('Nguyễn Văn A', 'a@gmail.com', 'hash_password_1'),
    ('Trần Thị B',   'b@gmail.com', 'hash_password_2');
 
INSERT INTO todos (user_id, tieu_de, trang_thai) VALUES
    (1, 'Học HTML CSS',            'da_lam'),
    (1, 'Làm bài tập JavaScript',  'chua_lam'),
    (1, 'Ôn tập SQL',              'chua_lam'),
    (2, 'Đọc sách',                'da_lam'),
    (2, 'Tập thể dục',             'chua_lam');
 
-- ============================================================
--  CÁC QUERY HAY DÙNG
-- ============================================================
 
-- Lấy việc chưa làm của user
SELECT id, tieu_de, created_at
FROM todos
WHERE user_id = 1 AND trang_thai = 'chua_lam'
ORDER BY created_at DESC;
 
-- Lấy việc đã làm xong của user
SELECT id, tieu_de, updated_at
FROM todos
WHERE user_id = 1 AND trang_thai = 'da_lam'
ORDER BY updated_at DESC;
 
-- Đánh dấu "đã làm"
UPDATE todos SET trang_thai = 'da_lam'
WHERE id = 1 AND user_id = 1;
 
-- Phục hồi về "chưa làm"
UPDATE todos SET trang_thai = 'chua_lam'
WHERE id = 1 AND user_id = 1;
 
-- Xóa mềm
UPDATE todos SET trang_thai = 'da_xoa'
WHERE id = 1 AND user_id = 1;
 
-- Xóa cứng
DELETE FROM todos WHERE id = 1 AND user_id = 1;
 
-- Đăng nhập
SELECT id, ten_hien_thi, email
FROM users
WHERE email = 'a@gmail.com' AND mat_khau = 'hash_password_1';