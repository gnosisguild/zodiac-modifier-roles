import { ExecutionOptions as ExecutionOptionsEnum } from "../types"

import { ExecutionOptions } from "./types"

export const execOptions = (
  options: ExecutionOptions = {}
): ExecutionOptionsEnum => {
  if (options.send && options.delegatecall) return ExecutionOptionsEnum.Both
  if (options.delegatecall) return ExecutionOptionsEnum.DelegateCall
  if (options.send) return ExecutionOptionsEnum.Send
  return ExecutionOptionsEnum.None
}
