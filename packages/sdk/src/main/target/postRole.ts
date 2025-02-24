import { Annotation, Target } from "zodiac-roles-deployments"

const ZODIAC_ROLES_APP = "https://roles.gnosisguild.org"

/**
 * Posts a role configuration to Zodiac Roles app for storage
 * @returns The hash under which permissions have been stored
 */
export const postRole = async ({
  targets,
  annotations,
  members,
}: {
  targets?: Target[]
  annotations?: Annotation[]
  members?: `0x${string}`[]
}) => {
  const res = await fetch(`${ZODIAC_ROLES_APP}/api/permissions`, {
    method: "POST",
    body: JSON.stringify({ targets, annotations, members }),
  })
  const json = (await res.json()) as any
  const { hash } = json
  if (!hash) {
    console.error(json)
    throw new Error("Failed to post permissions")
  }
  return hash
}
