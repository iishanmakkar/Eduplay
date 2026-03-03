# 🔐 Google Workspace SSO Integration Guide

## Overview
This guide explains how to set up Google Workspace Single Sign-On (SSO) for EduPlay Pro, allowing teachers and students to sign in with their school Google accounts.

---

## Prerequisites

1. **Google Workspace Account** (formerly G Suite)
2. **Admin access** to Google Cloud Console
3. **Domain verification** (your school domain)

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `EduPlay Pro SSO`
4. Click "Create"

---

## Step 2: Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click "Enable"

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **Internal** (for Google Workspace users only)
   - Or **External** if you want to allow any Google account
3. Fill in the required fields:
   - **App name**: EduPlay Pro
   - **User support email**: your-email@school.edu
   - **Developer contact**: your-email@school.edu
4. Click "Save and Continue"

### Scopes
5. Click "Add or Remove Scopes"
6. Add these scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/classroom.rosters.readonly` (optional - for Google Classroom integration)
7. Click "Update" → "Save and Continue"

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Select **Application type**: Web application
4. Enter **Name**: EduPlay Pro Web Client
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://yourdomain.com
   ```
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```
7. Click "Create"
8. **Copy the Client ID and Client Secret** - you'll need these!

---

## Step 5: Configure Environment Variables

Add these to your `.env` file:

```bash
# Google Workspace SSO
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

---

## Step 6: Update NextAuth Configuration

The Google provider has already been added to `lib/auth-with-google.ts`. To activate it:

1. Replace `lib/auth.ts` with `lib/auth-with-google.ts`:
   ```bash
   mv lib/auth.ts lib/auth-backup.ts
   mv lib/auth-with-google.ts lib/auth.ts
   ```

2. Or merge the Google provider into your existing `lib/auth.ts`

---

## Step 7: Update Sign-In Page

Add a "Sign in with Google" button to your sign-in page:

```tsx
import { signIn } from 'next-auth/react'

<button
  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
>
  <img src="/google-logo.svg" alt="Google" className="w-5 h-5" />
  <span className="font-semibold text-gray-700">Sign in with Google</span>
</button>
```

---

## Step 8: Domain Restrictions (Optional)

To restrict sign-ins to specific school domains:

1. Edit `lib/auth.ts`
2. Uncomment the domain restriction code in the Google provider profile callback:

```typescript
async profile(profile) {
  // Restrict to school domains
  const allowedDomains = ['yourschool.edu', 'district.edu']
  const domain = profile.email.split('@')[1]
  
  if (!allowedDomains.includes(domain)) {
    throw new Error('Only school email addresses are allowed')
  }

  return {
    id: profile.sub,
    name: profile.name,
    email: profile.email,
    image: profile.picture,
    emailVerified: profile.email_verified ? new Date() : null
  }
}
```

---

## Step 9: Test the Integration

1. Start your development server: `npm run dev`
2. Go to `/auth/signin`
3. Click "Sign in with Google"
4. Sign in with a Google Workspace account
5. Verify you're redirected to the dashboard

---

## Step 10: Production Deployment

1. Update authorized redirect URIs in Google Cloud Console with production URL
2. Ensure environment variables are set in production
3. Test SSO in production environment

---

## Google Classroom Integration (Optional)

If you requested the `classroom.rosters.readonly` scope, you can fetch student rosters:

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.accessToken) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Fetch courses from Google Classroom
  const response = await fetch(
    'https://classroom.googleapis.com/v1/courses',
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`
      }
    }
  )

  const courses = await response.json()
  return Response.json(courses)
}
```

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in Google Cloud Console exactly matches your callback URL
- Check for trailing slashes
- Verify HTTP vs HTTPS

### Error: "access_denied"
- User may not be part of your Google Workspace organization (if using Internal app)
- Check domain restrictions in your code

### Error: "invalid_client"
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Ensure no extra spaces in environment variables

---

## Security Best Practices

1. **Use Internal app type** for Google Workspace to restrict to your organization
2. **Enable domain restrictions** in code to prevent unauthorized access
3. **Rotate client secrets** periodically
4. **Monitor OAuth consent screen** for suspicious activity
5. **Use HTTPS** in production (required by Google)

---

## Additional Features

### Auto-Assign Roles
Automatically assign teacher/student roles based on email:

```typescript
async signIn({ user, account, profile }) {
  if (account?.provider === 'google') {
    const email = user.email!
    const role = email.includes('teacher') ? 'TEACHER' : 'STUDENT'
    
    await prisma.user.upsert({
      where: { email },
      update: { role },
      create: {
        email,
        name: user.name || '',
        role,
        emailVerified: new Date()
      }
    })
  }
  return true
}
```

### Sync with Google Classroom
Automatically import classes and students from Google Classroom using the API.

---

## Support

- **Google Workspace Admin Help**: https://support.google.com/a
- **NextAuth.js Docs**: https://next-auth.js.org/providers/google
- **Google Cloud Console**: https://console.cloud.google.com/

---

**Your Google Workspace SSO is now configured! 🎉**
