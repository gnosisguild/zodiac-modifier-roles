import cn from "classnames"
import React, { ReactNode } from "react"

import Box from "../Box"
import classes from "./style.module.css"
import Flex from "../Flex"

export interface Props {
  className?: string
  title?: string
  children?: ReactNode
}

const Alert = ({ children, className, title = "Error" }: Props) => (
  <div role="alert">
    <Box className={cn(classes.errorMessage, className)} p={3}>
      <Flex gap={3}>
        <div className={classes.icon}>❌</div>
        <div className={classes.content}>
          <h4 className={classes.title}>{title}</h4>
          <p>{children}</p>
        </div>
      </Flex>
    </Box>
  </div>
)

export default Alert
