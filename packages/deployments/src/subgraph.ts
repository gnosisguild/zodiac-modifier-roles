export type FetchOptions = Omit<RequestInit, "method" | "body">

interface QueryRequest {
  query: string
  variables: { [key: string]: string | number | undefined }
  operationName: string
}

const SQD_URL = "https://gnosisguild.squids.live/roles:production/api/graphql"

export const fetchFromSubgraph = async (
  request: QueryRequest,
  options?: FetchOptions
) => {
  const res = await fetch(SQD_URL, {
    ...options,
    method: "POST",
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  // TODO: adjust error handling
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
