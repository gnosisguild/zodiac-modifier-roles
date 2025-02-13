import OpenAPIBackend from "openapi-backend"
import { OpenAPIV3 } from "openapi-types"
import { Annotation } from "zodiac-roles-deployments"
// We import via alias to avoid double bundling of sdk functions
import {
  Permission,
  PermissionCoerced,
  coercePermission,
  filterPresets,
  // eslint does not know about our Typescript path alias
  // eslint-disable-next-line import/no-unresolved
} from "zodiac-roles-sdk"

type DeferencedOpenAPIParameter = Omit<OpenAPIV3.ParameterObject, "schema"> & {
  schema: OpenAPIV3.SchemaObject
}

export interface Preset {
  permissions: PermissionCoerced[]
  uri: string
  serverUrl: string
  apiInfo: OpenAPIV3.InfoObject
  path: string
  params: Record<string, string | number>
  query: Record<string, string | number | string[] | number[]>
  operation: {
    summary?: string
    description?: string
    tags?: string[]
    parameters: DeferencedOpenAPIParameter[]
  }
}

/**
 * Processes annotations by resolving and validating them against a given list of permissions.
 * The idea is that we only show annotations that correspond to what's currently on chain
 *
 * The following sequence of actions is performed
 * 1- Resolves annotations to build permission presets based on the associated URIs and schemas.
 * 2- Confirms presets by ensuring they are valid subsets of the provided permissions.
 * 3- Returns remaining unannotated permissions (those not included in any preset).
 *
 * @param {readonly Permission[]} permissions - A list of all available permissions.
 * @param {readonly Annotation[]} annotations - A list of annotations to resolve and validate.
 * @param {Object} [options] - Optional functions for fetching resources.
 * @param {Function} [options.fetchPermissions] - A function to fetch permissions from a URL. Defaults to `defaultJsonFetch`.
 * @param {Function} [options.fetchSchema] - A function to fetch a schema from a URL. Defaults to `defaultJsonFetch`.
 *
 * @returns {Promise<{ presets: Preset[], permissions: Permission[] }>}
 *   A promise that resolves to an object containing:
 *   - `presets`: An array of confirmed presets (corresponding to confirmed annotations).
 *   - `permissions`: The remaining unannotated permissions.
 */
export const processAnnotations = async (
  permissions: readonly Permission[],
  annotations: readonly Annotation[],
  options: {
    fetchPermissions?: (url: string) => Promise<Permission[]>
    fetchSchema?: (url: string) => Promise<OpenAPIV3.Document>
  } = {}
) => {
  const {
    fetchPermissions = defaultJsonFetch as (
      url: string
    ) => Promise<Permission[]>,
    fetchSchema = defaultJsonFetch as (
      url: string
    ) => Promise<OpenAPIV3.Document>,
  } = options

  const cache = new Map<string, Promise<OpenAPIBackend>>()
  const cachedFetchSchema = (url: string) => {
    const fetchSchemaAndInitApi = async () => {
      const schema = await fetchSchema(url)
      const api = new OpenAPIBackend({
        definition: schema,
        quick: true, // makes $ref resolution synchronous
      })
      await api.init()
      return api
    }

    if (!cache.has(url)) {
      cache.set(url, fetchSchemaAndInitApi())
    }

    return cache.get(url)!
  }

  const presets = await Promise.all(
    annotations.map(async (annotation) => {
      try {
        return await resolveAnnotation(annotation, {
          fetchPermissions,
          fetchSchema: cachedFetchSchema,
        })
      } catch (e) {
        console.error("Error resolving annotation", e)
        return null
      }
    })
  )

  return filterPresets({
    presets,
    permissions: permissions.map(coercePermission),
  })
}

