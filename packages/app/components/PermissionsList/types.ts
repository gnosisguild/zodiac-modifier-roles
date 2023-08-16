import type { reconstructPermissions } from "zodiac-roles-sdk"

export type Permission = ReturnType<typeof reconstructPermissions>[number]
