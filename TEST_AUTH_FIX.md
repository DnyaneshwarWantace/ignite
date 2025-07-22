# Authentication Fix Test Guide

## 🎯 **What Was Fixed:**

1. **NextAuth Configuration** - Added user creation in signIn callback
2. **getLoggedInUser Function** - Added fallback user creation if user doesn't exist in database
3. **Database Foreign Key Issue** - Fixed by ensuring users exist in database before creating folders

## 🧪 **How to Test:**

### Step 1: Test Authentication
1. Visit `http://localhost:3000`
2. Click "Sign In" 
3. Sign in with Google
4. Should redirect to `/x-ray` page successfully

### Step 2: Test Adding Brand to Folder
1. Go to the X-Ray page
2. Click "Add Brand" or "Add to Folder"
3. Enter a Facebook page ID (e.g., `434174436675167`)
4. Select "Default" folder
5. Click "Add Brand"

### Step 3: Check Database
The user should now be created in the database and the folder creation should work.

## 🔍 **Expected Behavior:**

- ✅ No more 500 errors on `/api/auth/session`
- ✅ No more foreign key constraint errors
- ✅ User gets created in database automatically
- ✅ Folders can be created successfully
- ✅ Brands can be added to folders

## 📊 **Debug Information:**

Check the console logs for:
- `"getLoggedInUser - User not found in database, creating from session"`
- `"getLoggedInUser - Created user in database: [user-id]"`
- `"Created new Default folder for user: [user-id]"`

## 🚨 **If Issues Persist:**

1. **Clear browser cookies** and try again
2. **Check database connection** - ensure Neon database is accessible
3. **Restart the development server** - `npm run dev`
4. **Check environment variables** - ensure all required vars are set

## 🎉 **Success Indicators:**

- User can log in successfully
- No console errors related to authentication
- Can create folders and add brands
- Database shows user and folder records 