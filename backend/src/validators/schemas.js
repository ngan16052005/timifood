const { z } = require('zod');

const productSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Tên sản phẩm không được để trống').max(255),
        category: z.string().min(1, 'Danh mục không được để trống'),
        price: z.preprocess((val) => Number(val), z.number().min(0, 'Giá không được âm')),
        stock: z.preprocess((val) => Number(val), z.number().min(0).default(0)),
        minStock: z.preprocess((val) => Number(val), z.number().min(0).default(5)),
        status: z.preprocess((val) => Number(val), z.number().default(1)),
        desc: z.string().optional(),
        img: z.string().optional()
    })
});

const categorySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Tên danh mục không được để trống').max(100)
    })
});

module.exports = {
    productSchema,
    categorySchema
};
