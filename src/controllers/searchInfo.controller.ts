import { Request, Response } from 'express';
import SearchInfo from '../models/SearchInfo';
import type { RequestWithUser } from '../types';

export const addSearchInfo = async (req: RequestWithUser, res: Response) => {
    const userId = req.user?.id;

    try {
        const { searchQuery } = req.body;

        if (!userId || !searchQuery) {
            return res.status(400).json({ message: 'userId and searchQuery are required' });
        }

        const searchInfoEntry = new SearchInfo({ userId, searchQuery });
        await searchInfoEntry.save();

        res.status(201).json({ message: 'Search info added successfully', searchInfo: searchInfoEntry });
    } catch (error) {
        console.error('Error adding search info:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getSearchInfo = async (req: RequestWithUser, res: Response) => {
    const userId = req.user?.id;

    try {
        const searchInfoEntries = await SearchInfo.find({ userId }).sort({ writedAt: -1 });
        res.status(200).json({ searchInfo: searchInfoEntries });
    } catch (error) {
        console.error('Error fetching search info:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
