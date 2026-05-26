import { ExecutionOptions } from "../types"

import { ExecutionFlags } from "./types"

export const executionFlagsToOptions = (
  options: ExecutionFlags
): ExecutionOptions => {
  if (options.send && options.delegatecall) return ExecutionOptions.Both
  if (options.delegatecall) return ExecutionOptions.DelegateCall
  if (options.send) return ExecutionOptions.Send
  return ExecutionOptions.None
}
