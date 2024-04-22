"use client"
import { ReactNode, useState } from "react"
import cn from "classnames"
import classes from "./style.module.css"
import Box, { Props as BoxProps } from "@/ui/Box"
import { SlArrowDown } from "react-icons/sl"

export interface Props extends BoxProps {
  labelCollapsed: ReactNode
  labelExpanded: ReactNode
  children: ReactNode
  toggleClassName?: string
  onToggle?: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  defaultExpanded?: boolean
}

const ExpandableBox: React.FC<Props> = ({
  labelCollapsed,
  labelExpanded,
  className,
  bg,
  children,
  toggleClassName,
  onToggle,
  defaultExpanded = false,
  ...rest
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  return (
    <Box {...rest} bg={bg} p={0} className={className}>
      <div
        onClick={(ev) => {
          setExpanded((val) => !val)
          if (onToggle) onToggle(ev)
        }}
        className={cn(
          classes.toggle,
          toggleClassName,
          expanded && classes.open
        )}
        role="button"
      >
        {expanded ? labelExpanded : labelCollapsed}
        <SlArrowDown size={16} className={classes.buttonIcon} />
      </div>

      {expanded && <div className={classes.body}>{children}</div>}
    </Box>
  )
}

export default ExpandableBox
