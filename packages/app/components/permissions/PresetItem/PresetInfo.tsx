import { Preset } from "zodiac-roles-sdk/annotations"
import Flex from "@/ui/Flex"
import classes from "./style.module.css"
import Anchor from "@/ui/Anchor"

const PresetInfo: React.FC<{
  uri: string
  apiInfo: Preset["apiInfo"]
  operation: Preset["operation"]
}> = ({ uri, apiInfo, operation }) => {
  return (
    <Flex gap={2} justifyContent="space-between">
      <Flex gap={2} alignItems="center">
        <Anchor name={uri} className={classes.anchor} />
        <p className={classes.operation}>
          {operation.summary || operation.description}
        </p>
      </Flex>

      <Flex gap={2} className={classes.apiInfo} alignItems="baseline">
        <div className={classes.title} title={apiInfo.description}>
          {apiInfo.title}
        </div>
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
