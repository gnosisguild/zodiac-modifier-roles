import z from "zod"
import { Annotation, Permission } from "zodiac-roles-sdk"
import { OpenApiObject, zOpenApiObject, zPermission } from "./schema"
import { Preset } from "./types"

/** Process annotations and return all presets and remaining unannotated permissions */
export const processAnnotations = async (
  permissions: Permission[],
  annotations: Annotation[]
) => {
  console.log("processAnnotations", annotations)
  // const presets = await Promise.all(annotations.map(resolveAnnotation))

  // const filteredPresets = presets.filter(Boolean).map((preset) => {
  //   // TODO remove all preset.permissions that are not included in `permissions`
  //   return preset
  // })
  const filteredPresets: Preset[] = []

  // TODO remove all permissions that are already included in any preset
  const filteredPermissions = permissions

  return { presets: filteredPresets, permissions: filteredPermissions }
}

export const resolveAnnotation = async (
  annotation: Annotation
): Promise<Preset | null> => {
  try {
    const [permissions, schema] = await Promise.all([
      fetch(annotation.uri)
        .then((res) => res.json())
        .then(z.array(zPermission).parse),
      fetch(annotation.schema)
        .then((res) => res.json())
        .then(zOpenApiObject.parse),
    ])

    const { serverUrl, path } = resolveAnnotationPath(
      annotation.uri,
      schema,
      annotation.schema
    )

    const matchingEntry = Object.entries(schema.paths).find(
      ([pathPattern, operations]) =>
        matchPath(pathPattern, path) && operations.get
    )
    if (!matchingEntry) {
      throw new Error(
        `No matching path with get operation found for ${annotation.uri}`
      )
    }

    const pathPattern = matchingEntry[0]
    const operation = matchingEntry[1].get!

    return {
      permissions,
      apiInfo: schema.info,
      path,
      pathPattern,
      serverUrl,
      operation,
    }
  } catch (e) {
    console.error(
      `Error resolving annotation ${annotation.uri} with schema ${annotation.schema}`,
      e
    )
  }

  return null
}

/** Returns the annotation's path relative to the API server's base URL */
const resolveAnnotationPath = (
  annotationUrl: string,
  schema: OpenApiObject,
  schemaUrl: string
) => {
  // Server urls may be relative, to indicate that the host location is relative to the location where the OpenAPI document is being served.
  // We resolve them to absolute urls.
  const serverUrls =
    schema.servers.length === 0
      ? ["/"]
      : schema.servers.map((server) => server.url)
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

  return {
    serverUrl: matchingServerUrl,
    path: new URL(annotationUrl, matchingServerUrl).href.slice(
      matchingServerUrl.length
    ),
  }
}

/**
 * Matches a given path `/foo/bar/baz` against an OpenAPI path pattern `/foo/{placeholder}/baz`.
 * Returns an object of placeholder values if the path matches the pattern, `null` otherwise.
 **/
const matchPath = (pattern: string, path: string) => {
  // split and filter(Boolean) to ignore leading and trailing slashes
  const patternParts = pattern.split("/").filter(Boolean)
  const pathParts = path.split("/").filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]

    if (patternPart.startsWith("{") && patternPart.endsWith("}")) {
      const paramName = patternPart.slice(1, -1)
      params[paramName] = pathPart
    } else if (patternPart !== pathPart) {
      return null
    }
  }

  return params
}
