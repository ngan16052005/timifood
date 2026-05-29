const { z } = require('zod');
const { validate } = require('./authValidator');

const cartSchema = z.object({
    body: z.array(z.object({
        id: z.string().uuid("Product ID không hợp lệ"),
        soluong: z.number().int().positive("Số lượng phải lớn hơn 0").optional().default(1),
        ghichu: z.string().max(200, "Ghi chú quá dài").optional().default('')
    }))
});

const reviewSchema = z.object({
    body: z.object({
        productId: z.string().uuid("Product ID không hợp lệ"),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(500, "Bình luận quá dài").optional()
    })
});

const orderSchema = z.object({
    body: z.object({
        receiverName: z.string().min(2, "Tên người nhận phải có ít nhất 2 ký tự"),
        receiverPhone: z.string().regex(/^[0-9]{10}$/, "Số điện thoại phải có đúng 10 chữ số"),
        receiverAddress: z.string().min(5, "Địa chỉ quá ngắn"),
        deliveryType: z.enum(['Giao hàng tận nơi', 'Nhận tại cửa hàng']),
        paymentMethod: z.enum(['COD', 'Thẻ tín dụng', 'Momo', 'VNPay']),
        note: z.string().max(200).optional(),
        voucherCode: z.string().optional(),
        chitiet: z.array(z.object({
            id: z.string().uuid("Product ID không hợp lệ"),
            soluong: z.number().int().positive(),
            price: z.number().nonnegative()
        })).min(1, "Đơn hàng phải có ít nhất 1 sản phẩm")
    })
});

module.exports = {
    validate,
    cartSchema,
    reviewSchema,
    orderSchema
};
