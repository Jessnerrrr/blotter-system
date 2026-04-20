# Vercel Deployment Guide

## Architecture

This project uses a **separated deployment strategy**:

- **Frontend**: Deployed on Vercel (Vite app)
- **Backend**: Deployed separately on Railway, Render, Heroku, or similar platform
- **Database**: MongoDB Atlas (or your MongoDB service)

This approach is:
✅ Simple and stable
✅ Avoids Vercel serverless timeouts
✅ Supports persistent MongoDB connections
✅ Industry-standard best practice

---

## Step 1: Deploy Frontend on Vercel

### Prerequisites
- Vercel account (free tier available)
- GitHub account (for easy integration)

### Setup

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Setup for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the root directory: `/` (default)
   - Framework: **Vite**
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`

3. **Set Environment Variables in Vercel**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add: `VITE_API_URL` = `https://your-backend-api.com/api` (your backend URL)

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy when you push to GitHub

---

## Step 2: Deploy Backend Separately

### Option A: Railway (Recommended)

1. **Sign up at [railway.app](https://railway.app)**

2. **Connect GitHub**
   - Create new project → GitHub Repo
   - Select your repository

3. **Configure Build Settings**
   - Root Directory: `backend`
   - Start Command: `npm start`
   - Port: `5000` (default)

4. **Add MongoDB Connection**
   - Create MongoDB Atlas cluster or use existing
   - Add `MONGODB_URI` as environment variable
   - Format: `mongodb+srv://user:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

5. **Deploy**
   - Copy your Railway URL (e.g., `https://blotter-backend.railway.app`)
   - Add to Frontend `VITE_API_URL`: `https://blotter-backend.railway.app/api`

### Option B: Render.com

1. **Sign up at [render.com](https://render.com)**

2. **Create New Web Service**
   - Connect GitHub repository
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `backend`

3. **Add Environment Variables**
   - `MONGODB_URI`: Your MongoDB connection string
   - `PORT`: `5000`
   - `CORS_ORIGIN`: Your Vercel frontend URL

4. **Deploy and get URL**
   - Copy your Render URL (e.g., `https://blotter-backend.onrender.com`)
   - Add to Frontend: `https://blotter-backend.onrender.com/api`

### Option C: Heroku

1. **Install Heroku CLI**: `npm install -g heroku`

2. **Create Heroku app**
   ```bash
   heroku create blotter-backend
   heroku config:set MONGODB_URI="your-mongodb-uri"
   ```

3. **Deploy**
   ```bash
   git subtree push --prefix backend heroku main
   ```

---

## Step 3: Update Frontend Configuration

### Local Development

1. **Copy environment file**
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

2. **Update for local backend**
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start backend locally**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Start frontend locally**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Production

Frontend will use the `VITE_API_URL` set in Vercel environment variables.

---

## Troubleshooting

### CORS Errors
- Update `backend/server.js` CORS origin to include your Vercel URL:
  ```javascript
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://your-frontend-url.vercel.app'
  ];
  ```

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access (allow all IPs for development)
- Ensure IP whitelist includes your deployment platform

### API Not Responding
- Check backend logs on Railway/Render/Heroku
- Verify `VITE_API_URL` in Vercel is correct
- Test backend directly: `curl https://your-backend-url/api`

---

## Summary

✅ **Final URLs**
- Frontend: `https://your-project.vercel.app`
- Backend API: `https://your-backend.railway.app/api` (or similar)
- Database: MongoDB Atlas

✅ **No serverless function conversion needed** - This approach works out of the box!

✅ **Easy to maintain** - Backend and frontend can be updated independently
