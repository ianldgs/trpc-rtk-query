import { type ApiEndpointQuery } from "@reduxjs/toolkit/query";
import {
  type Api,
  type BaseQueryFn,
  type EndpointDefinitions,
  createApi,
} from "@reduxjs/toolkit/query/react";
import { type AnyRouter } from "@trpc/server";

import { type CreateEndpointDefinitions } from "./create-endpoint-definitions";
import { type AnyApi, type SupportedModule } from "./rtk-types";
import { type TRPCClientOptions } from "./trpc-client-options";
import { type DisabledEndpointOptions, wrapApiToProxy } from "./wrap-api-to-proxy";

/**
 * Generic type for api that has injectEndpoint method for run time injection and
 * endpoints for reading previously generated definitions.
 * @internal
 **/
type InjectableWithEndpoints = Pick<AnyApi, "endpoints" | "injectEndpoints">;

/*
 * Enhances existing api with endpoints and react hooks generated from trpc types.
 */
export const enhanceApi = <
  TRouter extends AnyRouter,
  ExistingApi extends InjectableWithEndpoints,
  // == "Save" the types needed to build up proper new api type to type variables ==
  // 1. Current baseQuery from existing api
  BaseQuery extends
    BaseQueryFn = ExistingApi["endpoints"][keyof ExistingApi["endpoints"]]["Types"]["BaseQuery"],
  // 2. Endpoints record values mapped to their inner definitions
  Endpoints = {
    [Endpoint in keyof ExistingApi["endpoints"]]: ExistingApi["endpoints"][Endpoint] extends ApiEndpointQuery<
      infer EndpointDefinition,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >
      ? EndpointDefinition
      : never;
  },
  // 3. Reducer path
  ReducerPath extends
    string = ExistingApi["endpoints"][keyof ExistingApi["endpoints"]]["Types"]["ReducerPath"],
  // 4. Tag types
  TagTypes extends
    string = ExistingApi["endpoints"][keyof ExistingApi["endpoints"]]["Types"]["TagTypes"],
  // New definitions
  NewDefinitions extends EndpointDefinitions = CreateEndpointDefinitions<
    TRouter,
    BaseQuery,
    ReducerPath,
    TagTypes
  >,
>(
  options: TRPCClientOptions<TRouter> & {
    api: ExistingApi;
  } & {
    endpointOptions?: {
      [K in keyof NewDefinitions]?: Omit<NewDefinitions[K], DisabledEndpointOptions>;
    };
  },
) =>
  wrapApiToProxy({
    api: options.api as Api<
      BaseQuery,
      Endpoints & CreateEndpointDefinitions<TRouter, BaseQuery, ReducerPath, TagTypes>,
      ReducerPath,
      TagTypes,
      SupportedModule
    >,
    endpointOptions: options.endpointOptions,
    tRPCClientOptions: options,
  });

/*
 * Helper to create base api with no endpoints
 */
export const createEmptyApi = () =>
  createApi({
    baseQuery: () => ({ data: undefined }),
    endpoints: () => ({}),
  });
