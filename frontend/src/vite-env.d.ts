/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_LINERA_GRAPHQL_URL: string
    readonly VITE_LINERA_NODE_URL: string
    readonly VITE_LINERA_ZS_URL: string
    readonly VITE_TYPE_ARENA_APP_ID: string
    readonly VITE_CHAIN_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
