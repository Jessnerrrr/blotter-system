import mongoose from 'mongoose';

// Primary connection for blotter_db
const connectDB = async () => {
  try {
    // THE UNBLOCKABLE LINK: Bypasses the ISP's SRV block completely!
    const unblockableUri = 'mongodb://blotter_service_user:Pm9nxDFMy6pNP8o6@ac-788jzfx-shard-00-00.seb5lfn.mongodb.net:27017,ac-788jzfx-shard-00-01.seb5lfn.mongodb.net:27017,ac-788jzfx-shard-00-02.seb5lfn.mongodb.net:27017/blotter_db?ssl=true&authSource=admin&retryWrites=true&w=majority';

    const conn = await mongoose.connect(unblockableUri);

    console.log(`✅ MongoDB Connected to Cloud: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Secondary connection for profiling_db (residents data)
const profilingUri = 'mongodb://blotter_service_user:Pm9nxDFMy6pNP8o6@ac-788jzfx-shard-00-00.seb5lfn.mongodb.net:27017,ac-788jzfx-shard-00-01.seb5lfn.mongodb.net:27017,ac-788jzfx-shard-00-02.seb5lfn.mongodb.net:27017/profiling_db?ssl=true&authSource=admin&retryWrites=true&w=majority';

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
