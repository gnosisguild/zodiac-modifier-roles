import { bytecode as creationBytecode } from "@safe-global/safe-contracts/build/artifacts/contracts/proxies/SafeProxy.sol/SafeProxy.json"
import {
  AbiCoder,
  ZeroAddress,
  concat,
  getCreate2Address,
  keccak256,
} from "ethers"

import { address as fallbackHandler } from "./deploy-mastercopies/fallbackHandler"
import {
  iface as ifaceSafe,
  address as mastercopy,
} from "./deploy-mastercopies/safeMastercopy"
import {
  address as factory,
  iface as ifaceFactory,
} from "./deploy-mastercopies/safeProxyFactory"

export function calculateSafeAddress({
  owners,
  threshold,
  creationNonce,
}: {
  owners: string[]
  threshold: number
  creationNonce: bigint | number
}): string {
  const abi = AbiCoder.defaultAbiCoder()

  const salt = keccak256(
    concat([
      keccak256(initializer({ owners, threshold })),
      abi.encode(["uint256"], [creationNonce]),
    ])
  )

  const deploymentData = concat([
    creationBytecode,
    abi.encode(["address"], [mastercopy]),
  ])

  return getCreate2Address(factory, salt, keccak256(deploymentData))
}

export function populateSafeCreation({
  owners,
  threshold,
  creationNonce,
}: {
  owners: string[]
  threshold: number
  creationNonce: bigint
}) {
  return {
    to: factory,
    value: 0,
    data: ifaceFactory.encodeFunctionData("createProxyWithNonce", [
      mastercopy,
      initializer({ owners, threshold }),
      creationNonce,
    ]),
  }
}

function initializer({
  owners,
  threshold,
}: {
  owners: string[]
  threshold: number
}) {
  const initializer = ifaceSafe.encodeFunctionData("setup", [
    owners,
    threshold,
    ZeroAddress,
    "0x",
    fallbackHandler,
    ZeroAddress,
    0,
    ZeroAddress,
  ])

  return initializer
}
