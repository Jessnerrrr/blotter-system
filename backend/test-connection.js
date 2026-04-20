import mongoose from 'mongoose';

// Your MongoDB connection string
const uri = 'mongodb+srv://blotter_service_user:Pm9nxDFMy6pNP8o6@barangaycluster.seb5lfn.mongodb.net/blotter_db?authSource=admin';

console.log('🔄 Testing MongoDB connection...\n');

mongoose.connect(uri)
  .then(() => {
    console.log('✅ SUCCESS! MongoDB connection is working!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('\n✨ Your backend is ready to use!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ FAILED! Could not connect to MongoDB\n');
    console.log('Error details:');
    console.log('  Message:', err.message);
    console.log('  Code:', err.code);
    console.log('\n📖 See TROUBLESHOOTING.md for solutions\n');
    process.exit(1);
  });

// Timeout after 10 seconds
setTimeout(() => {
  console.log('❌ Connection timeout - taking too long');
  console.log('📖 See TROUBLESHOOTING.md for solutions\n');
  process.exit(1);
}, 10000);
