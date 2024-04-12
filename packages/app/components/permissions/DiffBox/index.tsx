import { ReactNode } from "react"
import cn from "classnames"
import { DiffFlag } from "../types"
import Box from "@/ui/Box"
import classes from "./style.module.css"
import Flex from "@/ui/Flex"

const DiffBox: React.FC<{
  diff?: DiffFlag
  modified?: ReactNode
  bg?: boolean
  children: ReactNode
  stretch?: boolean
}> = ({ diff, modified, bg, children, stretch }) => (
  <Placeholder hidden={modified}>
    <Box
      borderless
      bg={bg}
      p={0}
      className={cn(
        classes.container,
        diff && classes.diff,
        diff && classes[DiffFlag[diff].toLowerCase()],
        diff && stretch && classes.stretch
      )}
    >
      {children}
    </Box>
  </Placeholder>
)

export default DiffBox

const Placeholder: React.FC<{ children: ReactNode; hidden?: ReactNode }> = ({
  children,
  hidden,
}) => {
  if (!hidden) {
    return children
  }

  return (
    <div className={classes.placeholderContainer}>
      <Flex gap={0} className={classes.placeholderFlex}>
        <div className={classes.placeholderVisible}>{children}</div>
        <div className={classes.placeholderHidden}>{hidden}</div>
      </Flex>
    </div>
  )
}
