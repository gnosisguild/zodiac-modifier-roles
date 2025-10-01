"use client"

import { ChainId, CHAINS } from "@/app/chains"
import Address from "@/ui/Address"
import { Button } from "@/ui/Button"
import { ConnectKitButton, ConnectKitProvider } from "connectkit"
import { useAccountEffect, useChainId } from "wagmi"

export type OnConnectArgs = {
  address: `0x${string}`
}

type ConnectProps = {
  onConnect?: (args: OnConnectArgs) => void
  chainId: ChainId
}

export const ConnectButton = ({ chainId, onConnect }: ConnectProps) => {
  useAccountEffect({
    onConnect({ address, isReconnected }) {
      if (isReconnected) {
        return
      }

      if (onConnect == null) {
        return
      }

      onConnect({
        address,
      })
    },
  })

  const connectedChainId = useChainId()
  const chain = CHAINS[chainId]

  return (
    <ConnectKitProvider
      options={{
        initialChainId: chainId,
        hideNoWalletCTA: true,
        hideQuestionMarkCTA: true,
      }}
    >
      <ConnectKitButton.Custom>
        {({ show, address }) => {
          if (address == null) {
            return (
              <Button primary onClick={show}>
                Connect Wallet to Apply Updates
              </Button>
            )
          }

          if (connectedChainId !== chainId) {
            return (
              <Button primary onClick={show}>
                Switch Wallet to {chain?.name || `#${chainId}`} to Apply Updates
              </Button>
            )
          }

          return (
            <Button onClick={show}>
              <Address address={address} />
            </Button>
          )
        }}
      </ConnectKitButton.Custom>
    </ConnectKitProvider>
  )
}
