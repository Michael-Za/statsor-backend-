# OAuth & Deployment Fix Guide

## Issues Identified

### 1. **Google OAuth redirect_uri_mismatch Error**
**Root Cause**: The callback URL in `backend/src/routes/auth.js` is hardcoded instead of using the environment variable.

**Current Code** (Line 88):
```javascript
callbackURL: 'https://statsor.com/api/v1/auth/google/callback'
```

**Should Be**:
```javascript
callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback'
```

### 2. **Email Signup Failures**
Need to verify Supabase configuration and email service setup.

### 3. **Backend Deployment Failures**
Health check and startup issues on Koyeb.

---

## Complete Fix Instructions

### Step 1: Fix Google OAuth Callback URL

The callback URL must match what's configured in Google Console. Currently you have:
- Google Console: `https://widespread-erminia-me11222222-6c28b28e.koyeb.app/api/v1/auth/google/callback`
- Backend ENV: `GOOGLE_CALLBACK_URL=https://widespread-erminia-me11222222-6c28b28e.koyeb.app/api/v1/auth/google/callback`
- Code: Hardcoded to `https://statsor.com/api/v1/auth/google/callback` ❌

**Fix Applied**: Updated `backend/src/routes/auth.js` to use environment variable.

### Step 2: Update Google Console Configuration

Your current Google OAuth settings:
```
Authorized JavaScript origins:
1. http://localhost:3008
2. http://localhost:3001
3. https://statsor.com
4. https://www.statsor.com
5. https://api.statsor.com

Authorized redirect URIs:
1. http://localhost:3001/api/v1/auth/google/callback
2. https://api.statsor.com/api/v1/auth/google/callback
3. https://kieihchqtyqquvispker.supabase.co/auth/v1/callback
4. https://widespread-erminia-me11222222-6c28b28e.koyeb.app/api/v1/auth/google/callback
5. https://statsor.com/auth/google/callback
```

**Recommended Changes**:
Add these to Authorized JavaScript origins:
- `https://widespread-erminia-me11222222-6c28b28e.koyeb.app`

Add these to Authorized redirect URIs:
- `https://statsor.com/api/v1/auth/google/callback` (for frontend-initiated OAuth)
- `https://www.statsor.com/api/v1/auth/google/callback`

### Step 3: Backend Environment Variables (Koyeb)

Ensure these are set correctly on Koyeb:

```env
# Core
NODE_ENV=production
PORT=3001

# CORS - CRITICAL
CORS_ORIGIN=https://statsor.com,https://www.statsor.com
FRONTEND_URL=https://statsor.com

# Google OAuth - CRITICAL
GOOGLE_CLIENT_ID=418379516613-1695v51lvdao41iebs7k06954i6o5221.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://widespread-erminia-me11222222-6c28b28e.koyeb.app/api/v1/auth/google/callback

# Supabase
SUPABASE_URL=https://kieihchqtyqquvispker.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZWloY2hxdHlxcXV2aXNwa2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzIyOTEsImV4cCI6MjA3NjIwODI5MX0.RTyUZcmdKv5Q24GBCsQPmYkyALAI4uz8y1m1ezh5g0g
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZWloY2hxdHlxcXV2aXNwa2VyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYzMjI5MSwiZXhwIjoyMDc2MjA4MjkxfQ.-4v3qy2vXBDNg_D5H3V5u1zOSDQveFNDPi-aCD-TSq0

# JWT - CRITICAL
JWT_SECRET=your_super_secure_jwt_secret_production_32_chars_minimum
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_production_32_chars_minimum
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=90d

# Email Service
EMAIL_FROM_NAME=Statsor Team
RESEND_API_KEY=re_WsMKhaDk_6v8sMfY9sDcX7xCahtYzDgjtR
RESEND_FROM_EMAIL=onboarding@resend.dev

# AI
GROQ_API_KEY=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

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Upload
UPLOAD_MAX_SIZE=52428800

# WebSocket
WS_PORT=3002
```

### Step 4: Frontend Environment Variables (Vercel)

Your current Vercel config looks good, but ensure:

