"use client"
import { ReactNode, useState } from "react"
import classes from "./style.module.css"
import Box, { Props as BoxProps } from "@/ui/Box"

const IndividualPermissions: React.FC<
  BoxProps & {
    labelCollapsed: ReactNode
    labelExpanded: ReactNode
    children: ReactNode
  }
> = ({ labelCollapsed, labelExpanded, children, ...rest }) => {
  const [expanded, setExpanded] = useState(false)
  const [hover, setHover] = useState(false)
  return (
    <Box {...rest} bg={hover} className={classes.box}>
      <div
        onClick={() => setExpanded((val) => !val)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={classes.toggle}
      >
        {expanded ? labelExpanded : labelCollapsed}
      </div>

      {expanded && <div className={classes.body}>{children}</div>}
    </Box>
  )
}

export default IndividualPermissions
