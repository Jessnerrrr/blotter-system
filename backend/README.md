# Blotter System Backend API

Backend API for the Barangay Blotter System using Node.js, Express, and MongoDB.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
The `.env` file is already configured with your MongoDB credentials:
```
MONGODB_URI=mongodb+srv://blotter_service_user:pkwPvPQKUFGWO6Ji@barangaycluster.seb5lfn.mongodb.net/blotter_db?appName=BarangayCluster
PORT=5000
FRONTEND_URL=http://localhost:5174
```

### 3. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The API will run on **http://localhost:5000**

## 📡 API Endpoints

### Cases
- `GET /api/cases` - Get all cases
- `GET /api/cases/:id` - Get single case
- `POST /api/cases` - Create new case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Summons
- `GET /api/summons` - Get all summons
- `GET /api/summons/:id` - Get single summons
- `POST /api/summons` - Create new summons
- `PUT /api/summons/:id` - Update summons
- `DELETE /api/summons/:id` - Delete summons

### Curfew Violations
- `GET /api/curfews` - Get all curfew violations
- `GET /api/curfews/:id` - Get single curfew violation
- `POST /api/curfews` - Create new curfew violation
- `PUT /api/curfews/:id` - Update curfew violation
- `DELETE /api/curfews/:id` - Delete curfew violation

### Blacklist
- `GET /api/blacklist` - Get all blacklist entries
- `GET /api/blacklist/:id` - Get single blacklist entry
- `POST /api/blacklist` - Create new blacklist entry
- `PUT /api/blacklist/:id` - Update blacklist entry
- `DELETE /api/blacklist/:id` - Delete blacklist entry

## 🧪 Testing the API

You can test the API using:
- **Browser**: http://localhost:5000
- **Postman**: Import endpoints and test
- **curl**: 
```bash
# Get all cases
curl http://localhost:5000/api/cases

# Create a new case
curl -X POST http://localhost:5000/api/cases \
  -H "Content-Type: application/json" \
  -d '{"type":"LUPON","status":"PENDING","caseNo":"01-167-03-2026","complainantName":"Test User"}'
```

## 📦 Project Structure
```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   ├── Case.js            # Case model
│   ├── Summons.js         # Summons model
│   ├── Curfew.js          # Curfew violation model
│   └── Blacklist.js       # Blacklist model
├── routes/
│   ├── cases.js           # Case routes
│   ├── summons.js         # Summons routes
│   ├── curfews.js         # Curfew routes
│   └── blacklist.js       # Blacklist routes
├── .env                   # Environment variables
├── .gitignore
├── package.json
└── server.js              # Main server file
```

## 🔒 Security Notes
- The `.env` file contains sensitive credentials
- Make sure `.gitignore` includes `.env`
- Never commit credentials to Git

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify your IP is whitelisted in MongoDB Atlas
- Check credentials in `.env` file
- Ensure internet connection is stable

### Port Already in Use
Change the PORT in `.env` file:
```
PORT=5001
```