```env
VITE_API_URL=https://widespread-erminia-me11222222-6c28b28e.koyeb.app/api/v1
VITE_APP_URL=https://statsor.com
VITE_WS_URL=wss://widespread-erminia-me11222222-6c28b28e.koyeb.app
VITE_SUPABASE_URL=https://kieihchqtyqquvispker.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZWloY2hxdHlxcXV2aXNwa2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzIyOTEsImV4cCI6MjA3NjIwODI5MX0.RTyUZcmdKv5Q24GBCsQPmYkyALAI4uz8y1m1ezh5g0g
VITE_GOOGLE_CLIENT_ID=418379516613-1695v51lvdao41iebs7k06954i6o5221.apps.googleusercontent.com
VITE_GROQ_API_KEY=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
VITE_PAYPAL_CLIENT_ID=Ae1W8tycyzeSJdYBYA8ValWLDE939vSvnFg6KnNVb5y5DJ0-gXwFDjmE8w2P4oNotUm32YPTginRVRz7
VITE_PAYPAL_MODE=live
VITE_PAYPAL_EMAIL=statsor1@gmail.com
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
VITE_DEBUG_MODE=false
NODE_ENV=production
```

### Step 5: Fix Backend Deployment Health Checks

**Issue**: Koyeb health checks might be failing.

**Solution**: Ensure your backend has proper health check endpoint and starts correctly.

The backend already has `/health` endpoint. Configure Koyeb:
- **Health Check Path**: `/health`
- **Health Check Port**: `3001` (or whatever PORT env var is set to)
- **Health Check Protocol**: `HTTP`

### Step 6: Fix Email Signup

**Potential Issues**:
1. Supabase email auth not configured
2. Email service (Resend) not working
3. Profile creation failing

**Fixes Applied**:
- Updated auth routes to handle profile creation properly
- Added better error handling for email signup

---

## Testing Checklist

### Local Testing
- [ ] Test Google OAuth login locally
- [ ] Test email signup locally
- [ ] Test email login locally
- [ ] Verify profile creation
- [ ] Check email delivery

### Production Testing
- [ ] Deploy backend to Koyeb
- [ ] Verify health check passes
- [ ] Test Google OAuth from production frontend
- [ ] Test email signup from production
- [ ] Verify CORS is working
- [ ] Check logs for errors

---

## Common Errors & Solutions

### Error: "redirect_uri_mismatch"
**Solution**: Ensure `GOOGLE_CALLBACK_URL` environment variable matches exactly what's in Google Console.

### Error: "Access blocked: This app's request is invalid"
**Solution**: 
1. Check that the callback URL uses the correct domain
2. Verify Google Console has the URL in authorized redirect URIs
3. Make sure you're using the correct Google Client ID

### Error: "Failed to create profile"
**Solution**: Check Supabase RLS policies allow profile creation.

### Error: "CORS error"
**Solution**: Ensure `CORS_ORIGIN` includes your frontend domain.

### Error: "Health check failed"
**Solution**: 
1. Check that the app starts without errors
2. Verify `/health` endpoint is accessible
3. Check logs for startup errors

---

## Deployment Steps

### 1. Update Backend Code
```bash
cd backend
git add .
git commit -m "fix: use environment variable for Google OAuth callback URL"
git push origin main
```

### 2. Redeploy on Koyeb
- Go to Koyeb dashboard
- Trigger a new deployment
- Monitor logs for errors
- Verify health check passes

### 3. Test OAuth Flow
1. Go to https://statsor.com/signin
2. Click "Sign in with Google"
3. Should redirect to Google
4. After authorization, should redirect back to your app
5. Should create profile and log in successfully

---

## Support & Debugging

### View Backend Logs
```bash
# On Koyeb dashboard, go to your service > Logs
```

### Test Health Endpoint
```bash
curl https://widespread-erminia-me11222222-6c28b28e.koyeb.app/health
```

### Test Google OAuth Endpoint
```bash
curl https://widespread-erminia-me11222222-6c28b28e.koyeb.app/api/v1/auth/google
```

### Check CORS
```bash
curl -H "Origin: https://statsor.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://widespread-erminia-me11222222-6c28b28e.koyeb.app/api/v1/auth/login
```

---

## Next Steps

1. ✅ Fix Google OAuth callback URL in code
2. ⏳ Push changes to GitHub
3. ⏳ Redeploy backend on Koyeb
4. ⏳ Test OAuth flow
5. ⏳ Fix email signup if still failing
6. ⏳ Monitor production logs

---

## Contact

If you encounter issues:
1. Check Koyeb logs
2. Check browser console
3. Check Supabase logs
4. Verify all environment variables are set correctly
