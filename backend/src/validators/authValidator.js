const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        fullname: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
        email: z.string().email("Email không hợp lệ").optional().or(z.literal('')),
        phone: z.string().regex(/^[0-9]{10}$/, "Số điện thoại phải có đúng 10 chữ số"),
        password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
        address: z.string().optional().or(z.literal('')),
        status: z.number().optional(),
        userType: z.number().optional()
    })
});

const loginSchema = z.object({
    body: z.object({
        username: z.string().min(3, "Tài khoản không hợp lệ"),
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
            const issues = err.issues || err.errors;
            return res.status(400).json({
                success: false,
                message: issues && issues.length > 0 ? issues[0].message : 'Dữ liệu không hợp lệ',
                errors: issues
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
