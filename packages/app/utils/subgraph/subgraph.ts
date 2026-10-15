import { getVercelOidcToken } from "@vercel/oidc"

export type FetchOptions = Omit<RequestInit, "method" | "body">

interface QueryRequest {
  query: string
  variables: { [key: string]: string | number | undefined }
  operationName: string
}

const SUBGRAPH_URL = "https://indexer.zodiac.eco/subgraph"

export const fetchFromSubgraph = async (
  request: QueryRequest,
  options?: FetchOptions
) => {
  const token = await findVercelOidcToken()
  const res = await fetch(SUBGRAPH_URL, {
    ...options,
    method: "POST",
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
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
    throw new Error("Query returned no data")
  }

  return data
}

const findVercelOidcToken = async () => {
  try {
    return await getVercelOidcToken()
  } catch {
    return null
  }
}
