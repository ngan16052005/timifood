const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'TiMiFood_Secret_Key_2026';

const parseCookies = (request) => {
    const list = {};
    const cookieHeader = request.headers?.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(';').forEach(function(cookie) {
        let [ name, ...rest] = cookie.split('=');
        name = name?.trim();
        if (!name) return;
        const value = rest.join('=').trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });
    return list;
}

const authenticateToken = (req, res, next) => {
    let token = null;
    const cookies = parseCookies(req);
    
    if (cookies.token) {
        token = cookies.token;
    } else {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

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

const isShipper = (req, res, next) => {
    if (req.user && req.user.userType === 3) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Shipper only.' });
    }
};

const isStaffAdminOrShipper = (req, res, next) => {
    if (req.user && (req.user.userType === 1 || req.user.userType === 2 || req.user.userType === 3)) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Staff, Admin or Shipper only.' });
    }
};

const optionalAuthenticateToken = (req, res, next) => {
    let token = null;
    const cookies = parseCookies(req);
    
    if (cookies.token) {
        token = cookies.token;
    } else {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (!err) req.user = user;
        else req.user = null;
        next();
    });
};

module.exports = { authenticateToken, optionalAuthenticateToken, isAdmin, isStaffOrAdmin, isShipper, isStaffAdminOrShipper, SECRET_KEY };
