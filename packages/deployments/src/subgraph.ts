import { chains } from "./chains"
import { ChainId } from "./types"

export type FetchOptions = Omit<RequestInit, "method" | "body">

interface QueryRequest {
  query: string
  variables: { [key: string]: string | number | undefined }
  operationName: string
}

type EndpointConfig =
  | {
      subgraph: string
    }
  | { chainId: ChainId; theGraphApiKey?: string }

// This is an API key owner by Gnosis Guild. It has a low monthly quota and should only be used for development purposes.
const DEV_API_KEY = "ea04dbe51a8de70fb8afccc3c9bccac7"

const resolveEndpointUrl = (endpoint: EndpointConfig) => {
  if ("subgraph" in endpoint && endpoint.subgraph != null) {
    return endpoint.subgraph
  }

  if (!("chainId" in endpoint)) {
    throw new Error("provide either a subgraph or a chainId")
  }

  const apiKey = endpoint.theGraphApiKey ?? DEV_API_KEY
  const { subgraphDeploymentId } = chains[endpoint.chainId]

  return `https://gateway.thegraph.com/api/${apiKey}/deployments/id/${subgraphDeploymentId}`
}

export const fetchFromSubgraph = async (
  endpoint: EndpointConfig,
  request: QueryRequest,
  options?: FetchOptions
) => {
  const res = await fetch(resolveEndpointUrl(endpoint), {
    ...options,
    method: "POST",
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  const { data, error, errors } = await res.json()

  const foundError = error || (errors && errors[0])
  if (foundError) {
    const message =
      typeof foundError === "object"
        ? foundError.message || "Unknown error"
        : foundError
    throw new Error(message)
  }

  if (!data) {
    throw new Error("Subgraph query returned no data")
  }

  return data
}

/**
 * Subgraph has a maximum page size of 1000, which we're setting in our queries.
 * If there are 1000 results, it's likely there are more and for now we throw an error in that case.
 * This is to prevent people from inadvertently working with incomplete representations.
 **/
export const assertNoPagination = (data: any[]) => {
  if (data.length === 1000) {
    throw new Error("Pagination not supported")
  }
}
