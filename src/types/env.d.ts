declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY?: string
    ANTHROPIC_API_KEY?: string
    NEXT_PUBLIC_APP_URL?: string
    DEV_USER_ID?: string
  }
}
