import z from "zod"
import { Annotation, Permission, permissionId } from "zodiac-roles-sdk"
import { Enforcer } from "openapi-enforcer"
import { zPermission } from "./schema"
import { Preset } from "./types"
import { OpenAPIV3 } from "openapi-types"

/** Process annotations and return all presets and remaining unannotated permissions */
export const processAnnotations = async (
  permissions: readonly Permission[],
  annotations: readonly Annotation[]
) => {
  const permissionIds = permissions.map(permissionId)

  const presets = await Promise.all(annotations.map(resolveAnnotation))

  // only consider those presets whose full set of permissions are actually enabled on the role
  const confirmedPresets = presets.filter((preset) =>
    preset?.permissions.every((permission) =>
      permissionIds.includes(permissionId(permission))
    )
  ) as Preset[]

  // calculate remaining permissions that are not part of any preset
  const permissionIdsInPresets = confirmedPresets.flatMap((preset) =>
    preset.permissions.map(permissionId)
  )
  const remainingPermissions = permissions.filter(
    (permission) => !permissionIdsInPresets.includes(permissionId(permission))
  )

  return { presets: confirmedPresets, permissions: remainingPermissions }
}

const resolveAnnotation = async (
  annotation: Annotation
): Promise<Preset | null> => {
  const [permissions, schema] = await Promise.all([
    fetch(annotation.uri)
      .then((res) => res.json())
      .then(z.array(zPermission).parse)
      .catch((e: Error) => {
        console.error(`Error resolving annotation ${annotation.uri}`, e)
        return []
      }),
    fetch(annotation.schema)
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
