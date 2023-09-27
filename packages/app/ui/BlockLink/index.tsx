import cn from "classnames"
import React from "react"

import classes from "./style.module.css"

const BlockLink: React.FC<
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >
> = ({ className, children, ...rest }) => (
  <a className={cn(classes.link, className)} {...rest}>
    {children}
  </a>
)

export default BlockLink
