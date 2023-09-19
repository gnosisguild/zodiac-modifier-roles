import Box from "@/ui/Box"
import { Preset } from "../types"
import IndividualPermissions from "./IndividualPermissions"

const PresetItem: React.FC<Preset> = ({
  permissions,
  operation,
  apiInfo,
  path,
  query,
  pathPattern,
  serverUrl,
}) => {
  return (
    <Box p={2}>
      <IndividualPermissions permissions={permissions} />
    </Box>
  )
}

export default PresetItem
