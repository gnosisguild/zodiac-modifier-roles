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
  <div className={classNames(classes.field, { [classes.disabled]: disabled })}>
    {label !== undefined ? (
      <label
        htmlFor={labelFor}
        title={title}
        className={classes.labelContainer}
      >
        <div className={classes.fieldLabel}>{label}</div>
        <div className={classes.fieldBody}>{children}</div>
      </label>
    ) : (
      children
    )}
  </div>
)

export default Field
