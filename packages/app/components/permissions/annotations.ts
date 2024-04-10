import z from "zod"
import {
  Annotation,
  Permission,
  processPermissions,
  diffTargets,
  splitTargets,
  reconstructPermissions,
  Target,
} from "zodiac-roles-sdk"
import { Enforcer } from "openapi-enforcer"
import { OpenAPIV3 } from "openapi-types"
import { zPermission } from "./schema"
import { Preset } from "./types"

/** Process annotations and return all presets and remaining unannotated permissions */
export const processAnnotations = async (
  permissions: readonly Permission[],
  annotations: readonly Annotation[]
) => {
  const { targets } = processPermissions(permissions)
  const presets = await Promise.all(annotations.map(resolveAnnotation))

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
  annotation: Annotation
): Promise<Preset | null> => {
  const [permissions, schema] = await Promise.all([
    fetch(annotation.uri, { next: { revalidate: 3600 } })
      .then((res) => res.json())
      .then(z.array(zPermission).parse)
      .catch((e: Error) => {
        console.error(`Error resolving annotation ${annotation.uri}`, e)
        return []
      }),
    fetch(annotation.schema, { next: { revalidate: 3600 } })
      .then((res) => res.json())
      .then((json) =>
        Enforcer(json, {
          componentOptions: {
            exceptionSkipCodes: ["EDEV001"], // ignore error: "Property not allowed: webhooks"
          },
        })
      )
      .catch((e) => {
        console.error(
          `Error resolving annotation schema ${annotation.schema}`,
          e
        )
        return null
      }),
  ])

  if (permissions.length === 0 || !schema) return null

  const { serverUrl, path } = resolveAnnotationPath(
    annotation.uri,
    schema,
    annotation.schema
  )

  const { value, error, warning } = schema.request({
    method: "GET",
    path,
  })

  if (error) {
    console.error(error)
  }
  if (warning) {
    console.warn(warning)
  }

  if (!value) {
    return null
  }

  return {
    permissions,
    uri: annotation.uri,
    serverUrl,
    apiInfo: schema.info?.toObject() || { title: "", version: "" },
    pathKey: value.pathKey,
    pathParams: value.path,
    queryParams: value.query,
    operation: {
      summary: value.operation?.summary,
      tags: value.operation?.tags,
      parameters:
        value.operation?.parameters?.map((param: any) => param.toObject()) ||
        [],
    },
  }

  return null
}

/** Returns the annotation's path relative to the API server's base URL */
const resolveAnnotationPath = (
  annotationUrl: string,
  schema: OpenAPIV3.Document,
  schemaUrl: string
) => {
  // Server urls may be relative, to indicate that the host location is relative to the location where the OpenAPI document is being served.
  // We resolve them to absolute urls.
  const serverUrls =
    !schema.servers || schema.servers.length === 0
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

  const pathAndQuery = new URL(annotationUrl, matchingServerUrl).href.slice(
    matchingServerUrl.length
  )

  return {
    serverUrl: matchingServerUrl,
    path: pathAndQuery,
  }
}
