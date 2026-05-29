const NodeCache = require('node-cache');

// Setup NodeCache với TTL mặc định là 5 phút (300 giây)
const appCache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        // Chỉ cache các request GET
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl || req.url;
        const cachedResponse = appCache.get(key);

        if (cachedResponse) {
            console.log(`[CACHE HIT] ${key}`);
            return res.json(cachedResponse);
        }

        console.log(`[CACHE MISS] ${key}`);
        // Bọc lại hàm res.json để lưu cache trước khi gửi
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // Chỉ cache nếu response thành công
            if (res.statusCode >= 200 && res.statusCode < 300) {
                appCache.set(key, body, duration);
            }
            originalJson(body);
        };
        
        next();
    };
};

const clearCache = (pattern) => {
    const keys = appCache.keys();
    if (!pattern) {
        appCache.flushAll();
        return;
    }
    const keysToDelete = keys.filter(key => key.includes(pattern));
    keysToDelete.forEach(key => appCache.del(key));
    console.log(`[CACHE CLEARED] pattern: ${pattern}, keys deleted: ${keysToDelete.length}`);
};

module.exports = { cacheMiddleware, appCache, clearCache };
