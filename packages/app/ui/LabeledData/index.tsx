import cn from "classnames"
import classes from "./style.module.css"
import Flex from "../Flex"

interface LabeledDataProps {
  label: string
  children: React.ReactNode
  className?: string
}

const LabeledData: React.FC<LabeledDataProps> = ({
  label,
  children,
  className,
}) => {
  return (
    <Flex
      gap={1}
      direction="column"
      className={cn(classes.container, className)}
    >
      <label>{label}</label>
      <div>{children}</div>
    </Flex>
  )
}

export default LabeledData
