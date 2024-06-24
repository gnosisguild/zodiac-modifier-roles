import { store, log } from "@graphprotocol/graph-ts"
import { SetUnwrapAdapter } from "../generated/Periphery/Periphery"
import { getOrCreateUnwrapAdapter, getRolesModifierId, ADDRESS_ZERO, getUnwrapAdapterId } from "./helpers"

export function handleSetUnwrapAdapter(event: SetUnwrapAdapter): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)

  const adapter = getOrCreateUnwrapAdapter(event.params.to, event.params.selector, rolesModifierId)
  if (event.params.adapter == ADDRESS_ZERO) {
    const id = getUnwrapAdapterId(event.params.to, event.params.selector, rolesModifierId)
    store.remove("UnwrapAdapter", id)
    log.info("UnwrapAdapter {} has been removed", [id])
  } else {
    adapter.adapterAddress = event.params.adapter
    adapter.save()
    log.info("UnwrapAdapter {} has been set to {}", [adapter.id, adapter.adapterAddress.toHexString()])
  }
}
