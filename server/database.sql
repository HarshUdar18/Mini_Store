-- --------------------------------------------------------
-- E-commerce MySQL Database Schema
-- --------------------------------------------------------

-- 1. Users Table (For login)
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    -- NOTE: Always hash the password using bcrypt in your backend!
    password_hash VARCHAR(255) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products Table (The store's catalog)
CREATE TABLE IF NOT EXISTS Products (
    id VARCHAR(10) PRIMARY KEY, 
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    stock INT NOT NULL DEFAULT 0
);

-- 3. CartItems Table (The items currently in a user's cart)
CREATE TABLE IF NOT EXISTS CartItems (
    user_id INT NOT NULL,
    product_id VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    PRIMARY KEY (user_id, product_id), 
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

-- 4. Sample Data
INSERT INTO Products (id, name, price, description, image_url, stock) VALUES
('p001', 'Premium Wireless Headphones', 199.99, 'Experience crystal clear audio with deep bass and noise cancellation.', 'https://placehold.co/600x400/1e293b/ffffff?text=Headphones', 15),
('p002', 'Smartwatch 3000', 249.50, 'Track your fitness, sleep, and notifications.', 'https://placehold.co/600x400/1e40af/ffffff?text=Smart+Watch', 8);

-- Insert a mock user (replace 'password' with a hashed value in real life)
INSERT INTO Users (email, password_hash) VALUES
('test@user.com', 'mock_hashed_password');

CREATE TABLE ContactInquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
3.  **Find the Message:** After submitting the form on the website, the message will be stored in your MySQL database. You can view it by going to **phpMyAdmin**, selecting the **`ecommerce_db`** database, and browsing the data in the **`ContactInquiries`** table.
