# Siloq Setup Guide

This guide will walk you through setting up Siloq from scratch.

## Step 1: Supabase Project Setup

### Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in the details:
   - **Project Name**: Siloq (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users
   - **Pricing Plan**: Free tier works great for development
4. Click "Create new project"
5. Wait 2-3 minutes for the project to be ready

### Get Your Supabase Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Run the Database Migration

1. In your Supabase dashboard, click **SQL Editor** in the sidebar
2. Click **New Query**
3. Open `supabase/migrations/20250115000000_initial_schema.sql` from this project
4. Copy the entire contents
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned" - this is correct!

### Set Up Storage Buckets

1. In Supabase dashboard, click **Storage** in the sidebar
2. Click **Create a new bucket**
3. Create two buckets:

   **Bucket 1: receipts**
   - Name: `receipts`
   - Public: **No** (private)
   - Click "Create bucket"

   **Bucket 2: logos**
   - Name: `logos`
   - Public: **Yes** (public)
   - Click "Create bucket"

4. For each bucket, set up policies:

   **For receipts bucket:**
   - Click on the `receipts` bucket
   - Go to "Policies" tab
   - Click "New Policy"
   - Use this custom policy:

   ```sql
   -- Insert policy
   CREATE POLICY "Users can upload own receipts"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'receipts' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Select policy
   CREATE POLICY "Users can view own receipts"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'receipts' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Delete policy
   CREATE POLICY "Users can delete own receipts"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'receipts' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   **For logos bucket:**
   - Click on the `logos` bucket
   - Go to "Policies" tab
   - Click "New Policy"
   - Use this custom policy:

   ```sql
   -- Select policy (public read)
   CREATE POLICY "Anyone can view logos"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'logos');

   -- Insert policy
   CREATE POLICY "Users can upload own logos"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'logos' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Delete policy
   CREATE POLICY "Users can delete own logos"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'logos' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

## Step 2: Local Environment Setup

### Create Your .env.local File

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your favorite text editor:
   ```bash
   # On macOS
   open .env.local

   # Or use any editor
   code .env.local  # VS Code
   nano .env.local  # Terminal editor
   ```

3. Paste in your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. Save and close the file

### Install Dependencies

Make sure you have Node.js 18+ installed, then run:

```bash
npm install
```

This will install all the required packages. It may take a few minutes.

## Step 3: Run the App

### Start the Development Server

```bash
npm start
```

You should see a QR code and some options:

```
› Press i │ open iOS simulator
› Press a │ open Android emulator
› Press w │ open web browser
```

### Test on Each Platform

**iOS (macOS only):**
- Press `i` to open iOS Simulator
- First time may take a while to build

**Android:**
- Make sure you have Android Studio installed
- Press `a` to open Android Emulator
- Or scan QR code with Expo Go app

**Web:**
- Press `w` to open in your browser
- Great for quick testing!

### Create Your First Account

1. Once the app loads, you'll see the login screen
2. Tap "Sign Up"
3. Enter your information:
   - Full Name
   - Email
   - Password (at least 6 characters)
4. Tap "Create Account"
5. Check your email for verification link (check spam folder!)
6. Click the verification link
7. Return to the app and sign in

## Step 4: Verify Everything Works

### Check Database

1. Go to Supabase dashboard
2. Click **Table Editor**
3. You should see tables: `profiles`, `business_settings`, `invoices`, etc.
4. Click on `profiles` - you should see your new user!
5. Click on `business_settings` - should have a row for your user

### Test Storage

Later, when you upload a logo or receipt:
1. Go to Supabase **Storage**
2. Click on `logos` or `receipts` bucket
3. You should see your uploaded files organized by user ID

## Troubleshooting

### "Network request failed" or "Invalid API key"

- Double-check your `.env.local` file has the correct Supabase credentials
- Make sure there are no extra spaces or quotes around the values
- Restart the Expo development server (press `r` in terminal)

### "Row Level Security policy violation"

- Make sure you ran the complete migration SQL
- Check that RLS policies are enabled in Supabase **Authentication** → **Policies**
- Verify your user is logged in (check auth store in app)

### "Could not connect to Supabase"

- Verify your Supabase project is active (not paused)
- Check your internet connection
- Confirm the Supabase URL is correct (should end with `.supabase.co`)

### App crashes on startup

- Clear cache: `npm start -- --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check that `global.css` is properly imported in `app/_layout.tsx`

### Storage policies not working

- Make sure you created the buckets first
- Run the storage policies in the SQL Editor, not in the Storage UI
- Verify bucket names are exactly `receipts` and `logos` (lowercase)

## Next Steps

Now that Siloq is running:

1. **Customize Business Settings**
   - Add your business name, logo, contact info
   - Set default invoice notes

2. **Add Some Clients**
   - Go to More → Clients
   - Add your first client

3. **Create an Invoice**
   - Go to Invoices tab
   - Tap the + button
   - Fill in invoice details
   - Add line items

4. **Track Expenses**
   - Go to Expenses tab
   - Add an expense
   - Upload a receipt photo

5. **Explore Features**
   - Try creating an estimate
   - Record a payment
   - Check out the dashboard (coming soon!)

## Need Help?

- Check the main [README.md](./README.md) for more technical details
- Review Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
- Expo Router docs: [https://docs.expo.dev/router/introduction/](https://docs.expo.dev/router/introduction/)

Happy invoicing! 🎉
