import { ethers } from "ethers"
import EIP3770List from "../data/EIP3770.json"

const EIP3770Names = Object.values(EIP3770List).map((name) => name.toLowerCase())
const EIP3770ChainIds = Object.keys(EIP3770List)

/**
 * Truncates an ethereum address to the format 0x0000…0000
 * @param address Full address to truncate
 * @returns Truncated address
 */
export function truncateEthAddress(address: string) {
  const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/
  const match = address.match(truncateRegex)
  if (!match) return address
  return `${match[1]}…${match[2]}`
}

export function getAddress(address: string) {
  if (address.includes(":")) {
    const [chainShortName, _address] = address.split(":", 2)
    const chainId = getEIP3770ChainId(chainShortName)
    if (chainId && ethers.utils.isAddress(_address)) {
      return {
        chainId,
        address: _address,
        fullAddress: address, // EIP-3770
      }
    }
  }
  if (ethers.utils.isAddress(address)) {
    return { address }
  }
}

export function formatAddressEIP3770(chainId: number, address: string) {
  const prefix = getEIP3770Prefix(chainId)
  if (!prefix) return
  return `${prefix}:${address}`
}

export function getEIP3770Prefix(chainId: number): string | undefined {
  const index = chainId.toString()
  return (EIP3770List as Record<string, string>)[index]
}

export function getEIP3770ChainId(name: string): number | undefined {
  const index = EIP3770Names.indexOf(name.toLowerCase())
  if (index >= 0) {
    return parseInt(EIP3770ChainIds[index])
  }
  return
}
