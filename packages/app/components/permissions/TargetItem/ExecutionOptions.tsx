import Checkbox from "@/ui/Checkbox"
import Flex from "@/ui/Flex"

const ExecutionOptions: React.FC<{
  delegatecall?: boolean
  send?: boolean
}> = ({ delegatecall, send }) => (
  <Flex gap={4}>
    <Checkbox
      label="send value (Ether or native token)"
      disabled
      checked={send}
    />
    <Checkbox label="delegate call" disabled checked={delegatecall} />
  </Flex>
)

export default ExecutionOptions
