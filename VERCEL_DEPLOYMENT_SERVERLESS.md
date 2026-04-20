# Vercel Serverless Functions Setup (ALTERNATIVE)

**⚠️ Not Recommended** - Use the separated backend approach instead (see VERCEL_DEPLOYMENT.md)

---

## Only Use This If:
- You absolutely must deploy everything on Vercel
- Your queries are simple and quick (< 10 seconds)
- You're comfortable with serverless trade-offs

---

## Option: Convert Backend to Serverless Functions

If you still want to try this approach:

### 1. Update vercel.json

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "npm install && cd frontend && npm install",
  "functions": {
    "api/*.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

### 2. Create `/api` Folder Structure

```
/api
  /cases.js
  /summons.js
  /curfews.js
  /blacklist.js
  /residents.js
  /person.js
```

### 3. Convert Routes to Functions

Each file exports a handler function. Example: `api/cases.js`

```javascript
import casesRouter from '../backend/routes/cases.js';

export default async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle requests
  // This is complex because serverless functions don't map directly to Express routers
};
```

### 4. Update Frontend API URL

```
VITE_API_URL=/api
```

### ⚠️ Limitations You'll Face:
1. **Timeout Issues**: Queries taking > 10 seconds will fail
2. **Connection Pooling**: Each request makes a new MongoDB connection (very slow)
3. **Complex to Maintain**: Converting Express routes to serverless functions is tedious
4. **Cold Starts**: First request after deploy takes 5+ seconds

---

## Recommendation: Just Use Option 1

Deploy your backend on **Railway** (2 minutes setup):

1. Go to railway.app
2. Connect GitHub
3. Select `backend/` folder
4. Add MongoDB URI
5. Deploy

Much simpler, more reliable, and better performance.

---

## Still Want to Try Serverless?

Follow Vercel's official guide:
https://vercel.com/docs/functions/serverless-functions

But you'll need to significantly refactor your Express code.
