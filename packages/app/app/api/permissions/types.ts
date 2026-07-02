import { zAddress, zAnnotation, zTarget } from "@/components/permissions/schema"
import { z } from "zod"
import { Annotation, Target } from "zodiac-roles-sdk"

export const zPermissionsPost = z.object({
  targets: z.array(zTarget).optional(),
  annotations: z.array(zAnnotation).optional(),
  members: z.array(zAddress).optional(),
})

/**
 * The shape actually persisted in KV: the posted permissions plus a
 * server-assigned `createdAt` (Unix ms). Older entries predate the timestamp,
 * so `createdAt` is optional.
 */
export const zStoredPermissionsPost = zPermissionsPost.extend({
  createdAt: z.number().optional(),
})

export interface PermissionsPost {
  targets?: Target[]
  annotations?: Annotation[]
  members?: `0x${string}`[]
}
