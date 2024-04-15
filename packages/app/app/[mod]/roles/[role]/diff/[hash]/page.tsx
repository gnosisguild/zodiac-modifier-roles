import {
  Annotation,
  Clearance,
  Target,
  applyAnnotations,
  applyTargets,
  posterAbi,
  rolesAbi,
} from "zodiac-roles-sdk"
import { MdOutlineFileDownload } from "react-icons/md"
import { notFound } from "next/navigation"
import { kv } from "@vercel/kv"
import { JsonFragment, JsonFragmentType } from "@ethersproject/abi"
import { Interface, hexlify, isBytesLike, Result } from "ethers/lib/utils"
import { BigNumber } from "ethers"

import Box from "@/ui/Box"
import Layout from "@/components/Layout"
import { parseModParam, parseRoleParam } from "@/app/params"
import PermissionsDiff from "@/components/permissions/PermissionsDiff"
import PageBreadcrumbs from "./breadcrumbs"
import styles from "./page.module.css"
import Flex from "@/ui/Flex"
import CallData from "@/components/CallData"
import { fetchOrInitRole } from "@/components/RoleView/fetching"
import { ChainId } from "@/app/chains"
import Link from "next/link"

export default async function DiffPage({
  params,
  searchParams,
}: {
  params: { mod: string; role: string; hash: string }
  searchParams: { annotations?: string }
}) {
  const mod = parseModParam(params.mod)
  const roleKey = parseRoleParam(params.role)
  if (!mod || !roleKey) {
    notFound()
  }

  const roleData = await fetchOrInitRole({ ...mod, roleKey })
  const roleTargets = roleData.targets.filter(
    (target) => !isEmptyFunctionScoped(target)
  )

  const entry = await kv.get<{
    targets: Target[]
    annotations: Annotation[]
  }>(params.hash)
  if (!entry) {
    notFound()
  }
  const entryTargets = entry.targets.filter(
    (target) => !isEmptyFunctionScoped(target)
  )

  const hasAnnotations =
    roleData.annotations.length > 0 || entry.annotations.length > 0
  const shallShowAnnotations = searchParams.annotations !== "false"

  const roleAnnotations = shallShowAnnotations ? roleData.annotations : []
  const entryAnnotations = shallShowAnnotations ? entry.annotations : []

  const comments: string[] = []
  const logCall = (log: string) => comments.push(log)

  const calls = [
    ...(
      await applyTargets(roleKey, entryTargets, {
        ...mod,
        mode: "replace",
        currentTargets: roleTargets,
        log: logCall,
      })
    ).map((data) => ({ to: mod.address, data })),

    ...(
      await applyAnnotations(roleKey, entryAnnotations, {
        ...mod,
        mode: "replace",
        currentAnnotations: roleAnnotations,
        log: logCall,
      })
    ).map((data) => ({ to: POSTER_ADDRESS, data })),
  ]

  const txBuilderJson = exportToSafeTransactionBuilder(
    calls,
    mod.chainId,
    params.role
  )

  return (
    <Layout head={<PageBreadcrumbs {...params} mod={mod} />}>
      {hasAnnotations && (
        <Flex
          direction="row"
          gap={1}
          justifyContent="end"
          className={styles.toolbar}
        >
          <Link href={{ query: { annotations: !shallShowAnnotations } }}>
            {shallShowAnnotations ? "Hide annotations" : "Show annotations"}
          </Link>
        </Flex>
      )}
      <main className={styles.main}>
        <Flex direction="column" gap={1}>
          <PermissionsDiff
            left={{ targets: roleTargets, annotations: roleAnnotations }}
            right={{ targets: entryTargets, annotations: entryAnnotations }}
            chainId={mod.chainId}
          />
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
                    <div className={styles.index}>{i}</div>
                    <div className={styles.callTo}>
                      <label title={call.to}>
                        {call.to === mod.address ? "Roles" : "Poster"}
                      </label>
                    </div>
                    <CallData className={styles.callData}>{call.data}</CallData>
                    <div className={styles.comment}>{comments[i]}</div>
                  </Flex>
                ))}
              </Flex>
            </Flex>
          </Box>
        </Flex>
      </main>
    </Layout>
  )
}

const isEmptyFunctionScoped = (target: Target) =>
  target.clearance === Clearance.Function && target.functions.length === 0

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
      } else if (BigNumber.isBigNumber(value)) {
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
