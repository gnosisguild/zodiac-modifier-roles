import { Enforcer } from "openapi-enforcer"
import { Preset } from "./types"
import { matchPath } from "./annotations"
import { OpenApiObject } from "./schema"

// export const parseParams = (preset: Preset) => {
//   const pathParams = matchPath(preset.pathPattern, preset.path)
//   if (!pathParams) throw new Error("Path does not match path pattern")

//   const queryParams = new URLSearchParams(preset.query)

//   return Object.fromEntries(
//     preset.operation.parameters.map((param) => {
//       if (param.in === "path") {
//         return [param.name, pathParams[param.name]] as const
//       }

//       if (param.in === "query") {
//         const value = queryParams.get(param.name)
//         param.schema
//         return [param.name] as const
//       }

//       return [param.name, undefined] as const
//     })
//   )
// }

export const parseParams = async (preset: Preset, apiSpec: OpenApiObject) => {
  const openapi = await Enforcer(apiSpec)
}
