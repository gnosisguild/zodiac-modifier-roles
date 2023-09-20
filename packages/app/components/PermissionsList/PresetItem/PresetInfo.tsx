import Flex from "@/ui/Flex"
import { Preset } from "../types"
import classes from "./style.module.css"

const PresetInfo: React.FC<{
  apiInfo: Preset["apiInfo"]
  operation: Preset["operation"]
}> = ({ apiInfo, operation }) => {
  return (
    <Flex gap={2} justifyContent="center">
      <p className={classes.operation}>
        {operation.summary || operation.description}
      </p>

      <Flex gap={1} className={classes.apiInfo}>
        <div title={apiInfo.description}>{apiInfo.title}</div>
        {apiInfo.contact?.name && (
          <div>
            by{" "}
            {apiInfo.contact.url ? (
              <a href={apiInfo.contact.url}>{apiInfo.contact.name}</a>
            ) : (
              apiInfo.contact.name
            )}
          </div>
        )}
      </Flex>
    </Flex>
  )
}

export default PresetInfo
