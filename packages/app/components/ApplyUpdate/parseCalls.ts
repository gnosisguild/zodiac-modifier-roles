import { Interface } from "ethers"
import type { ContractInput } from "./txBuilder"

type Call = { to: `0x${string}`; data: `0x${string}` }

interface TxBuilderTransaction {
  to: string
  value?: string
  data?: string
  contractMethod?: {
    inputs: ContractInput[]
    name: string
    payable: boolean
  }
  contractInputsValues?: Record<string, string>
}

interface TxBuilderJson {
  version: string
  transactions: TxBuilderTransaction[]
}

export function parseCalls(jsonString: string): Call[] {
  let json: unknown
  try {
    json = JSON.parse(jsonString)
  } catch {
    throw new Error("Invalid JSON")
  }

  // Format 1: Safe Transaction Builder JSON
  if (isTxBuilderJson(json)) {
    return json.transactions.map((tx) => {
      if (tx.data) {
        return {
          to: tx.to as `0x${string}`,
          data: tx.data as `0x${string}`,
        }
      }

      if (tx.contractMethod && tx.contractInputsValues) {
        const iface = new Interface([
          {
            type: "function",
            name: tx.contractMethod.name,
            inputs: tx.contractMethod.inputs,
          },
        ])
        const values = tx.contractMethod.inputs.map((input) => {
          const raw = tx.contractInputsValues![input.name]
          try {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed) || (typeof parsed === "object" && parsed !== null)) {
              return parsed
            }
          } catch {}
          return raw
        })
        const data = iface.encodeFunctionData(
          tx.contractMethod.name,
          values
        ) as `0x${string}`
        return { to: tx.to as `0x${string}`, data }
      }

      throw new Error(
        "Transaction must have either a `data` field or `contractMethod` + `contractInputsValues`"
      )
    })
  }

  // Format 2: Array of meta transactions
  if (Array.isArray(json)) {
    return json.map((item, i) => {
      if (!isMetaTx(item)) {
        throw new Error(
          `Item at index ${i} must have \`to\` and \`data\` hex fields`
        )
      }
      return { to: item.to as `0x${string}`, data: item.data as `0x${string}` }
    })
  }

  // Format 3: Single meta transaction
  if (isMetaTx(json)) {
    return [
      { to: json.to as `0x${string}`, data: json.data as `0x${string}` },
    ]
  }

  throw new Error(
    "Unrecognized format. Expected a Safe Transaction Builder JSON, an array of {to, data} objects, or a single {to, data} object."
  )
}

function isTxBuilderJson(json: unknown): json is TxBuilderJson {
  return (
    typeof json === "object" &&
    json !== null &&
    "version" in json &&
    "transactions" in json &&
    Array.isArray((json as TxBuilderJson).transactions)
  )
}

function isMetaTx(
  json: unknown
): json is { to: string; data: string; [key: string]: unknown } {
  return (
    typeof json === "object" &&
    json !== null &&
    "to" in json &&
    "data" in json &&
    typeof (json as Record<string, unknown>).to === "string" &&
    typeof (json as Record<string, unknown>).data === "string"
  )
}
