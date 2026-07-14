import { afterEach, beforeEach, expect, it, suite, vi } from "vitest"
import type { OpenAPIV3 } from "openapi-types"

import { processAnnotations } from "./annotations"
import { PermissionCoerced, processPermissions } from "../main"

suite("processAnnotations()", () => {
  // These tests resolve annotations against the DeFi Kit API. We mock the
  // network so they stay deterministic and don't break when that API moves
  // (e.g. the kit.karpatkey.com -> kit.kpk.io redirect) or its data drifts.
  // The mock returns the OpenAPI schema for *openapi.json requests and the
  // cowswap-swap permission set for *permissions/* requests — matching what
  // the live endpoints return for the fixtures below.
  beforeEach(() => {
    vi.stubGlobal("fetch", mockDefiKitFetch)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns the original set of permissions if no annotations are given", async () => {
    const permissions: PermissionCoerced[] = [
      {
        targetAddress: "0xc0ffee254729296a45a3885639ac7e10f9d54979",
        selector: "0x1234abcd",
        condition: undefined,
        send: false,
        delegatecall: false,
      },
    ]
    const result = await processAnnotations(
      processPermissions(permissions).targets,
      []
    )
    expect(result.permissions).to.deep.equal(permissions)
  })

  it("returns presets (resolved annotated permissions)", async () => {
    const result = await processAnnotations(
      processPermissions(permissionsForPreset1).targets,
      [annotation1],
      annotationFetchOptions
    )

    expect(result.presets).to.have.lengthOf(1)
    expect(result.presets[0].permissions).to.deep.equal(permissionsForPreset1)
    expect(result.presets[0].query).to.deep.equal({
      buy: [
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      ],
      sell: [
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      ],
    })
  })

  it("returns the remaining, un-annotated permissions", async () => {
    const permissions = [
      {
        targetAddress: "0xc0ffee254729296a45a3885639AC7E10F9d54979",
        selector: "0x1234abcd",
      },
      ...permissionsForPreset1,
    ] as const
    const result = await processAnnotations(
      processPermissions(permissions).targets,
      [annotation1],
      annotationFetchOptions
    )
    expect(result.permissions).to.deep.equal([
      {
        targetAddress: "0xc0ffee254729296a45a3885639ac7e10f9d54979",
        selector: "0x1234abcd",
        send: false,
        delegatecall: false,
        condition: undefined,
      },
    ])
  })

  it("handles endpoints with indiscriminate parameter schemas", async () => {
    const result = await processAnnotations(
      processPermissions(permissionsForPreset1).targets,
      [
        {
          uri: "https://kit.karpatkey.com/api/v1/permissions/eth/cowswap/swap?sell=ETH&buy=0x6B175474E89094C44Da98b954EedeAC495271d0F",
          schema: "https://kit.karpatkey.com/api/v1/openapi.json",
        },
      ],
      {
        fetchPermissions: async () => permissionsForPreset1,
        fetchSchema: async () => indiscriminateParameterSchema,
      }
    )

    expect(result.presets).to.have.lengthOf(1)
  })
})

const annotation1 = {
  uri: "https://kit.karpatkey.com/api/v1/permissions/eth/cowswap/swap?buy=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&sell=0x6B175474E89094C44Da98b954EedeAC495271d0F%2C0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  schema: "https://kit.karpatkey.com/api/v1/openapi.json",
}

const annotationFetchOptions = {
  fetchPermissions: async () => permissionsForPreset1,
  fetchSchema: async () => annotationSchema,
}

const annotationSchema = buildAnnotationSchema({
  type: "array",
  items: { type: "string" },
})

const indiscriminateParameterSchema = buildAnnotationSchema({})

function buildAnnotationSchema(
  queryParameterSchema: OpenAPIV3.SchemaObject
): OpenAPIV3.Document {
  return {
    openapi: "3.0.0",
    info: { title: "Karpatkey Kit", version: "1.0.0" },
    servers: [{ url: "https://kit.karpatkey.com/api/v1" }],
    paths: {
      "/permissions/{chain}/{protocol}/{action}": {
        get: {
          parameters: [
            ...["chain", "protocol", "action"].map(
              (name): OpenAPIV3.ParameterObject => ({
                name,
                in: "path",
                required: true,
                schema: { type: "string" },
              })
            ),
            ...["buy", "sell"].map(
              (name): OpenAPIV3.ParameterObject => ({
                name,
                in: "query",
                required: true,
                style: "form",
                explode: false,
                schema: queryParameterSchema,
              })
            ),
          ],
          responses: { "200": { description: "Permission preset" } },
        },
      },
    },
  }
}

