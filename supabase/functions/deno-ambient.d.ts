// =============================================================
// Tipagens para ambiente Supabase Edge Functions / Deno no VS Code
// Evita avisos de TypeScript de URLs remotas e namespace Deno
// =============================================================

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  }
  export const env: Env;
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export type Handler = (
    request: Request,
    connInfo?: any
  ) => Response | Promise<Response>;
  export interface ServeOptions {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
    onError?: (error: unknown) => Response | Promise<Response>;
    onListen?: (params: { hostname: string; port: number }) => void;
  }
  export function serve(
    handler: Handler,
    options?: ServeOptions
  ): Promise<void>;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): any;
  export * from "@supabase/supabase-js";
}

declare module "https://*" {
  const content: any;
  export default content;
  export const serve: any;
  export const createClient: any;
}

