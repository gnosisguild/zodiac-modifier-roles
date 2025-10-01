"use client"
import { CHAINS } from "@/app/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { getDefaultConfig } from "connectkit"
import { Ref, useMemo } from "react"
import { createConfig, injected, WagmiProvider } from "wagmi"
import { metaMask, walletConnect } from "wagmi/connectors"

const WALLETCONNECT_PROJECT_ID = "4a48c8853b777ed87e37fc43d506de27"

const walletConnectConnectorRef: Ref<ReturnType<typeof walletConnect>> = {
  current: null,
}

const getWalletConnectConnector = () => {
  if (walletConnectConnectorRef.current) {
    return walletConnectConnectorRef.current
  }

  walletConnectConnectorRef.current = walletConnect({
    projectId: WALLETCONNECT_PROJECT_ID,
    showQrModal: false,
  })

  return walletConnectConnectorRef.current
}

export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Zodiac Roles",
    ssr: true,
    walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
    chains: Object.values(CHAINS) as any,
    connectors: [injected(), metaMask(), getWalletConnectConnector()],
    batch: {
      multicall: false,
    },
  })
)

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useMemo(() => new QueryClient(), [])

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
    </QueryClientProvider>
  )
}
