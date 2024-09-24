import OpenAPIBackend from "openapi-backend"
import { OpenAPIV3 } from "openapi-types"
import { Annotation, Target } from "zodiac-roles-deployments"

import {
  Permission,
  PermissionCoerced,
  processPermissions,
  reconstructPermissions,
} from "../permissions"
import { diffTargets, splitTargets } from "../targets"

type DeferencedOpenAPIParameter = Omit<OpenAPIV3.ParameterObject, "schema"> & {
  schema: OpenAPIV3.SchemaObject
}

export interface Preset {
  permissions: PermissionCoerced[]
  uri: string
  serverUrl: string
  apiInfo: OpenAPIV3.InfoObject
  path: string
  paramValues: Record<string, string | number | string[] | number[]>
  operation: {
    summary?: string
    description?: string
    tags?: string[]
    parameters: DeferencedOpenAPIParameter[]
  }
}

/** Process annotations and return all presets and remaining unannotated permissions */
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

  const { targets } = processPermissions(permissions)
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

  // Only consider those presets whose full set of permissions are actually enabled on the role. Determine this by:
  //  - combining current permissions with preset permissions,
  //  - deriving the targets,
  //  - and checking if these are equal to the current targets.
  const confirmedPresets = presets.filter((preset) => {
    if (!preset) return false

    let targetsWithPresetApplied: Target[] = []
    try {
      const { targets } = processPermissions([
        ...permissions,
        ...preset.permissions,
      ])
      targetsWithPresetApplied = targets
    } catch (e) {
      // processPermissions throws if permissions and preset.permissions have entries addressing the same target function with different send/delegatecall options
      return false
    }

    // If targetsWithPresetApplied is a subset of targets, it means they are equal sets.
    return diffTargets(targetsWithPresetApplied, targets).length === 0
  }) as Preset[]

  // Calculate remaining permissions that are not part of any preset
  const { targets: targetsViaPresets } = processPermissions(
    confirmedPresets.flatMap((preset) => preset.permissions)
  )

  const remainingTargets = splitTargets(targets, targetsViaPresets)
  const remainingPermissions = reconstructPermissions(remainingTargets)

  // Extra safety check: assert that the final set of targets remains unchanged
  const { targets: finalTargets } = processPermissions([
    ...confirmedPresets.flatMap((preset) => preset.permissions),
    ...remainingPermissions,
  ])

  const d1 = diffTargets(finalTargets, targets)
  const d2 = diffTargets(targets, finalTargets)
  if (d1.length !== 0 || d2.length !== 0) {
    throw new Error(
      "The processed results leads to a different set of targets."
    )
  }

  return { presets: confirmedPresets, permissions: remainingPermissions }
}

const resolveAnnotation = async (
  annotation: Annotation,
  {
    fetchPermissions,
    fetchSchema,
  }: {
    fetchPermissions: (url: string) => Promise<Permission[]>
    fetchSchema: (url: string) => Promise<OpenAPIBackend>
  }
): Promise<Preset | null> => {
  const [permissions, schema] = await Promise.all([
    fetchPermissions(annotation.uri).catch((e: Error) => {
      console.error(`Error resolving annotation ${annotation.uri}`, e)
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
    annotation.uri,
    schema,
    annotation.schema
  )
  const { operation, paramValues } = matchAction(schema, { path, query })

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
    uri: annotation.uri,
    serverUrl,
    apiInfo: schema.definition.info || { title: "", version: "" },
    path: operation.path,
    paramValues,
    operation: {
      summary: operation.summary,
      tags: operation.tags,
      parameters: operationParameters,
    },
  }
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

  if (!operation) {
    // parse request again, now with matched operation so that request.params will be populated
    request = schema.router.parseRequest(request, operation)
  }

  return {
    operation,
    paramValues: request.params,
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
  } catch (e) {}
  if (json.error) {
    throw new Error(json.error)
  }

  return new Error(`Request failed: ${res.statusText}`)
}
