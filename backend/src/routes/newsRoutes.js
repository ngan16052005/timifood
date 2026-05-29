const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/news', newsController.getNews);
router.get('/admin/news', authenticateToken, isAdmin, newsController.getAdminNews);
router.get('/news/:id', newsController.getNewsById);
router.post('/admin/news', authenticateToken, isAdmin, newsController.createNews);
router.put('/admin/news/:id', authenticateToken, isAdmin, newsController.updateNews);
router.delete('/admin/news/:id', authenticateToken, isAdmin, newsController.deleteNews);

module.exports = router;
