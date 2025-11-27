/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_PAYPAL_CLIENT_ID?: string
  readonly VITE_PAYPAL_CLIENT_SECRET?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string

  readonly VITE_HUGGINGFACE_API_KEY?: string
  readonly VITE_TENSORFLOW_API_KEY?: string
  readonly VITE_OPENAI_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}