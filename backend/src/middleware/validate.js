const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            const errorMessages = err.errors.map((e) => `${e.path.join('.')} - ${e.message}`);
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu đầu vào không hợp lệ',
                errors: errorMessages,
            });
        }
        next(err);
    }
};

module.exports = { validate };
