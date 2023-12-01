"use client"
import copy from "copy-to-clipboard"
import { RiFileCopyLine } from "react-icons/ri"
import IconButton from "../IconButton"

const CopyButton: React.FC<{ value: string; small?: boolean }> = ({
  value,
  small,
}) => (
  <IconButton
    title="Copy to clipboard"
    small={small}
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
