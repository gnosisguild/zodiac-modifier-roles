import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
import { configure } from "../utils/http"
import { JsonFragment } from "@ethersproject/abi";

export interface ExplorerConfig {
  apiUrl: string
  apiKey?: string
}

export class Explorer {
  private readonly apiUrl: string
  private readonly apiKey?: string
  private httpClient: AxiosInstance | undefined
  private cache: LocalForage | undefined

  constructor(config: ExplorerConfig) {
    this.apiUrl = config.apiUrl
    this.apiKey = config.apiKey
  }

  async abi(address: string):Promise<JsonFragment[]> {
    const client = await this.getHttpClient()
    const response = await client.get<{ status: string; result: string }>(this.apiUrl, {
      params: {
        module: "contract",
        action: "getabi",
        address,
      },
    })

    if (response.data.status !== "1") {
      this.removeResponseFromCache(response)
      throw new Error(response.data.result)
    }

    return JSON.parse(response.data.result)
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
