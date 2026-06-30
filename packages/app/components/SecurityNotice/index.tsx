import { Mod } from "@/app/params"
import Banner from "./Banner"

// The public Zodiac security-check API. We call it server-side: it sets no CORS
// header (so a cross-origin browser fetch would be blocked), and this keeps the
// on-chain walk off the client.
const ZODIAC_APP_ORIGIN = "https://app.zodiac.eco"

type SecurityCheckResult = {
  status: "safe" | "affected" | "incomplete"
  checkedVaultCount: number
  erroredVaultCount: number
  affectedSafes: { chainId: number; address: string; fallbackHandler: string }[]
}

/**
 * Check a single Roles modifier against the shared Zodiac security-check API and,
 * when it is affected (or couldn't be fully checked), render a warning banner
 * pointing at the remediation tool. Rendered inside a Suspense boundary so the
 * on-chain walk never blocks the page; a clean or failed check shows nothing.
 */
export default async function SecurityNotice({ mod }: { mod: Mod }) {
  const result = await checkMod(mod)

  if (result == null || result.status === "safe") {
    return null
  }

  return (
    <Banner
      status={result.status}
      affectedCount={result.affectedSafes.length}
      remediationUrl={`${ZODIAC_APP_ORIGIN}/public/fallback-handler?address=${mod.address}&chainId=${mod.chainId}`}
    />
  )
}

async function checkMod(mod: Mod): Promise<SecurityCheckResult | null> {
  try {
    const response = await fetch(
      `${ZODIAC_APP_ORIGIN}/public/api/security-check?safes=${mod.chainId}:${mod.address}`,
      // Cache briefly so navigating between a mod's pages doesn't re-walk on
      // every request, while still reflecting remediation within a few minutes.
      { next: { revalidate: 120 } },
    )
    if (!response.ok) {
      return null
    }
    return (await response.json()) as SecurityCheckResult
  } catch {
    return null
  }
}
