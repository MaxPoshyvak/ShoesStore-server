import { Request, Response } from 'express';

export const template = (req: Request, res: Response) => {
    console.log('Test endpoint called');
    res.json({
        status: 'ok',
        message: 'Test endpoint called successfully',
    });
};
