# Supabase SMTP Configuration Reference

## Quick Setup by Provider

### 🟢 Resend (Recommended)
```
SMTP Host:     smtp.resend.co
SMTP Port:     465 (SSL) or 587 (TLS)
SMTP Username: resend
SMTP Password: [Your Resend API Key]
From Address:  onboarding@resend.dev (for testing)
               or your verified domain
```
**Setup Steps:**
1. Go to https://resend.com
2. Sign up → Create API key
3. In Supabase: Auth → Email → SMTP Settings
4. Paste settings above
5. Click "Test Email"

**Pros:** Free tier, easy setup, no domain verification needed for testing
**Cons:** Limited to 100 emails/day on free plan

---

### 🔵 SendGrid
```
SMTP Host:     smtp.sendgrid.net
SMTP Port:     465 (SSL) or 587 (TLS)
SMTP Username: apikey
SMTP Password: [Your SendGrid API Key]
From Address:  [Your verified sender email]
```
**Setup Steps:**
1. Go to https://sendgrid.com → Sign up
2. Create API Key (Settings → API Keys)
3. Verify sender email (Settings → Sender Authentication)
4. In Supabase: Auth → Email → SMTP Settings
5. Paste settings above

**Pros:** Reliable, good free tier, detailed analytics
**Cons:** Need to verify domain/email

---

### 🟣 Mailgun
```
SMTP Host:     smtp.mailgun.org
SMTP Port:     465 (SSL) or 587 (TLS)
SMTP Username: postmaster@[your-domain].mailgun.org
SMTP Password: [Your Mailgun SMTP password]
From Address:  [Your Mailgun sending address]
```
**Setup Steps:**
1. Go to https://mailgun.com → Sign up
2. Add and verify your domain
3. Get SMTP credentials (Sending → Domain Settings → SMTP)
4. In Supabase: Auth → Email → SMTP Settings
5. Paste settings above

**Pros:** Powerful API, good for high volume
**Cons:** Domain verification required

---

### 🟡 Gmail (Testing Only)
```
SMTP Host:     smtp.gmail.com
SMTP Port:     465 (SSL)
SMTP Username: your_email@gmail.com
SMTP Password: [Your Gmail App Password - NOT your regular password]
From Address:  your_email@gmail.com
```
**Setup Steps:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Copy the 16-character password
4. In Supabase: Auth → Email → SMTP Settings
5. Paste settings above

⚠️ **WARNING:** Not for production. App Password is unique and should be treated like a password.

**Pros:** Quick, no signup needed if you have Gmail
**Cons:** Rate limited, not reliable, not for production

---

## How to Configure in Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your `voting_system` project

2. **Navigate to Email Settings**
   - Left sidebar → Authentication
   - Click "Providers"
   - Select "Email"

3. **Scroll to SMTP Configuration**
   - Find "SMTP Settings" section
   - Fill in the fields:
     - **SMTP Host**
     - **SMTP Port** (usually 465 or 587)
     - **SMTP Username**
     - **SMTP Password**
     - **Sender Email** (From Address)

4. **Enable Confirm email**
   - Check "Confirm email" checkbox
   - This enables email confirmation flow

5. **Test Configuration**
   - Click "Send Test Email"
   - Enter a test email address
   - Check that email arrives within 30 seconds

6. **(Optional) Customize Email Template**
   - Go to "Email Templates"
   - Select "Confirm signup"
   - Customize the confirmation message
   - You can include your app branding, instructions, etc.

---

## Troubleshooting SMTP

### Error: "SMTP connection failed"
- ✅ Check SMTP host is correct
- ✅ Verify port is correct (465 for SSL, 587 for TLS)
- ✅ Confirm username/password are correct
- ✅ Check firewall isn't blocking the port

### Error: "Authentication failed"
- ✅ Double-check API key/password (copy from provider dashboard)
- ✅ For Gmail: Ensure you're using App Password, not regular password
- ✅ For Resend/SendGrid: Verify API key hasn't expired

### Email not received
- ✅ Check spam/junk folder
- ✅ Verify "From Address" is correctly configured
- ✅ For production: Ensure domain is verified (if required by provider)
- ✅ Check Supabase email logs (Auth → Email → Email Log)

### Test email works, but registration emails don't send
- ✅ Verify RLS policies allow email insertion
- ✅ Check user.is_email_verified is being updated correctly
- ✅ Look at Supabase edge function logs
- ✅ Check browser console for JavaScript errors

---

## Environment Variables (for Edge Functions)

If you're using edge functions to send custom emails, add to `.env.local`:

```env
# Resend
RESEND_API_KEY=re_xxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxx

# Mailgun
MAILGUN_API_KEY=mg-xxxxx
MAILGUN_DOMAIN=mail.yourdomain.com

# Gmail
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

---

## After Email is Configured

1. **Test Registration**
   - Go to http://localhost:5173/register
   - Fill in the form with valid student data
   - Use a real email address you have access to
   - Check your inbox for confirmation email

2. **Verify Confirmation Works**
   - Click the confirmation link in the email
   - Return to the app
   - Click "I have confirmed"
   - Should redirect to face enrollment page

3. **Check Dashboard**
   - After confirming email, login as election officer
   - Email should show as verified (is_email_verified = true)

---

## Quick Checklist

- [ ] Choose email provider (Resend recommended)
- [ ] Get SMTP credentials from provider
- [ ] Enter credentials in Supabase Email → SMTP Settings
- [ ] Click "Test Email" - should arrive in 30 seconds
- [ ] Check "Confirm email" is enabled
- [ ] (Optional) Customize email template
- [ ] Test registration flow with real email
- [ ] Confirm email arrives and confirmation works
- [ ] Verify user can login after confirmation

**You're ready to go! 🚀**
