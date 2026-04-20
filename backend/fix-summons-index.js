import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://blotter_service_user:Pm9nxDFMy6pNP8o6@barangaycluster.seb5lfn.mongodb.net/blotter_db?retryWrites=true&w=majority&appName=BarangayCluster';

async function fixSummonsIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const summonsCollection = db.collection('summons');

    // Get all current indexes
    console.log('\n📋 Current indexes on summons collection:');
    const indexes = await summonsCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

    // Drop the old summonsNo_1 index if it exists
    console.log('\n🗑️  Dropping old summonsNo_1 index...');
    try {
      await summonsCollection.dropIndex('summonsNo_1');
      console.log('✅ Successfully dropped summonsNo_1 index');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('ℹ️  Index summonsNo_1 does not exist (already dropped)');
      } else {
        throw error;
      }
    }

    // Create the new compound index if it doesn't exist
    console.log('\n🔨 Creating compound index on caseNo + summonType...');
    try {
      await summonsCollection.createIndex(
        { caseNo: 1, summonType: 1 }, 
        { unique: true, name: 'caseNo_1_summonType_1' }
      );
      console.log('✅ Successfully created compound index');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️  Compound index already exists');
      } else {
        throw error;
      }
    }

    // Show final indexes
    console.log('\n📋 Final indexes on summons collection:');
    const finalIndexes = await summonsCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });

    console.log('\n✅ Database migration completed successfully!');
    console.log('🎉 You can now create summons without errors!');
    
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixSummonsIndexes();
