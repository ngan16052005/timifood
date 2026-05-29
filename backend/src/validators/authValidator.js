const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
        email: z.string().email("Email không hợp lệ").optional().or(z.literal('')),
        phone: z.string().regex(/^[0-9]{10}$/, "Số điện thoại phải có đúng 10 chữ số"),
        password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    })
});

const loginSchema = z.object({
    body: z.object({
        phone: z.string().regex(/^[0-9]{10}$/, "Số điện thoại phải có đúng 10 chữ số"),
        password: z.string().min(6, "Mật khẩu không hợp lệ")
    })
});

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
            return res.status(400).json({
                success: false,
                message: err.errors[0].message,
                errors: err.errors
            });
        }
        next(err);
    }
};

module.exports = {
    registerSchema,
    loginSchema,
    validate
};
