import { Condition } from "zodiac-roles-sdk"
import { arrayify, hexlify } from "ethers/lib/utils"
import Box from "@/ui/Box"
import classes from "./style.module.css"
import ConditionHeader from "./ConditionHeader"
import Flex from "@/ui/Flex"
import Field from "@/ui/Field"
import { AbiFunction, AbiParameter } from "viem"

export interface Props {
  condition: Condition
  paramIndex?: number
  abi?: AbiFunction | AbiParameter
}

const ZERO =
  "0x0000000000000000000000000000000000000000000000000000000000000000"

const BitmaskConditionView: React.FC<Props> = ({
  condition,
  paramIndex,
  abi,
}) => {
  // compValue is packed as follows:
  // <2 bytes shift offset><15 bytes bitmask><15 bytes expected value>
  const bytes = arrayify(condition.compValue || ZERO)
  const shift = hexlify(bytes.slice(0, 2))
  const mask = hexlify(bytes.slice(2, 17))
  const value = hexlify(bytes.slice(17, 32))
  return (
    <Box p={2} borderless>
      <ConditionHeader
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
      />
      <Flex direction="column" gap={2} className={classes.conditionBody}>
        <Field label="shift">
          <input type="text" readOnly value={shift} />
        </Field>

        <Field label="mask">
          <input type="text" readOnly value={mask} />
        </Field>

        <Field label="expected value">
          <input type="text" readOnly value={value} />
        </Field>
      </Flex>
    </Box>
  )
}

export default BitmaskConditionView
