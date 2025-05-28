import { ChainId, fetchRolesModConfig } from "zodiac-roles-deployments"
import { fetchLicense, License } from "zodiac-roles-sdk"

const baseAppData = {
  partnerFee: 25,
}

interface Props {
  chainId: ChainId
  owner: `0x${string}`
}

export const makeAppData = async ({ chainId, owner }: Props) => {
  const license = owner && (await fetchLicense({ chainId, owner }))

  if (license === License.Enterprise) {
    return JSON.stringify({
      ...baseAppData,
      partnerFee: 0,
    })
  }

  return JSON.stringify({
    ...baseAppData,
    partnerFee: 25,
  })
}
