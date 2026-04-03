import * as yup from 'yup';

export const goodCreationSchema = yup.object().shape({
    name: yup.string().required('Name is required'),
    description: yup.string().required('Description is required'),
    price: yup.number().positive('Price must be a positive number').required('Price is required'),
    old_price: yup.number().positive('Old price must be a positive number').notRequired(),
    category: yup.string().required('Category is required'),
    is_new: yup.boolean().required('Is new flag is required'),
    stock_quantity: yup
        .number()
        .integer('Stock quantity must be an integer')
        .min(0, 'Stock quantity cannot be negative')
        .required('Stock quantity is required'),
    sizes: yup.array().of(yup.string()).required('Sizes are required'),
    main_image_url: yup.string().url('Main image URL must be a valid URL').required('Main image URL is required'),
    gallery_urls: yup
        .array()
        .of(yup.string().url('Gallery URLs must be valid URLs'))
        .required('Gallery URLs are required'),
});
