import classNames from "classnames"
import React, { ReactNode } from "react"

import Box from "../Box"

import classes from "./style.module.css"

const Field: React.FC<{
  label?: string
  title?: string
  labelFor?: string
  children: ReactNode
  disabled?: boolean
}> = ({ label, title, labelFor, children, disabled = false }) => (
  <div className={classNames({ [classes.disabled]: disabled })}>
    {label ? (
      <label htmlFor={labelFor} title={title}>
        <div className={classes.fieldLabel}>{label}</div>
        {children}
      </label>
    ) : (
      children
    )}
  </div>
)

export default Field
