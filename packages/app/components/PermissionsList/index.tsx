import Address from "@/ui/Address"
import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import { Annotation, Target } from "zodiac-roles-sdk"

const fetchAnnotation = async (annotation: Annotation) => {}

const PermissionsList: React.FC<{
  targets: Target[]
  annotations: Annotation[]
  chainId: ChainId
}> = ({ targets, annotations, chainId }) => {
  const permissions = reconstructPermissions(targets)
  return (
    <Flex direction="column" gap={1}>
      {permissions.map((permission) => (
        <RawPermission {...permission} />
      ))}
    </Flex>
  )
}

export default PermissionsList
