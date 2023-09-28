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

      <Flex gap={2} className={classes.apiInfo} alignItems="center">
        <code title={apiInfo.description}>{apiInfo.title}</code>
        {apiInfo.contact?.name && (
          <div className={classes.contact}>
            by{" "}
            {apiInfo.contact.url ? (
              <a href={apiInfo.contact.url} target="_blank">
                {apiInfo.contact.name}
              </a>
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
