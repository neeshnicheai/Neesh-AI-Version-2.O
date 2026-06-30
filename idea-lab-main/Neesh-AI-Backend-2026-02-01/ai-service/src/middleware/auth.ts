import { Request, Response, NextFunction } from 'express';

export const requireInternalAuth = (req: Request, res: Response, next: NextFunction) => {
    const internalKey = process.env.INTERNAL_API_KEY;
    const requestKey = req.headers['x-internal-secret'];

    if (!internalKey) {
        console.error("INTERNAL_API_KEY is not set in environment");
        // Fail secure
        return res.status(500).json({ error: "Service Configuration Error" });
    }

    if (!requestKey || requestKey !== internalKey) {
        return res.status(401).json({ error: "Unauthorized: Invalid Internal Key" });
    }

    next();
};
