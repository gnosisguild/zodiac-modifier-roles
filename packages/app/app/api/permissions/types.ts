import { zAddress, zAnnotation, zTarget } from "@/components/permissions/schema"
import { z } from "zod"
import { Annotation, Target } from "zodiac-roles-sdk"

export const zPermissionsPost = z.object({
  targets: z.array(zTarget).optional(),
  annotations: z.array(zAnnotation).optional(),
  members: z.array(zAddress).optional(),
})

export interface PermissionsPost {
  targets?: Target[]
  annotations?: Annotation[]
  members?: `0x${string}`[]
}
