import cn from "classnames"
import React from "react"

import classes from "./style.module.css"
import Link from "next/link"

type Props = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  danger?: boolean
  small?: boolean
}

const IconButton: React.FC<Props> = ({ className, danger, small, ...rest }) => (
  <button
    className={cn(classes.button, className, {
      [classes.danger]: danger,
      [classes.small]: small,
    })}
    {...rest}
  />
)

export default IconButton

export const IconLinkButton: React.FC<
  React.ComponentProps<typeof Link> & {
    danger?: boolean
    small?: boolean
  }
> = ({ className, danger, small, ...rest }) => (
  <Link
    className={cn(classes.button, className, {
      [classes.danger]: danger,
      [classes.small]: small,
    })}
    {...rest}
  />
)
