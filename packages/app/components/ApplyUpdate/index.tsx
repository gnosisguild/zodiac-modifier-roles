import { MdOutlineFileDownload } from "react-icons/md"
import {
  abi as rolesAbi,
  Annotation,
  ChainId,
  Role,
  Target,
  planApplyRole,
  decodeKey,
  LicenseError,
} from "zodiac-roles-sdk"

import Box from "@/ui/Box"
import Flex from "@/ui/Flex"

import CallData from "../CallData"
import styles from "./style.module.css"
import ExecuteButton from "./ExecuteButton"
import { Provider } from "./Provider"
import {
  hexlify,
  Interface,
  isBytesLike,
  JsonFragment,
  JsonFragmentType,
  ParamType,
  Result,
} from "ethers"
import Alert from "@/ui/Alert"
import { LinkButton } from "@/ui/Button"

interface Props {
  chainId: ChainId
  address: `0x${string}`
  owner: `0x${string}`
  role: Role

  members?: `0x${string}`[]
  targets?: Target[]
  annotations?: Annotation[]
}

const ApplyUpdates: React.FC<Props> = async ({
  chainId,
  address,
  owner,
  role,
  members,
  targets,
  annotations,
}) => {
  const comments: string[] = []
  const logCall = (log: string) => comments.push(log)

  let calls: { to: `0x${string}`; data: `0x${string}` }[] = []
  try {
    calls = await planApplyRole(
      {
        key: role.key,
        members,
        targets,
        annotations,
      },
      { chainId, address, log: logCall }
    )
  } catch (error) {
    if (error instanceof LicenseError) {
      return (
        <Flex direction="column" gap={3}>
          <Alert title="Zodiac OS account required">
            This role is using allowances, a feature requiring a Zodiac OS
            account. Please add the owner of the Roles Modifier to your Zodiac
            OS organization using the button below. Afterwards, reload this page
            to continue.
          </Alert>
          <LinkButton
            primary
            target="_blank"
            href={`https://app.pilot.gnosisguild.org/create/${error.owner}`}
          >
            Add account to Zodiac OS
          </LinkButton>
        </Flex>
      )
    }
    throw error
  }

  const txBuilderJson = exportToSafeTransactionBuilder(calls, chainId, role.key)
  return (
    <Box p={3} className={styles.calls}>
      <Flex direction="column" gap={3}>
        <Flex direction="row" gap={3}>
          <h5>Calls to apply the diff</h5>
          <a
            href={
              "data:application/json," +
              encodeURI(JSON.stringify(txBuilderJson))
            }
            download="safeTransactionBuilder.json"
            title="Download JSON for Safe Transaction Builder"
          >
            <MdOutlineFileDownload />
          </a>
        </Flex>
        <Flex direction="column" gap={3}>
          {calls.map((call, i) => (
            <Flex gap={3} key={i}>
              <div className={styles.index}>{i + 1}</div>
              <div className={styles.callTo}>
                <label title={call.to}>
                  {call.to === address ? "Roles" : "Poster"}
                </label>
              </div>
              <CallData className={styles.callData}>{call.data}</CallData>
              <div className={styles.comment}>{comments[i]}</div>
            </Flex>
          ))}
        </Flex>
        <Provider>
          <ExecuteButton calls={calls} owner={owner} />
        </Provider>
      </Flex>
    </Box>
  )
}

export default ApplyUpdates

const exportToSafeTransactionBuilder = (
  calls: { to: `0x${string}`; data: `0x${string}` }[],
  chainId: ChainId,
  roleKey: string
) => {
  return {
    version: "1.0",
    chainId: chainId.toString(10),
    createdAt: Date.now(),
    meta: {
      name: `Update permissions of ${decodeKey(roleKey)} role`,
      description: "",
      txBuilderVersion: "1.16.2",
    },
    transactions: calls.map(decode),
  } as const
}

// EIP-3722 Poster contract
const POSTER_ADDRESS = "0x000000000000cd17345801aa8147b8D3950260FF" as const
const posterAbi = JSON.parse(
  Interface.from(["function post(string content,string tag)"]).formatJson()
)

const decode = (transaction: { to: `0x${string}`; data: `0x${string}` }) => {
  const abi: readonly JsonFragment[] =
    transaction.to === POSTER_ADDRESS ? posterAbi : rolesAbi

  const iface = new Interface(abi)

  const selector = transaction.data.slice(0, 10)
  const functionFragment = iface.getFunction(selector)

  if (!functionFragment) {
    throw new Error(`Could not find a function with selector ${selector}`)
  }

  const contractMethod = abi.find(
    (fragment) =>
      fragment.type === "function" && fragment.name === functionFragment.name
  )
  if (!contractMethod) {
    throw new Error(
      `Could not find an ABI function fragment with name ${functionFragment.name}`
    )
  }

  const contractInputsValues = asTxBuilderInputValues(
    iface.decodeFunctionData(functionFragment, transaction.data),
    functionFragment.inputs
  )

  return {
    to: transaction.to,
    value: "0",
    contractMethod: {
      inputs: mapInputs(contractMethod.inputs) || [],
      name: contractMethod.name || "",
      payable: !!contractMethod.payable,
    },
    contractInputsValues,
  }
}

const mapInputs = (
  inputs: readonly JsonFragmentType[] | undefined
): ContractInput[] | undefined => {
  return inputs?.map((input) => ({
    internalType: input.internalType || "",
    name: input.name || "",
    type: input.type || "",
    components: mapInputs(input.components),
  }))
}

const asTxBuilderInputValues = (
  result: Result,
  params: readonly ParamType[]
) => {
  const object: Record<string, string> = {}

  for (const param of params) {
    const value = result[param.name]
    let serialized = value
    if (typeof value === "string") {
      serialized = value
    } else if (typeof value === "bigint" || typeof value === "number") {
      serialized = value.toString()
    } else if (isBytesLike(value)) {
      serialized = hexlify(value)
    } else if (value instanceof Result) {
      serialized = JSON.stringify(value, (_, v) =>
        isBytesLike(v) ? hexlify(v) : typeof v === "bigint" ? v.toString() : v
      )
    } else {
      throw new Error(`Unexpected value type: ${typeof value}`)
    }

    object[param.name] = serialized
  }
  return object
}

export interface ContractInput {
  internalType: string
  name: string
  type: string
  components?: ContractInput[]
}
