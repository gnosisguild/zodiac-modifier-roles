import { MdOutlineFileDownload } from "react-icons/md"
import {
  Annotation,
  ChainId,
  Target,
  applyAnnotations,
  applyTargets,
  posterAbi,
  rolesAbi,
} from "zodiac-roles-sdk"

import Box from "@/ui/Box"
import Flex from "@/ui/Flex"

import CallData from "../CallData"
import styles from "./style.module.css"
import { parseRoleParam } from "@/app/params"
import ExecuteButton from "./ExecuteButton"
import { Provider } from "./Provider"
import {
  hexlify,
  Interface,
  isBytesLike,
  JsonFragment,
  JsonFragmentType,
  Result,
} from "ethers"

interface Props {
  chainId: ChainId
  address: `0x${string}`
  owner: `0x${string}`
  role: string
  targets: Target[]
  annotations: Annotation[]
  currentTargets: Target[]
  currentAnnotations: Annotation[]
}

const ApplyUpdates: React.FC<Props> = async ({
  chainId,
  address,
  owner,
  role,
  targets,
  annotations,
  currentTargets,
  currentAnnotations,
}) => {
  const roleKey = parseRoleParam(role)
  if (!roleKey) throw new Error("Invalid role key")

  const comments: string[] = []
  const logCall = (log: string) => comments.push(log)

  const calls = [
    ...(
      await applyTargets(roleKey, targets, {
        chainId: chainId,
        address: address,
        mode: "replace",
        currentTargets,
        log: logCall,
      })
    ).map((data) => ({ to: address, data })),

    ...(
      await applyAnnotations(roleKey, annotations, {
        chainId: chainId,
        address: address,
        mode: "replace",
        currentAnnotations,
        log: logCall,
      })
    ).map((data) => ({ to: POSTER_ADDRESS, data })),
  ]

  const txBuilderJson = exportToSafeTransactionBuilder(calls, chainId, role)
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
  role: string
) => {
  return {
    version: "1.0",
    chainId: chainId.toString(10),
    createdAt: Date.now(),
    meta: {
      name: `Update permissions of "${role}" role`,
      description: "",
      txBuilderVersion: "1.16.2",
    },
    transactions: calls.map(decode),
  } as const
}

// EIP-3722 Poster contract
const POSTER_ADDRESS = "0x000000000000cd17345801aa8147b8D3950260FF" as const

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
    iface.decodeFunctionData(functionFragment, transaction.data)
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

const asTxBuilderInputValues = (result: Result) => {
  const object: Record<string, string> = {}
  for (const key of Object.keys(result)) {
    // skip numeric keys (array indices)
    if (isNaN(Number(key))) {
      const value = result[key]
      let serialized = value
      if (typeof value === "string") {
        serialized = value
      } else if (typeof value === "bigint" || typeof value === "number") {
        serialized = value.toString()
      } else if (isBytesLike(value)) {
        serialized = hexlify(value)
      } else {
        serialized = JSON.stringify(value)
      }

      object[key] = serialized
    }
  }
  return object
}

export interface ContractInput {
  internalType: string
  name: string
  type: string
  components?: ContractInput[]
}
