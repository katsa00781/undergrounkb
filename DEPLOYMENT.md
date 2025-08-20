# Vercel Environment Variables Setup

## Required Environment Variables

Add these environment variables in the Vercel dashboard under Project Settings > Environment Variables:

### Production & Preview & Development

1. **VITE_SUPABASE_URL**
   - Value: `https://iipcpjczjjkwwifwzmut.supabase.co`
   - Environment: Production, Preview, Development

2. **VITE_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGNwamN6amprd3dpZnd6bXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDY2MTcsImV4cCI6MjA2NTQyMjYxN30.Q0l_XF8093ulhoasXmHfkVORDZBLpjoIAWC0_snQujY`
   - Environment: Production, Preview, Development

3. **VITE_SUPABASE_SCHEMA_CACHE**
   - Value: `false`
   - Environment: Production, Preview, Development

## Setup Instructions

1. Go to https://vercel.com/dashboard
2. Select your project (ugkettlebellpro)
3. Go to Settings > Environment Variables
4. Add each variable above with the specified values
5. Select the appropriate environments (Production, Preview, Development)
6. Save and redeploy if necessary

## Deployment URLs

- **Production**: https://ugkettlebellpro-ejhewrmyz-katsa00781s-projects.vercel.app
- **Preview**: https://ugkettlebellpro-8rgzshfu9-katsa00781s-projects.vercel.app

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase connection working
- [ ] Authentication flow working
- [ ] Database queries working
- [ ] All pages accessible
- [ ] Mobile responsiveness tested
- [ ] Performance optimization verified

## Troubleshooting

If the app shows connection errors:
1. Verify environment variables are set correctly
2. Check Supabase service status
3. Verify domain allowlist in Supabase auth settings
4. Check browser console for specific errors

## Custom Domain Setup (Optional)

To setup a custom domain:
1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update Supabase auth settings with new domain
