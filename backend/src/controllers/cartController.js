const { sql, connectDB } = require('../config/db');
const { createNotification } = require('../helpers/notification');
const { createLog } = require('../helpers/logger');
const { sendOrderEmail, sendReplyEmail } = require('../helpers/email');
const webpush = require('web-push');

let pool;
connectDB().then(p => pool = p).catch(console.error);

const cartController = {
    getCart: async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.request()
            .input('userId', sql.UniqueIdentifier, userId)
            .query(`
                SELECT c.quantity as soluong, c.note as ghichu, p.* 
                FROM CartItems c
                JOIN Products p ON c.productId = p.id
                WHERE c.userId = @userId
            `);
        res.json(result.recordset || []);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching cart' });
    }
},

    postCart: async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = req.body;
        
        // Clear existing cart items
        await pool.request()
            .input('userId', sql.UniqueIdentifier, userId)
            .query('DELETE FROM CartItems WHERE userId = @userId');

        // Insert new cart items
        if (cart && cart.length > 0) {
            for (let item of cart) {
                await pool.request()
                    .input('userId', sql.UniqueIdentifier, userId)
                    .input('productId', sql.UniqueIdentifier, item.id)
                    .input('quantity', sql.Int, item.soluong || 1)
                    .input('note', sql.NVarChar, item.ghichu || '')
                    .query('INSERT INTO CartItems (userId, productId, quantity, note) VALUES (@userId, @productId, @quantity, @note)');
            }
        }
        res.json({ message: 'Cart updated' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating cart' });
    }
}
};

module.exports = cartController;
