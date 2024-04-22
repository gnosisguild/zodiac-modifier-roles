import cn from "classnames"
import React from "react"

import classes from "./style.module.css"
import Link, { LinkProps } from "next/link"

const BlockLink: React.FC<
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
    LinkProps & {
      children?: React.ReactNode
    }
> = ({ className, children, ...rest }) => (
  <Link className={cn(classes.link, className)} {...rest}>
    {children}
  </Link>
)

export default BlockLink
