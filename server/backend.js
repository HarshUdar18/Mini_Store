const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;
// REPLACE THIS: The URL where your React app is running (e.g., 'http://localhost:3000')
const FRONTEND_ORIGIN = 'http://localhost:3000'; 
const JWT_SECRET = 'YOUR_SUPER_SECRET_KEY_REPLACE_ME_NOW'; 

// --- 1. MySQL Connection Configuration ---
const dbConfig = {
    host: 'localhost',
    user: 'root', // <<< CHANGE THIS
    password: '', // <<< CHANGE THIS
    database: 'ecommerce_db', // <<< CHANGE THIS (if you used a different name)
    waitForConnections: true,
    connectionLimit: 10,
};
const pool = mysql.createPool(dbConfig);


// --- 2. Middleware Setup ---
app.use(express.json()); 
app.use(cors({ origin: FRONTEND_ORIGIN }));


// --- 3. Authorization Check ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (token == null) return res.status(401).json({ message: 'Authorization required.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token.' });
        req.user = user; // Set user ID: req.user.id
        next();
    });
};


// ----------------------------------------------------
// --- API ENDPOINTS (The Paths the Frontend Calls) ---
// ----------------------------------------------------

// PATH: /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    // 1. Check if user exists (Replace this with secure password check using bcrypt!)
    const [rows] = await pool.query('SELECT id, email FROM Users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || password !== 'password') { // Simplified check for demo
        return res.status(401).json({ message: 'Invalid credentials. Use test@user.com / password' });
    }

    // 2. Generate and return JWT Token
    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({ success: true, token, user: { id: user.id, email: user.email } });
});


// PATH: /api/products
app.get('/api/products', async (req, res) => {
    try {
        // READ all products from Products table
        const [rows] = await pool.query('SELECT id, name, price, description, stock, image_url FROM Products');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to retrieve products.' });
    }
});


// PATH: /api/cart
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // READ cart items for the logged-in user
        const [rows] = await pool.query('SELECT product_id, quantity FROM CartItems WHERE user_id = ?', [userId]);
        
        const cartItems = rows.map(row => ({ productId: row.product_id, quantity: row.quantity }));
        res.json(cartItems);

    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Failed to retrieve cart data.' });
    }
});


// PATH: /api/cart/:productId
app.post('/api/cart/:productId', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantityChange } = req.body; 
    
    // This is the core CRUD logic (UPSERT/DELETE)
    try {
        // --- 1. Determine new quantity ---
        const [[cartRow]] = await pool.query('SELECT quantity FROM CartItems WHERE user_id = ? AND product_id = ?', [userId, productId]);
        const currentQuantity = cartRow ? cartRow.quantity : 0;
        const newQuantity = currentQuantity + quantityChange;

        if (newQuantity <= 0) {
            // DELETE item from cart
            await pool.query('DELETE FROM CartItems WHERE user_id = ? AND product_id = ?', [userId, productId]);
            return res.json({ success: true, message: 'Item removed from cart.' });
        }
        
        // --- 2. Check Stock (Crucial for e-commerce) ---
        const [[productRow]] = await pool.query('SELECT stock FROM Products WHERE id = ?', [productId]);
        if (!productRow || newQuantity > productRow.stock) {
            return res.status(400).json({ success: false, message: 'Cannot add more than available stock.' });
        }

        // --- 3. UPSERT (Update or Insert) ---
        const upsertQuery = `
            INSERT INTO CartItems (user_id, product_id, quantity) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE quantity = ?
        `;
        await pool.query(upsertQuery, [userId, productId, newQuantity, newQuantity]);

        res.json({ success: true, message: 'Cart item updated successfully.' });

    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ success: false, message: 'Server failed to update cart.' });
    }
});


// PATH: /api/cart/all
app.delete('/api/cart/all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // DELETE all items for the user
        await pool.query('DELETE FROM CartItems WHERE user_id = ?', [userId]);
        res.json({ success: true, message: 'Cart cleared successfully.' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ success: false, message: 'Failed to clear cart.' });
    }
});


// --- 4. Start Server ---
app.listen(PORT, () => {
    console.log(`E-commerce API Server listening on port ${PORT}`);
    console.log(`To run the server directly, use: node backend.js`);
    console.log(`To use 'npm start', ensure your package.json scripts include: "start": "node backend.js"`);
});
