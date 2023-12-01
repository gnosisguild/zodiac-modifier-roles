import { log } from "@graphprotocol/graph-ts"
import { ConsumeAllowance } from "../generated/AllowanceTracker/AllowanceTracker"
import { getRolesModifierId, getOrCreateAllowance } from "./helpers"

export function handleConsumeAllowance(event: ConsumeAllowance): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)

  const allowance = getOrCreateAllowance(event.params.allowanceKey, rolesModifierId)
  allowance.balance = event.params.newBalance
  allowance.save()

  log.info("Allowance {} has been consumed, new balance: {}", [allowance.id, allowance.balance.toString()])
}
