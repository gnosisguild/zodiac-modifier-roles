import { ReactNode } from "react"
import Flex from "../Flex"

type Props = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  label: ReactNode
}

const Checkbox: React.FC<Props> = ({ label, ...rest }) => (
  <label>
    <Flex gap={1}>
      <input {...rest} type="checkbox" />
      <div>{label}</div>
    </Flex>
  </label>
)

export default Checkbox
