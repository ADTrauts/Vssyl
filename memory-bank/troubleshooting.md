# Troubleshooting Guide - Vssyl Platform

## Current Session Issues & Solutions (January 2025)

### **API Routing Issues - RESOLVED** ✅

#### **Problem**: 404 Errors for Multiple API Endpoints
**Symptoms:**
```
GET https://vssyl.com/api/features/all 404 (Not Found)
GET https://vssyl.com/api/chat/api/chat/conversations 404 (Not Found)
```

**Root Causes:**
1. **Environment Variable Issues**: Next.js API routes using undefined `process.env.NEXT_PUBLIC_API_URL`
2. **Double Path Issues**: Chat API functions passing `/api/chat/conversations` as endpoint, but `apiCall` already adding `/api/chat` prefix

**Solutions Applied:**
1. **Fixed Environment Variables**: Updated all 9 Next.js API route files to use `process.env.NEXT_PUBLIC_API_BASE_URL` with proper fallback
2. **Fixed Chat API Paths**: Removed `/api/chat` prefix from all endpoint calls in `web/src/api/chat.ts`

**Files Modified:**
- `web/src/app/api/features/all/route.ts`
- `web/src/app/api/features/check/route.ts`
- `web/src/app/api/features/module/route.ts`
- `web/src/app/api/features/usage/route.ts`
- `web/src/app/api/trash/items/route.ts`
- `web/src/app/api/trash/delete/[id]/route.ts`
- `web/src/app/api/trash/restore/[id]/route.ts`
- `web/src/app/api/trash/empty/route.ts`
- `web/src/app/api/[...slug]/route.ts`
- `web/src/api/chat.ts`

**Verification:**
- All endpoints now return authentication errors instead of 404s
- Build deployed successfully (Build ID: 8990f80d-b65b-4adf-948e-4a6ad87fe7fc)

---

### **Browser Cache Issues - IDENTIFIED** ⚠️

#### **Problem**: Users See Old Error Logs After Deployment
**Symptoms:**
```
API Call Debug: {endpoint: '/api/features/all', API_BASE_URL: '', NEXT_PUBLIC_API_BASE_URL: undefined, NEXT_PUBLIC_API_URL: undefined, finalUrl: '/api/features/all', …}
```

**Root Cause**: Browser cache holding old JavaScript files from previous deployment

**Solutions:**
1. **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear Browser Cache**: 
   - Open Developer Tools (`F12`)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"
3. **Incognito Mode**: Test in private/incognito window to bypass cache

**Verification**: API endpoints work correctly when tested directly with curl commands

---

### **WebSocket Connection Issues - EXPECTED BEHAVIOR** 🔌

#### **Problem**: WebSocket Connection Failures
**Symptoms:**
```
WebSocket connection to 'wss://vssyl-server-235369681725.us-central1.run.app/socket.io/' failed
🔄 Attempting to reconnect (1/5)
🔄 Attempting to reconnect (2/5)
...
❌ Max reconnection attempts reached
```

**Root Cause**: WebSocket requires authentication; fails when user is not logged in or session is invalid

**Status**: **EXPECTED BEHAVIOR** - This is normal when:
- User is not authenticated
- Session token is expired
- User is not logged in

**Configuration**: Socket.IO is properly configured on backend with:
- CORS settings for allowed origins
- Authentication middleware
- Proper error handling

**Resolution**: WebSocket will connect successfully once user is properly authenticated with valid session token

---

## Build System Issues - RESOLVED ✅

### **Problem**: Builds Taking 20+ Minutes
**Root Cause**: Machine type configuration issues in Cloud Build

**Solution**: 
- Switched to E2_HIGHCPU_8 machine type
- Optimized Cloud Build configuration
- Removed problematic environment variable settings

**Result**: Builds now complete in 7-8 minutes consistently

---

## Common Troubleshooting Steps

### **For API Issues:**
1. **Check Build Status**: Verify latest build deployed successfully
2. **Test Endpoints Directly**: Use curl to test API endpoints
3. **Clear Browser Cache**: Hard refresh to get latest frontend code
4. **Check Authentication**: Ensure user is properly logged in

### **For WebSocket Issues:**
1. **Check Authentication**: WebSocket requires valid session token
2. **Verify Backend Status**: Ensure server is running and accessible
3. **Check CORS Settings**: Verify allowed origins in Socket.IO configuration

### **For Build Issues:**
1. **Check Cloud Build Logs**: Review build logs for specific errors
2. **Verify Machine Type**: Ensure E2_HIGHCPU_8 is available in region
3. **Check Environment Variables**: Verify no problematic env var settings

---

## Environment Variable Reference

### **Frontend Environment Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - Primary API base URL (preferred)
- `NEXT_PUBLIC_API_URL` - Fallback API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (optional)

### **Backend Environment Variables:**
- `BACKEND_URL` - Backend server URL
- `DATABASE_URL` - Database connection string
- `FRONTEND_URL` - Frontend URL for CORS

### **Fallback Hierarchy:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
                    process.env.NEXT_PUBLIC_API_URL || 
                    'https://vssyl-server-235369681725.us-central1.run.app';
```

---

## Production URLs

### **Service Endpoints:**
- **Frontend**: https://vssyl.com
- **Backend**: https://vssyl-server-235369681725.us-central1.run.app
- **WebSocket**: wss://vssyl-server-235369681725.us-central1.run.app/socket.io/

### **API Proxy:**
- Next.js API routes at `/api/*` proxy to backend server
- Authentication handled via NextAuth session tokens
- CORS configured for production domains

---

## Known Issues & Workarounds

### **Browser Cache After Deployment:**
- **Issue**: Users see old error logs after successful deployment
- **Workaround**: Always instruct users to hard refresh after deployment
- **Prevention**: Consider implementing cache-busting strategies

### **WebSocket Authentication:**
- **Issue**: WebSocket fails when user not authenticated
- **Workaround**: This is expected behavior, not an error
- **Documentation**: Clearly document that WebSocket requires authentication

### **Environment Variable Consistency:**
- **Issue**: Mixed usage of `NEXT_PUBLIC_API_URL` vs `NEXT_PUBLIC_API_BASE_URL`
- **Solution**: Standardized on `NEXT_PUBLIC_API_BASE_URL` as primary
- **Prevention**: Use consistent naming across all files

---

## Testing Checklist

### **After Each Deployment:**
- [ ] Test API endpoints with curl
- [ ] Verify frontend loads without console errors
- [ ] Check authentication flow
- [ ] Test WebSocket connection (when authenticated)
- [ ] Verify environment variables in browser console

### **For New Features:**
- [ ] Test API routing
- [ ] Verify environment variable usage
- [ ] Check WebSocket integration
- [ ] Test authentication requirements
- [ ] Verify CORS settings

---

## Contact & Support

### **Build Issues:**
- Check Cloud Build logs in Google Cloud Console
- Verify machine type availability
- Check environment variable configuration

### **API Issues:**
- Test endpoints directly with curl
- Check browser network tab
- Verify authentication status

### **WebSocket Issues:**
- Check authentication status
- Verify backend server status
- Check CORS configuration

---

*Last Updated: January 2025*
*Session: API Routing Fixes & Browser Cache Issues*
