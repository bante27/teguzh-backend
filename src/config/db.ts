import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        
        console.log(`=========================================`);
        console.log(`✨ MongoDB Connected Successfully!`);
        console.log(`📡 Host: ${conn.connection.host}`);
        console.log(`🗃️ Database Name: ${conn.connection.name}`);
        console.log(`=========================================`);
    } catch (error: any) {
        console.error(`❌ Database Connection Failure: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
