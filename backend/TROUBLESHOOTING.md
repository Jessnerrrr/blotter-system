# 🔧 MongoDB Connection Troubleshooting Guide

## ❌ Current Error: `bad auth : authentication failed`

This means the MongoDB credentials are not working. Here's how to fix it:

---

## 🛠️ Solution Steps

### 1. **Verify IP Whitelist in MongoDB Atlas**

Your IP address must be whitelisted in MongoDB Atlas:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Login to your account
3. Select your project
4. Click **"Network Access"** in the left sidebar
5. Click **"Add IP Address"**
6. Choose **"Allow Access from Anywhere"** (0.0.0.0/0) for development
   - OR add your specific IP address
7. Click **"Confirm"**

⚠️ **Important**: Changes take 1-2 minutes to apply

---

### 2. **Verify Database User Credentials**

Ask your team leader to verify in MongoDB Atlas:

1. Go to **"Database Access"** in left sidebar
2. Click on the `blotter_service_user` user
3. Verify:
   - ✅ Password is: `pkwPvPQKUFGWO6Ji`
   - ✅ User has **"Read and Write"** permissions
   - ✅ Database is set to **`blotter_db`** or **"Any Database"**

If the user doesn't exist or password is wrong, they need to:
- Click **"Add New Database User"**
- Username: `blotter_service_user`
- Password: `pkwPvPQKUFGWO6Ji`
- Database User Privileges: **"Read and write to any database"**
- Click **"Add User"**

---

### 3. **Test Connection String**

The connection string in `.env` should be:
```
MONGODB_URI=mongodb+srv://blotter_service_user:pkwPvPQKUFGWO6Ji@barangaycluster.seb5lfn.mongodb.net/blotter_db?appName=BarangayCluster
```

Common issues:
- ❌ Special characters in password not URL-encoded
- ❌ Wrong cluster name
- ❌ Wrong database name
- ❌ Spaces in the connection string

---

### 4. **Try Alternative Connection String** (if above doesn't work)

If the password has special characters that need encoding:
```
MONGODB_URI=mongodb+srv://blotter_service_user:pkwPvPQKUFGWO6Ji@barangaycluster.seb5lfn.mongodb.net/?retryWrites=true&w=majority&appName=BarangayCluster
```

---

## 🧪 Test the Connection

### Option 1: Using MongoDB Compass (Recommended)
1. Download [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Open it
3. Paste your connection string
4. Click **"Connect"**
5. If it works, the backend should work too

### Option 2: Using Node.js Script
Create a test file `test-connection.js` in the backend folder:
```javascript
import mongoose from 'mongoose';

const uri = 'mongodb+srv://blotter_service_user:pkwPvPQKUFGWO6Ji@barangaycluster.seb5lfn.mongodb.net/blotter_db?appName=BarangayCluster';

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Connection successful!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
```

Run: `node test-connection.js`

---

## 📞 What to Ask Your Team Leader

If nothing works, ask them to:

1. **Share a screenshot** of:
   - Database Access page (user list)
   - Network Access page (IP whitelist)

2. **Create a new database user** specifically for you:
   - Go to Database Access → Add New Database User
   - Username: `blotter_service_user`
   - Authentication Method: **Password**
   - Password: `pkwPvPQKUFGWO6Ji` (or create a new one)
   - Built-in Role: **Atlas admin** (for testing) or **Read and write to any database**
   - Restrict Access to Specific Clusters: Select your cluster
   - Click **Add User**

3. **Get the correct connection string**:
   - Go to **Database** → Click **"Connect"**
   - Choose **"Connect your application"**
   - Driver: **Node.js**
   - Version: **Latest**
   - Copy the connection string
   - Replace `<password>` with actual password

---

## 🔐 Alternative: Use Your Own MongoDB

If team database doesn't work, create your own free MongoDB Atlas database:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create free account
3. Create free cluster (M0)
4. Create database user
5. Whitelist your IP (0.0.0.0/0 for testing)
6. Get connection string
7. Update `.env` file

---

## ✅ Once Connected

You'll see this message:
```
✅ MongoDB Connected: barangaycluster.seb5lfn.mongodb.net
📊 Database: blotter_db
🚀 Server running on port 5000
```

Then your API will be ready to use!
