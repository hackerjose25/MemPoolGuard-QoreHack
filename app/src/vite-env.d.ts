/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QORE_REST_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
