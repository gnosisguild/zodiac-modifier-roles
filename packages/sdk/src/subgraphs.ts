const SUBGRAPHS = {
  [4]: "https://api.thegraph.com/subgraphs/name/asgeir-eth/zodiac-modifier-roles-rinkeby",
}

export default SUBGRAPHS

export type NetworkId = keyof typeof SUBGRAPHS
