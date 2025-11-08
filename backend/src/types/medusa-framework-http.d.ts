// Shim to help TypeScript resolve subpath exports for '@medusajs/framework/http'
// TS will use this declaration during compile-time only; at runtime the import is erased (type-only).
declare module "@medusajs/framework/http" {
  // Re-export specific types to satisfy TS when subpath export types aren't picked up.
  import type { Response, Request } from "express";
  import type { MedusaContainer } from "@medusajs/framework/dist/container";
  export interface AuthContext {
    actor_id: string;
    actor_type: string;
    auth_identity_id: string;
    app_metadata: Record<string, unknown>;
  }
  export interface PublishableKeyContext {
    key: string;
    sales_channel_ids: string[];
  }
  export interface MedusaRequest<Body = unknown, QueryFields = Record<string, unknown>> extends Request<{[key: string]: string}, any, Body> {
    validatedBody: Body;
    validatedQuery: Record<string, unknown> & QueryFields;
    scope: MedusaContainer;
    auth_context?: { actor_id: string; actor_type: string; auth_identity_id: string; app_metadata: Record<string, unknown>; };
    publishable_key_context?: { key: string; sales_channel_ids: string[] };
  }
  export interface AuthenticatedMedusaRequest<Body = unknown, QueryFields = Record<string, unknown>> extends MedusaRequest<Body, QueryFields> {
    auth_context: AuthContext;
    publishable_key_context?: PublishableKeyContext;
  }
  export type MedusaResponse<Body = unknown> = Response<Body>;
}
