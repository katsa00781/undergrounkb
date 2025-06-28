# Development Environment Configuration

## Email Issues Fix

The Supabase project has temporarily restricted email sending due to bounce rate issues.
This happened because we were testing with fake email addresses during development.

### Immediate Actions Taken:

1. **Modified AuthContext**: Disabled email redirects during development
2. **Created safe test script**: `test-auth-no-email.cjs` that doesn't trigger emails
3. **Documented safe testing practices** below

### Safe Testing Practices:

1. **Use valid email addresses for testing**:
   - Use your own email addresses
   - Use Gmail addresses that actually exist
   - Use temporary email services like 10minutemail.com

2. **Development Mode Settings**:
   - Consider disabling email confirmation in Supabase Auth settings for development
   - Use local testing tools that don't send real emails

3. **Email Verification Bypass** (for development):
   ```sql
   -- In Supabase SQL Editor, you can manually verify users:
   UPDATE auth.users 
   SET email_confirmed_at = NOW() 
   WHERE email = 'your-test-email@gmail.com';
   ```

### Next Steps:

1. **Wait for email restrictions to lift** (usually 24-48 hours)
2. **Consider setting up custom SMTP** for production use
3. **Use only valid emails** for future testing

### Testing Commands:

```bash
# Safe database testing (no emails sent)
node test-auth-no-email.cjs

# Normal app testing with valid emails only
npm run dev
```
