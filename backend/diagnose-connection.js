import mongoose from 'mongoose';

console.log('🔍 Advanced MongoDB Connection Diagnostic Tool\n');
console.log('=' .repeat(60));

// Test multiple connection string formats
const connectionStrings = [
  {
    name: 'Original (with appName)',
    uri: 'mongodb+srv://blotter_service_user:pkwPvPQKUFGWO6Ji@barangaycluster.seb5lfn.mongodb.net/blotter_db?appName=BarangayCluster'
  },
  {
    name: 'Without appName parameter',
    uri: 'mongodb+srv://blotter_service_user:pkwPvPQKUFGWO6Ji@barangaycluster.seb5lfn.mongodb.net/blotter_db'
  },
  {
    name: 'With retryWrites',
    uri: 'mongodb+srv://blotter_service_user:pkwPvPQKUFGWO6Ji@barangaycluster.seb5lfn.mongodb.net/blotter_db?retryWrites=true&w=majority'
  },
  {
    name: 'Without database name (connect to cluster)',
    uri: 'mongodb+srv://blotter_service_user:pkwPvPQKUFGWO6Ji@barangaycluster.seb5lfn.mongodb.net/?retryWrites=true&w=majority'
  }
];

let testIndex = 0;

async function testConnection(config) {
  console.log(`\n📝 Test ${testIndex + 1}/${connectionStrings.length}: ${config.name}`);
  console.log(`   URI: ${config.uri.substring(0, 40)}...`);
  
  try {
    await mongoose.connect(config.uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    console.log('   ✅ SUCCESS! Connection worked!');
    console.log(`   📊 Database: ${mongoose.connection.name || 'N/A'}`);
    console.log(`   🌐 Host: ${mongoose.connection.host}`);
    console.log(`   🎉 This connection string works!\n`);
    
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log('   ❌ FAILED');
    console.log(`   Error: ${err.message}`);
    console.log(`   Code: ${err.code || 'N/A'}`);
    
    // Provide specific guidance based on error
    if (err.message.includes('bad auth')) {
      console.log('   💡 Hint: Authentication failed - IP not whitelisted OR wrong credentials');
    } else if (err.message.includes('ENOTFOUND')) {
      console.log('   💡 Hint: Cluster hostname not found - check cluster name');
    } else if (err.message.includes('timeout')) {
      console.log('   💡 Hint: Connection timeout - network issue or firewall blocking');
    }
    
    await mongoose.disconnect();
    return false;
  }
}

async function runDiagnostics() {
  console.log('\n🔍 Testing different connection string formats...\n');
  
  let successCount = 0;
  
  for (const config of connectionStrings) {
    const result = await testConnection(config);
    if (result) successCount++;
    testIndex++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 DIAGNOSTIC RESULTS:\n');
  
  if (successCount > 0) {
    console.log(`✅ ${successCount} connection string(s) worked!`);
    console.log('   Update your .env file with the working connection string.\n');
  } else {
    console.log('❌ All connection attempts failed.\n');
    console.log('🎯 ROOT CAUSE ANALYSIS:\n');
    console.log('Since all variations failed with "bad auth", this means:');
    console.log('1. ⚠️  Your IP address is NOT WHITELISTED in MongoDB Atlas');
    console.log('2. ⚠️  OR the database user does not exist');
    console.log('3. ⚠️  OR the password is incorrect\n');
    
    console.log('🔧 REQUIRED ACTIONS:\n');
    console.log('Ask the database owner to:');
    console.log('  • Go to MongoDB Atlas → Network Access');
    console.log('  • Add IP Address: 0.0.0.0/0 (Allow from anywhere)');
    console.log('  • Wait 2 minutes for it to activate\n');
    console.log('  • OR verify Database Access → User: blotter_service_user exists');
    console.log('  • OR provide a fresh connection string\n');
    
    console.log('📧 Send them this message:\n');
    console.log('---');
    console.log('Hi! I cannot connect to the database.');
    console.log('Error: "bad auth: authentication failed"');
    console.log('');
    console.log('Please:');
    console.log('1. Whitelist IP 0.0.0.0/0 in Network Access');
    console.log('2. Verify user "blotter_service_user" exists in Database Access');
    console.log('3. Send me a screenshot of both settings');
    console.log('---\n');
  }
  
  process.exit(successCount > 0 ? 0 : 1);
}

runDiagnostics();
