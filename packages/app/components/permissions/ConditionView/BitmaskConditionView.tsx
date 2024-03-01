import { Condition } from "zodiac-roles-sdk"
import { arrayify, hexlify } from "ethers/lib/utils"
import classes from "./style.module.css"
import ConditionHeader from "./ConditionHeader"
import Flex from "@/ui/Flex"
import { AbiFunction, AbiParameter } from "viem"
import LabeledData from "@/ui/LabeledData"

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
    <div className={classes.conditionContainer}>
      <ConditionHeader
        condition={condition}
        paramIndex={paramIndex}
        abi={abi}
      />
      <Flex direction="column" gap={2} className={classes.conditionBody}>
        <LabeledData label="Shift">
          <input
            type="text"
            readOnly
            value={shift}
            className={classes.conditionInput}
          />
        </LabeledData>

        <LabeledData label="Mask">
          <input
            type="text"
            readOnly
            value={mask}
            className={classes.conditionInput}
          />
        </LabeledData>

        <LabeledData label="Expected value">
          <input
            type="text"
            readOnly
            value={value}
            className={classes.conditionInput}
          />
        </LabeledData>
      </Flex>
    </div>
  )
}

export default BitmaskConditionView
