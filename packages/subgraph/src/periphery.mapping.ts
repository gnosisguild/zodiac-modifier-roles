import { log } from "@graphprotocol/graph-ts"
import { SetUnwrapAdapter } from "../generated/Periphery/Periphery"
import { getOrCreateUnwrapAdapter, getRolesModifierId } from "./helpers"

export function handleSetUnwrapAdapter(event: SetUnwrapAdapter): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)

  const adapter = getOrCreateUnwrapAdapter(
    event.params.adapter,
    event.params.to,
    event.params.selector,
    rolesModifierId,
  )

  log.info("UnwrapAdapter {} has been set to {}", [adapter.id, adapter.adapterAddress.toHexString()])
}
