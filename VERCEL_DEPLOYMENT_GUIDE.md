# Vercel Deployment Guide - Environment Variables Setup

## 🚨 **Current Issue Fixed**
The `vercel.json` was referencing secrets that don't exist in your Vercel project. I've updated it to remove those references.

## 📋 **Required Environment Variables for Vercel**

You need to add these environment variables in your Vercel dashboard:

### 1. Go to Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Select your project (`ignite`)
3. Go to **Settings** → **Environment Variables**

### 2. Add These Environment Variables

#### **Database Configuration**
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_OTdtgJk18qeG@ep-rapid-paper-a1phvwlf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Environment: Production, Preview, Development
```

#### **NextAuth Configuration**
```
Name: NEXTAUTH_URL
Value: https://ignite-mqao2qcbq-dnyaneshwar-s-projects-b1f40a2a.vercel.app
Environment: Production, Preview, Development
```

```
Name: NEXTAUTH_SECRET
Value: your-super-secret-key-here-make-it-long-and-random-at-least-32-characters
Environment: Production, Preview, Development
```

#### **Google OAuth (Required for Authentication)**
```
Name: AUTH_GOOGLE_ID
Value: 403934823504-qjuou59jk3kfc7bv6ejuko8h3dktu8db.apps.googleusercontent.com
Environment: Production, Preview, Development
```

```
Name: AUTH_GOOGLE_SECRET
Value: your-google-client-secret-here
Environment: Production, Preview, Development
```

#### **API Configuration**
```
Name: NEXT_PUBLIC_BACKEND_URL
Value: https://ignite-mqao2qcbq-dnyaneshwar-s-projects-b1f40a2a.vercel.app/api/v1
Environment: Production, Preview, Development
```

#### **Cloudinary Configuration**
```
Name: CLOUDINARY_CLOUD_NAME
Value: dwzdr8ei9
Environment: Production, Preview, Development
```

```
Name: CLOUDINARY_API_KEY
Value: 741397439758848
Environment: Production, Preview, Development
```

```
Name: CLOUDINARY_API_SECRET
Value: kOPze_jNVA8xgTAA5GsjSTMLLig
Environment: Production, Preview, Development
```

#### **Scrape Creators API**
```
Name: SCRAPE_CREATORS_API_KEY
Value: 7jFsufrf1yZE9Yc0BmfOgtUQeIr2
Environment: Production, Preview, Development
```

```
Name: SCRAPE_CREATORS_BASE_URL
Value: https://api.scrapecreators.com/v1/facebook/adLibrary
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_SCRAPE_CREATORS_API_KEY
Value: 7jFsufrf1yZE9Yc0BmfOgtUQeIr2
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_SCRAPE_CREATORS_BASE_URL
Value: https://api.scrapecreators.com/v1/facebook/adLibrary
Environment: Production, Preview, Development
```

#### **Environment**
```
Name: NODE_ENV
Value: production
Environment: Production, Preview, Development
```

## 🔑 **Generate NEXTAUTH_SECRET**

If you don't have a secret key, generate one:

### Option 1: Online Generator
Visit: https://generate-secret.vercel.app/32

### Option 2: Command Line
```bash
openssl rand -base64 32
```

### Option 3: Use This Temporary Key
```
temporary-secret-key-for-testing-123456789012345678901234567890
```

## 📝 **Step-by-Step Instructions**

1. **Open Vercel Dashboard**
   - Go to your project
   - Click **Settings**
   - Click **Environment Variables**

2. **Add Each Variable**
   - Click **Add New**
   - Enter the **Name** and **Value**
   - Select **Production**, **Preview**, and **Development** environments
   - Click **Save**

3. **Redeploy**
   - Go to **Deployments**
   - Click **Redeploy** on your latest deployment
   - Or push a new commit to trigger deployment

## 🎯 **Quick Test**

After adding the environment variables:

1. **Check Deployment Logs**
   - Look for any remaining environment variable errors
   - Should see successful build and deployment

2. **Test the App**
   - Visit your Vercel URL
   - Try to sign in with Google
   - Should work without errors

## 🚨 **Common Issues & Solutions**

### "Environment Variable X references Secret Y, which does not exist"
- **Solution**: Remove secret references from `vercel.json` (✅ Already done)
- **Solution**: Add environment variables directly in Vercel dashboard

### "NEXTAUTH_SECRET is not set"
- **Solution**: Add NEXTAUTH_SECRET environment variable in Vercel

### "AUTH_GOOGLE_ID is not set"
- **Solution**: Add AUTH_GOOGLE_ID environment variable in Vercel

### Database Connection Issues
- **Solution**: Ensure DATABASE_URL is correctly set
- **Solution**: Check if Neon database is accessible

## 🔄 **After Setting Environment Variables**

1. **Redeploy your project**
2. **Test authentication**
3. **Check all features work**

## 📞 **Need Help?**

If you still get errors after setting all environment variables:

1. Check the deployment logs in Vercel
2. Verify all variables are set correctly
3. Make sure the Neon database is accessible
4. Test the authentication flow

## ✅ **Success Checklist**

- [ ] All environment variables added to Vercel
- [ ] NEXTAUTH_SECRET is at least 32 characters
- [ ] DATABASE_URL is correct and accessible
- [ ] Google OAuth credentials are valid
- [ ] Deployment completes successfully
- [ ] Authentication works
- [ ] Database operations work 