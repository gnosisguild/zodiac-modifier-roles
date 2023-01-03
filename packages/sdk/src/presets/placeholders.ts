import { Placeholder } from "./types"

export const AVATAR_ADDRESS = new Placeholder<string>(
  "Avatar",
  "address",
  "The address of the avatar this Roles mod is attached to"
)

export const OMNI_BRIDGE_RECIPIENT_MAINNET = new Placeholder<string>(
  "OmniBridge recipient on the mainnet end",
  "address",
  "Recipient account for any funds sent to mainnet via the OmniBridge"
)

export const OMNI_BRIDGE_RECIPIENT_GNOSIS_CHAIN = new Placeholder<string>(
  "OmniBridge recipient on the Gnosis Chain end",
  "address",
  "Recipient account for any funds sent to Gnosis Chain via the OmniBridge"
)
