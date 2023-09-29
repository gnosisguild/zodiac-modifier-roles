import { ReactNode } from "react"
import cn from "classnames"
import { DiffFlag } from "../types"
import Box from "@/ui/Box"
import classes from "./style.module.css"

const DiffBox: React.FC<{
  diff?: DiffFlag
  bg?: boolean
  children: ReactNode
}> = ({ diff, bg, children }) => (
  <Box
    bg={bg}
    p={3}
    className={diff && cn(classes.diff, classes[DiffFlag[diff].toLowerCase()])}
  >
    {children}
  </Box>
)

export default DiffBox
