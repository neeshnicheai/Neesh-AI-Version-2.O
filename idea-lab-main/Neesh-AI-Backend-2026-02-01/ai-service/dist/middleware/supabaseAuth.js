"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabaseAuth = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.decode(token);
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
    }
    catch (error) {
        console.error('[Auth] Token verification error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.supabaseAuth = supabaseAuth;
