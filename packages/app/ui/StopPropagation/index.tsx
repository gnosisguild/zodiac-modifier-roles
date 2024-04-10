"use client"
import React from "react"

type Props = Omit<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  "onClick"
>

const StopPropagation: React.FC<Props> = (props) => (
  <div {...props} onClick={(ev) => ev.stopPropagation()} />
)

export default StopPropagation
