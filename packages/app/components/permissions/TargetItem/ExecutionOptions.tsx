import Checkbox from "@/ui/Switch"
import Flex from "@/ui/Flex"

const ExecutionOptions: React.FC<{
  delegatecall?: boolean
  send?: boolean
}> = ({ delegatecall, send }) => (
  <Flex gap={3}>
    <Checkbox label="Send value" checked={!!send} disabled />
    <Checkbox label="Delegate call" checked={!!delegatecall} disabled />
  </Flex>
)

export default ExecutionOptions
