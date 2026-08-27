"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./src/config/db"));
const security_1 = __importDefault(require("./src/middleware/security"));
const errorHandler_1 = __importDefault(require("./src/middleware/errorHandler"));
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const passengerRoutes_1 = __importDefault(require("./src/routes/passengerRoutes"));
const conductorRoutes_1 = __importDefault(require("./src/routes/conductorRoutes"));
const adminRoutes_1 = __importDefault(require("./src/routes/adminRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(security_1.default);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes_1.default);
app.use('/api/passenger', passengerRoutes_1.default);
app.use('/api/conductor', conductorRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.get('/', (req, res) => {
    res.json({ success: true, message: '🚀 Teguzh Live Production Gateway Active' });
});
app.use(errorHandler_1.default);
const PORT = process.env.PORT || 5000;
(0, db_1.default)().then(() => {
    app.listen(PORT, () => {
        console.log(`=========================================`);
        console.log(`🚀 Teguzh Backend Server running on port ${PORT}`);
        console.log(`=========================================`);
    });
});
exports.default = app;
