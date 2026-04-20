# 🚀 Quick Start: Deploy on Vercel

## What Changed?

✅ Removed unstable `experimentalServices` config
✅ Simplified `vercel.json` for frontend-only deployment
✅ Updated frontend API to use environment variables
✅ Updated backend CORS to support production URLs

---

## Fastest Path to Production (5 minutes)

### Step 1: Deploy Backend (Railway)

```bash
# 1. Go to https://railway.app and sign in with GitHub
# 2. Create "New Project" → "GitHub Repo" → select your repo
# 3. Configure:
#    - Root Directory: backend
#    - Start Command: npm start
# 4. Add environment variable:
#    - MONGODB_URI: your MongoDB Atlas connection string
# 5. Deploy (automatic)
# 6. Copy your Railway URL (e.g., https://blotter.railway.app)
```

### Step 2: Deploy Frontend (Vercel)

```bash
# 1. Go to https://vercel.com and sign in with GitHub
# 2. Click "Add New Project"
# 3. Import your repository
# 4. Settings (auto-detected):
#    - Build Command: cd frontend && npm run build
#    - Output Directory: frontend/dist
# 5. Add Environment Variable:
#    - VITE_API_URL: https://blotter.railway.app/api
# 6. Deploy (automatic)
```

### Step 3: Local Development

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Visit `http://localhost:5173` - it will auto-connect to your local backend!

---

## What Each File Does

| File | Purpose |
|------|---------|
| [vercel.json](vercel.json) | Simple frontend build config (no services) |
| [frontend/.env.example](frontend/.env.example) | Frontend env vars template |
| [backend/.env.example](backend/.env.example) | Backend env vars template |
| [backend/server.js](backend/server.js) | Updated CORS for Vercel URLs |
| [frontend/src/services/api.js](frontend/src/services/api.js) | Uses `VITE_API_URL` env var |
| [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) | Full deployment guide |

---

## Testing Locally

```bash
# 1. Start backend on port 5000
cd backend && npm run dev

# 2. Start frontend on port 5173
cd frontend && npm run dev

# 3. Test API in browser console:
fetch('http://localhost:5000/api/cases')
  .then(r => r.json())
  .then(d => console.log(d))

# 4. Check frontend uses correct API:
# Should call http://localhost:5000/api (from .env.local)
```

---

## If Deployment Fails

### CORS Error?
- Add your Vercel URL to `backend/server.js`
- Or set `FRONTEND_URL` env var in your backend platform

### API Not Found?
- Check `VITE_API_URL` is set correctly in Vercel
- Check backend is running and has correct URL

### MongoDB Error?
- Verify `MONGODB_URI` in your backend platform env vars
- Check MongoDB Atlas network access (whitelist IPs)

---

## Next Steps

1. ✅ Commit changes: `git add . && git commit -m "Vercel deployment setup"`
2. ✅ Push to GitHub: `git push origin main`
3. ✅ Follow "Fastest Path to Production" steps above
4. ✅ Monitor deployment logs in Railway/Vercel dashboards

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└──────────────┬────────────────────────────────┬──────────────┘
               │                                │
      ┌────────▼─────────┐           ┌─────────▼───────┐
      │ Vercel Frontend   │           │  Railway Backend │
      │ (Your Vite App)   │           │  (Node + Express)│
      │ https://...app    │◄─────────►│ https://...app   │
      └────────────────────┘           └─────────┬────────┘
                │                               │
                │                     ┌─────────▼──────────┐
                │                     │  MongoDB Atlas     │
                │                     │  (Cloud Database)  │
                └─────────────────────►└───────────────────┘
```

✅ **Simple, stable, production-ready!**
