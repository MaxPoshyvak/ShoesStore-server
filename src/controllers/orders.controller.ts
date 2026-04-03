import { Request, Response } from 'express';

export const postOrders = async (req: Request, res: Response) => {
    const { userId, products } = req.body;
};
