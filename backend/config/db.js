import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Primary connection for blotter_db
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blotter_db');

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('⚠️  Running in development mode without database connection');
    }
  }
};

// Secondary connection for profiling_db (residents data)
const profilingUri = (process.env.MONGODB_URI || 'mongodb://localhost:27017/blotter_db').replace('blotter_db', 'profiling_db');

export const profilingConnection = mongoose.createConnection(profilingUri);

profilingConnection.on('connected', () => {
  console.log('✅ Profiling DB Connected');
  console.log(`📊 Database: profiling_db`);
});

profilingConnection.on('error', (err) => {
  console.error(`❌ Profiling DB connection error: ${err}`);
});

profilingConnection.on('disconnected', () => {
  console.log('⚠️  Profiling DB disconnected');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB connection error: ${err}`);
});

export default connectDB;
