import cn from "classnames"
import React, { forwardRef, ReactNode } from "react"

import classes from "./style.module.css"

export interface Props {
  className?: string
  double?: boolean
  borderless?: boolean
  bg?: boolean
  rounded?: boolean
  roundedLeft?: boolean
  roundedRight?: boolean
  p?: 0 | 1 | 2 | 3
  children?: ReactNode
  title?: string
}

const Box = forwardRef<HTMLDivElement, Props>(
  (
    {
      children,
      className,
      double,
      borderless,
      bg,
      rounded,
      roundedLeft,
      roundedRight,
      p = 1,
      title,
    },
    ref
  ) => (
    <div
      ref={ref}
      title={title}
      className={cn(
        classes.box,
        classes[`p${p}`],
        {
          [classes.double]: double,
          [classes.borderless]: borderless,
          [classes.rounded]: rounded,
          [classes.bg]: bg,
          [classes.roundedLeft]: roundedLeft,
          [classes.roundedRight]: roundedRight,
        },
        className
      )}
    >
      {children}
    </div>
  )
)
Box.displayName = "Box"

export default Box
