"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleCheck = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const roleCheck = (requiredRole) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access Denied: No token provided' });
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'supersecretkey');
            req.user = decoded;
            if (req.user.role !== requiredRole && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access Denied: Insufficient permissions' });
            }
            next();
        }
        catch (error) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    };
};
exports.roleCheck = roleCheck;
exports.default = exports.roleCheck;