export const resolveAnnotation = async (
  annotation: Annotation,
  {
    fetchPermissions,
    fetchSchema,
  }: {
    fetchPermissions: (url: string) => Promise<Permission[]>
    fetchSchema: (url: string) => Promise<OpenAPIBackend>
  }
): Promise<Preset | null> => {
  const normalizedUri = normalizeUri(annotation.uri)

  const [permissions, schema] = await Promise.all([
    fetchPermissions(normalizedUri).catch((e: Error) => {
      console.error(`Error resolving annotation ${normalizedUri}`, e)
      throw new Error(`Error resolving annotation: ${e}`)
    }),
    fetchSchema(annotation.schema).catch((e) => {
      console.error(`Error resolving annotation schema ${annotation.schema}`, e)
      throw new Error(`Error resolving annotation schema: ${e}`)
    }),
  ] as const)

  if (!permissions) {
    throw new Error("invalid fetchPermissions result")
  }
  if (permissions.length === 0) {
    throw new Error(`Annotation resolves to empty permission set`)
  }

  const { serverUrl, path, query } = parseUri(
    normalizedUri,
    schema,
    annotation.schema
  )
  const {
    operation,
    params,
    query: parsedQuery,
  } = matchAction(schema, { path, query })

  if (!operation) {
    console.error("No operation found for annotation", annotation)
    return null
  }

  // The schema is already fully dereferenced, but the types don't reflect that
  // Thus the manual type cast.
  const operationParameters =
    operation.parameters as DeferencedOpenAPIParameter[]

  return {
    permissions,
    uri: normalizedUri,
    serverUrl,
    apiInfo: schema.definition.info || { title: "", version: "" },
    path: operation.path,
    params: params,
    query: parsedQuery,
    operation: {
      summary: operation.summary,
      tags: operation.tags,
      parameters: operationParameters,
    },
  }
}

/** Normalize a URI to a canonical form in which query params are sorted alphabetically */
const normalizeUri = (uri: string) => {
  let url: URL
  try {
    url = new URL(uri) // Parse the URI into its components
  } catch (error) {
    throw new Error(`Invalid URI: ${uri}`) // Handle invalid URI errors
  }

  const searchParams = new URLSearchParams(url.search)
  // Sort the key/value pairs in place
  searchParams.sort()

  // Reconstruct the URI with normalized query parameters
  return `${url.origin}${url.pathname}?${searchParams}`
}

/** Returns the annotation's path relative to the API server's base URL */
const parseUri = (
  annotationUrl: string,
  schema: OpenAPIBackend,
  schemaUrl: string
) => {
  // Server urls may be relative, to indicate that the host location is relative to the location where the OpenAPI document is being served.
  // We resolve them to absolute urls.
  const serverUrls =
    !schema.document.servers || schema.document.servers.length === 0
      ? ["/"]
      : schema.document.servers.map((server) => server.url)
  const absoluteServerUrls = serverUrls.map(
    (serverUrl) => new URL(serverUrl, schemaUrl).href
  )

  const matchingServerUrl = absoluteServerUrls.find((serverUrl) =>
    new URL(annotationUrl, serverUrl).href.startsWith(serverUrl)
  )

  if (!matchingServerUrl) {
    throw new Error(
      `Annotation url ${annotationUrl} is not within any server url declared in the schema ${schemaUrl}`
    )
  }

  // extract the pathname after the server base path and the query string
  const pathAndQuery = new URL(annotationUrl, matchingServerUrl).href.slice(
    matchingServerUrl.length
  )
  const { pathname, search } = new URL(pathAndQuery, "http://0/")

  return {
    serverUrl: matchingServerUrl,
    path: pathname,
    query: search,
  }
}

/** Matches a request against the operations in the OpenAPI schema  */
const matchAction = (
  schema: OpenAPIBackend,
  { path, query }: { path: string; query: string }
) => {
  let request = schema.router.parseRequest({
    method: "GET",
    path,
    query,
    headers: {},
  })
  // find matching operation from schema
  const operation = schema.router.matchOperation(request)

  if (operation) {
    // parse request again, now with matched operation so that request.query and request.params will correctly parsed
    request = schema.router.parseRequest(request, operation)
  }

  return {
    operation,
    params: request.params,
    query: request.query,
  }
}

const defaultJsonFetch = async (url: string) => {
  const res = await fetch(url)
  return await validateJsonResponse(res)
}

async function validateJsonResponse(res: Response) {
  if (res.ok) {
    return await res.json()
  }

  // try to parse the response as json to get the error message
  let json = null
  try {
    json = await res.json()
  } catch (e) {
    throw new Error("Could not parse as json")
  }
  if (json.error) {
    throw new Error(json.error)
  }

  throw new Error(`Request failed: ${res.statusText}`)
}
