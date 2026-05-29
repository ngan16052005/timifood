const request = require('supertest');
const app = require('../server'); // Path to server.js from tests directory
const { sql, connectDB } = require('../src/config/db');

// Run before tests start
beforeAll(async () => {
    // Make sure we wait for DB connection if there's any setup needed
    await connectDB();
});

// Run after all tests finish
afterAll(async () => {
    await sql.close();
});

describe('GET /api/products', () => {
    it('should return a list of products and return 200', async () => {
        const response = await request(app).get('/api/products');
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        
        // Assert cache worked or basic property presence
        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('title');
            expect(response.body[0]).toHaveProperty('price');
        }
    });

    it('should filter products by search query', async () => {
        const response = await request(app).get('/api/products?search=Cà phê');
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });
});
