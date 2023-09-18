"use client"
import copy from "copy-to-clipboard"
import { RiFileCopyLine } from "react-icons/ri"
import IconButton from "../IconButton"

const CopyButton: React.FC<{ value: string }> = ({ value }) => (
  <IconButton
    title="Copy to clipboard"
    onClick={(ev) => {
      copy(value)
      ev.stopPropagation()
      ev.preventDefault()
    }}
  >
    <RiFileCopyLine />
  </IconButton>
)

export default CopyButton
