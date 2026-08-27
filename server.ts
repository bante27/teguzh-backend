import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db';
import security from './src/middleware/security';
import errorHandler from './src/middleware/errorHandler';

import authRoutes from './src/routes/authRoutes';
import passengerRoutes from './src/routes/passengerRoutes';
import conductorRoutes from './src/routes/conductorRoutes';
import adminRoutes from './src/routes/adminRoutes';

dotenv.config();
const app = express();

app.use(security);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/passenger', passengerRoutes);
app.use('/api/conductor', conductorRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req: Request, res: Response) => {
    res.json({ success: true, message: '🚀 Teguzh Live Production Gateway Active' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`=========================================`);
        console.log(`🚀 Teguzh Backend Server running on port ${PORT}`);
        console.log(`=========================================`);
    });
});

export default app;
