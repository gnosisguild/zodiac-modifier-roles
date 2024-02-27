import cn from "classnames"
import React, { forwardRef } from "react"

import classes from "./style.module.css"

interface Props {
  direction?: "row" | "column"
  justifyContent?:
    | "space-around"
    | "space-between"
    | "center"
    | "end"
    | "start"
    | "right"
  alignItems?: "normal" | "stretch" | "center" | "end" | "start" | "baseline"
  gap: 0 | 1 | 2 | 3 | 4 | 5
  wrap?: boolean
  className?: string
  children?: React.ReactNode
  style?: React.CSSProperties
  title?: string
}

const Flex = forwardRef<HTMLDivElement | null, Props>(
  (
    {
      gap,
      direction = "row",
      justifyContent = "start",
      alignItems = "normal",
      wrap = false,
      children,
      className,
      style,
      title,
    },
    ref
  ) => (
    <div
      ref={ref}
      title={title}
      className={cn(
        classes.flex,
        classes[`gap${gap}`],
        classes[direction],
        wrap && classes.wrap,
        className
      )}
      style={{
        justifyContent,
        alignItems,
        ...style,
      }}
    >
      {children}
    </div>
  )
)
Flex.displayName = "Flex"

export default Flex
