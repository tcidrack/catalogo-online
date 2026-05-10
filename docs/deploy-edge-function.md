# Instructions to Deploy Edge Function

## 1. Install Supabase CLI (if not installed)
```bash
npm i -g supabase
```

## 2. Login to Supabase
```bash
supabase login
```

## 3. Link Your Project
```bash
cd C:\Users\thalison.silva\Downloads\catalogo-online
supabase link --project-ref lzupgzwweucpjwbmnzon
```

## 4. Deploy the Edge Function
```bash
supabase functions deploy create-store
```

## 5. Verify Deployment
After deployment, test the function:
```bash
curl -X POST 'https://lzupgzwweucpjwbmnzon.supabase.co/functions/v1/create-store' \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"storeName": "Test Store", "storePassword": "test123"}'
```

## Important Notes:

1. **NEVER** put service role key in `.env` for frontend
2. Service role key is only used inside Edge Function (secure)
3. The Edge Function uses Deno runtime (TypeScript)
4. Make sure to link your project before deploying

## Troubleshooting:

- If you get CORS errors, check if `corsHeaders` is properly set
- If you get "User not allowed", verify the JWT is valid
- Check Edge Function logs in Supabase Dashboard > Functions > create-store > Logs
