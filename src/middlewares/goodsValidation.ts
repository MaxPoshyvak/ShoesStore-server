import { Request, Response, NextFunction } from 'express';
import { goodCreationSchema } from '../yupValidation/goodsSchema';

export const validateGoodCreation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await goodCreationSchema.validate(req.body);
        next();
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
