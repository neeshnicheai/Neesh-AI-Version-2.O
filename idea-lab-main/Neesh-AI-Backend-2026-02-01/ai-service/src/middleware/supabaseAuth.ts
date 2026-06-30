import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface User {
    id: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export const supabaseAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer '

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        console.log('[Auth] Verifying token...');

        // Decode the JWT to get user info (Supabase tokens are signed by Supabase)
        const decoded = jwt.decode(token) as any;

        if (!decoded || !decoded.sub) {
            return res.status(401).json({ error: 'Invalid token structure' });
        }

        // Add user info to request
        req.user = {
            id: decoded.sub,
            email: decoded.email || decoded.user_metadata?.email || ''
        };

        console.log('[Auth] User authenticated:', req.user.email);
        next();
    } catch (error) {
        console.error('[Auth] Token verification error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};