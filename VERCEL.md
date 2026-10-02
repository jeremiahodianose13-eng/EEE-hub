# Deploying EEE Hub to Vercel

1. In Supabase, run `supabase/schema.sql` in the SQL Editor. This creates the tables and public `materials` storage bucket used by the existing backend.
2. Import `jeremiahodianose13-eng/EEE-hub` in Vercel. Leave the project root as `.` and use the Node.js runtime configuration from `vercel.json`.
3. Add these environment variables to the Vercel project for Production and Preview:
   - `USE_SUPABASE=true`
   - `SUPABASE_URL` from Supabase Project Settings > API
   - `SUPABASE_SECRET_KEY` from Supabase Project Settings > API Keys. Use a server-side secret/service-role key only; never expose it in frontend code.
4. Deploy, then open the site and set the admin password through its setup flow.

Vercel's function request body limit is 4.5 MB. Since the current uploader sends files as base64 in an API request, large PDF uploads can exceed this limit; use smaller files or move uploads to direct Supabase Storage uploads if larger files are needed.

The `server.js` backend and its API routes remain the same. Vercel invokes the app through `api/index.js`; persistent records and uploads use Supabase instead of Vercel's temporary filesystem.