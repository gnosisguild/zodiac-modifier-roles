import cn from "classnames";
import React from "react";

import classes from "./style.module.css";
import Link from "next/link";

export const Button: React.FC<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
> = ({ className, ...rest }) => (
  <button className={cn(classes.button, className)} {...rest} />
);

export default Button;

export const LinkButton: React.FC<React.ComponentProps<typeof Link>> = ({
  className,
  ...rest
}) => <Link className={cn(classes.button, className)} {...rest} />;
