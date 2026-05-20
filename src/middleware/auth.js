const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'TiMiFood_Secret_Key_2026';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.userType === 1) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

const isStaffOrAdmin = (req, res, next) => {
    if (req.user && (req.user.userType === 1 || req.user.userType === 2)) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Staff or Admin only.' });
    }
};

module.exports = { authenticateToken, isAdmin, isStaffOrAdmin, SECRET_KEY };
