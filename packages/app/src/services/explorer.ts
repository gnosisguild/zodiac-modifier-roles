import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import { configure } from "../utils/http"
import { JsonFragment } from "@ethersproject/abi"
import { Interface } from "ethers/lib/utils"
import detectProxyTarget from "evm-proxy-detection"
import { ethers } from "ethers"

export interface ExplorerConfig {
  apiUrl: string
  apiKey?: string
}

export class Explorer {
  private readonly apiUrl: string
  private readonly apiKey?: string
  private httpClient: AxiosInstance | undefined
  private cache: LocalForage | undefined
  private provider: ethers.providers.StaticJsonRpcProvider

  constructor(config: ExplorerConfig, provider: ethers.providers.StaticJsonRpcProvider) {
    this.apiUrl = config.apiUrl
    this.apiKey = config.apiKey
    this.provider = provider
  }

  async abi(address: string): Promise<JsonFragment[]> {
    const client = await this.getHttpClient()
    const response = await client.get<{ status: string; result: string }>(this.apiUrl, {
      params: {
        module: "contract",
        action: "getabi",
        address,
      },
    })

    if (response.data.status !== "1") {
      // could not fetch ABI

      // check if this is a proxy
      const proxyAddress = await this.detectProxyTarget(address)
      if (proxyAddress) return await this.abi(proxyAddress)

      // otherwise remove from cache so we can try again later
      this.removeResponseFromCache(response)
      throw new Error(response.data.result)
    }

    const json = JSON.parse(response.data.result) as JsonFragment[]

    if (looksLikeAProxy(json)) {
      const proxyAddress = await this.detectProxyTarget(address)
      if (proxyAddress) return await this.abi(proxyAddress)
    }

    return json
  }

  async detectProxyTarget(address: string): Promise<string | null> {
    return await detectProxyTarget(address, ({ method, params }) => this.provider.send(method, params))
  }

  private getHttpClientConfig(): AxiosRequestConfig {
    const params = this.apiKey ? { apikey: this.apiKey } : {}
    return {
      url: this.apiUrl,
      params,
    }
  }

  private async getHttpClient(): Promise<AxiosInstance> {
    if (!this.httpClient) {
      const { client, store } = await configure(this.getHttpClientConfig())
      this.httpClient = client
      this.cache = store
    }
    return this.httpClient
  }

  private removeResponseFromCache<T>(response: AxiosResponse<T>) {
    if (!this.cache) return
    const params = new URLSearchParams(response.config.params)
    const url = `${response.config.url}?${params.toString()}`
    this.cache.removeItem(url)
  }
}

const looksLikeAProxy = (abi: JsonFragment[]) => {
  const iface = new Interface(abi)
  const signatures = Object.keys(iface.functions)
  return (
    signatures.length === 0 ||
    signatures ||
    looksLike(abi, ["implementation()"]) || // for EIP-897/EIP-1967/... proxies
    looksLike(abi, ["comptrollerImplementation()"]) // for Compound Comptroller
  )
}

const looksLike = (abi: JsonFragment[], expectedFunctions: string[]) => {
  const iface = new Interface(abi)
  const signatures = Object.keys(iface.functions)
  return expectedFunctions.every((sig) => signatures.includes(sig))
}
