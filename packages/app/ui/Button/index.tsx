import cn from "classnames"
import React from "react"

import classes from "./style.module.css"
import Link from "next/link"

export const Button: React.FC<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > & { primary?: boolean }
> = ({ className, primary, ...rest }) => (
  <button
    className={cn(classes.button, primary && classes.primary, className)}
    {...rest}
  />
)

export default Button

export const LinkButton: React.FC<
  React.ComponentProps<typeof Link> & { primary?: boolean }
> = ({ className, primary, ...rest }) => (
  <Link
    className={cn(classes.button, primary && classes.primary, className)}
    {...rest}
  />
)
