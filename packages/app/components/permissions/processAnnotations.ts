import { Annotation, Permission } from "zodiac-roles-sdk"
import { processAnnotations as processAnnotationsBase } from "./annotations"
import { z } from "zod"
import { zPermission } from "./schema"

export const processAnnotations = async (
  permissions: readonly Permission[],
  annotations: readonly Annotation[]
) => {
  return await processAnnotationsBase(permissions, annotations, {
    fetchPermissions,
    fetchSchema,
  })
}

const fetchPermissions = async (uri: string) => {
  const res = await fetch(uri, { next: { revalidate: 3600 } })
  const json = await validateJsonResponse(res)
  return z.array(zPermission).parse(json)
}

const fetchSchema = async (schemaUrl: string) => {
  const res = await fetch(schemaUrl, { next: { revalidate: 3600 } })
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
