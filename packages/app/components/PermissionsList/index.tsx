import z from "zod"
import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import { Annotation, Target, reconstructPermissions } from "zodiac-roles-sdk"
import { Permission } from "./types"
import { zOpenApiObject, zPermission } from "./schema"

interface Props {
  targets: Target[]
  annotations: Annotation[]
  chainId: ChainId
}

const PermissionsList = async ({ targets, annotations, chainId }: Props) => {
  const resolvedAnnotations = await Promise.all(
    annotations.map(resolveAnnotation)
  )

  const permissions = reconstructPermissions(targets)
  const { annotatedPermissionGroups, unannotatedPermissions } =
    processAnnotations(permissions, resolvedAnnotations)

  return (
    <Flex direction="column" gap={1}>
      {annotatedPermissionGroups.map((group, i) => (
        <AnnotatedPermissionGroup
          key={group.url}
          schema={group.schema}
          values={group.values}
        />
      ))}

      {unannotatedPermissions.map((permission, i) => (
        <PermissionItem {...permission} key={i} />
      ))}
    </Flex>
  )
}

export default PermissionsList

const resolveAnnotation = async (annotation: Annotation) => {
  try {
    const [permissions, schema] = await Promise.all([
      fetch(annotation.url)
        .then((res) => res.json())
        .then(z.array(zPermission).parse)
        .catch((e) =>
          console.error(`Error resolving annotation ${annotation.url}`, e)
        ),
      fetch(annotation.schema)
        .then((res) => res.json())
        .then(zOpenApiObject.parse),
      ,
    ])
  } catch (e) {
    console.error(
      `Error resolving annotation ${annotation.url} with schema ${annotation.schema}`,
      e
    )
  }
}

const processAnnotations = (permissions: Permission[], annotations: any) => {
  return { annotatedPermissionGroups: [], unannotatedPermissions: permissions }
}
