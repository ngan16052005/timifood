const request = require('supertest');

// Lưu ý: Cần đảm bảo server đang chạy ở http://localhost:3500 trước khi chạy test này
const API_URL = 'http://localhost:3500';

describe('TiMiFood API Integration Tests', () => {
    
    describe('GET /api/products', () => {
        it('should return a list of products', async () => {
            const response = await request(API_URL).get('/api/products');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('id');
                expect(response.body[0]).toHaveProperty('title');
                expect(response.body[0]).toHaveProperty('price');
            }
        });
    });

    describe('GET /api/categories', () => {
        it('should return a list of categories', async () => {
            const response = await request(API_URL).get('/api/categories');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('POST /api/login with invalid credentials', () => {
        it('should return 401 Unauthorized', async () => {
            const response = await request(API_URL)
                .post('/api/login')
                .send({ phone: '0000000000', password: 'wrongpassword' });
            
            // Theo như hệ thống, tài khoản sai mật khẩu sẽ trả về 401 hoặc thông báo lỗi cụ thể
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.body).toHaveProperty('message');
        });
    });

});
