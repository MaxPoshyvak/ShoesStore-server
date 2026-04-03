import { Request, Response, NextFunction } from 'express';
import { userLoginSchema, userRegistrationSchema } from '../yupValidation/userSchema';
import jwt from 'jsonwebtoken';
import pool from '../config/dataBase/postgreSQL';

export const validateUserRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await userRegistrationSchema.validate(req.body);
        next();
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const validateUserLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await userLoginSchema.validate(req.body);
        next();
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
