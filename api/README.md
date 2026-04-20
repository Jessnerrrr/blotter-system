# Vercel Serverless API Functions (OPTIONAL)

## About This Folder

This `/api` folder is optional and provides an **alternative deployment strategy** to Option 1 (separate backend).

If you want to run everything on Vercel using serverless functions instead of deploying the backend separately, use this approach.

## ⚠️ Trade-offs

**Pros:**
- Single platform (Vercel)
- No need to deploy backend separately
- Simpler CI/CD pipeline

**Cons:**
- ❌ Serverless functions have 10-60 second timeout limits
- ❌ No persistent connections (new MongoDB connection per request = slower)
- ❌ Can't use sessions or long-running operations
- ❌ More complex function structure
- ❌ Limited by Vercel's computational resources

## Recommended: Use Option 1 (Separate Backend)

For a production blotter system with MongoDB, **Option 1 is strongly recommended** because:
1. No timeout issues with database queries
2. Better performance with persistent connections
3. Cleaner separation of concerns
4. Industry standard approach

## If You Still Want to Use Serverless Functions

See `VERCEL_DEPLOYMENT_SERVERLESS.md` for detailed setup instructions.
