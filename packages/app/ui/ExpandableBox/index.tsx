"use client"
import { ReactNode, useState } from "react"
import cn from "classnames"
import classes from "./style.module.css"
import Box, { Props as BoxProps } from "@/ui/Box"

const ExpandableBox: React.FC<
  BoxProps & {
    labelCollapsed: ReactNode
    labelExpanded: ReactNode
    children: ReactNode
    toggleClassName?: string
    onToggle?: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  }
> = ({
  labelCollapsed,
  labelExpanded,
  className,
  bg,
  children,
  toggleClassName,
  onToggle,
  ...rest
}) => {
  const [expanded, setExpanded] = useState(false)
  const [hover, setHover] = useState(false)
  return (
    <Box
      {...rest}
      bg={bg}
      className={cn(className, hover && (bg ? classes.doubleBg : classes.bg))}
    >
      <div
        onClick={(ev) => {
          setExpanded((val) => !val)
          if (onToggle) onToggle(ev)
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn(classes.toggle, toggleClassName)}
        role="button"
      >
        {expanded ? labelExpanded : labelCollapsed}
      </div>

      {expanded && <div className={classes.body}>{children}</div>}
    </Box>
  )
}

export default ExpandableBox