const permissionsForPreset1: PermissionCoerced[] = [
  {
    targetAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
    delegatecall: false,
    send: false,
    selector: "0x095ea7b3",
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
        },
        { paramType: 1, operator: 0 },
      ],
    },
  },
  {
    targetAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    selector: "0x095ea7b3",
    delegatecall: false,
    send: false,
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 1,
          operator: 16,
          compValue:
            "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
        },
        { paramType: 1, operator: 0 },
      ],
    },
  },
  {
    targetAddress: "0x23da9ade38e4477b23770ded512fd37b12381fab",
    selector: "0x569d3489",
    condition: {
      paramType: 5,
      operator: 5,
      children: [
        {
          paramType: 3,
          operator: 5,
          children: [
            {
              paramType: 0,
              operator: 2,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                },
              ],
            },
            {
              paramType: 0,
              operator: 2,
              children: [
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                },
                {
                  paramType: 1,
                  operator: 16,
                  compValue:
                    "0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                },
              ],
            },
            { paramType: 1, operator: 15 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
            { paramType: 1, operator: 0 },
          ],
        },
        { paramType: 1, operator: 0 },
        { paramType: 1, operator: 0 },
      ],
    },
    delegatecall: true,
    send: false,
  },
  {
    targetAddress: "0x23da9ade38e4477b23770ded512fd37b12381fab",
    selector: "0x5a66c223",
    delegatecall: true,
    send: false,
  },
]

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  })

/**
 * Stands in for `fetch` against the DeFi Kit API: returns canned fixtures
 * keyed on the request URL instead of hitting the network.
 */
const mockDefiKitFetch = async (
  input: string | URL | Request
): Promise<Response> => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url

  if (url.includes("openapi.json")) return json(openApiSchemaFixture)
  if (url.includes("/permissions/")) return json(permissionsForPreset1)

  throw new Error(`Unexpected fetch in test: ${url}`)
}

/**
 * Minimal DeFi Kit OpenAPI document covering just the cowswap `swap` endpoint
 * exercised by these tests. Trimmed from the live ~2 MB schema — enough for
 * openapi-backend to match the operation and parse the sell/buy query params.
 */
const openApiSchemaFixture = {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "DeFi Kit",
    description:
      "Permissions for Zodiac Roles covering interactions with DeFi protocols",
    contact: { name: "karpatkey", url: "https://kit.karpatkey.com" },
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/permissions/eth/cowswap/swap": {
      get: {
        summary: "Make swaps on cowswap",
        tags: ["cowswap permissions"],
        parameters: [
          {
            schema: {
              type: "array",
              items: {
                anyOf: [
                  { type: "string", pattern: "0x[a-fA-F0-9]{40}" },
                  { type: "string", enum: ["ETH"] },
                ],
              },
            },
            required: true,
            name: "sell",
            in: "query",
            explode: false,
          },
          {
            schema: {
              type: "array",
              items: {
                anyOf: [
                  { type: "string", pattern: "0x[a-fA-F0-9]{40}" },
                  { type: "string", enum: ["ETH"] },
                ],
              },
            },
            required: false,
            name: "buy",
            in: "query",
            explode: false,
          },
          {
            schema: { type: "integer", minimum: 0, maximum: 10000 },
            required: false,
            name: "feeAmountBp",
            in: "query",
            explode: false,
          },
          {
            schema: { type: "boolean" },
            required: false,
            name: "twap",
            in: "query",
            explode: false,
          },
          {
            schema: { type: "string", pattern: "0x[a-fA-F0-9]{40}" },
            required: false,
            name: "receiver",
            in: "query",
            explode: false,
          },
        ],
        responses: {
          "200": { description: "Permissions for making swaps on cowswap" },
        },
      },
    },
  },
}
