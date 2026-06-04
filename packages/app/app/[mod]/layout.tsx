import { Suspense } from "react"
import { parseModParam } from "@/app/params"
import SecurityNotice from "@/components/SecurityNotice"

/**
 * Wraps every route scoped to a specific Roles modifier (`/[mod]/...`). Surfaces
 * the security-check banner for that modifier above the page. Routes without a
 * mod in their path (the landing page, `/permissions/...`) don't get a layout
 * here, so they're unaffected.
 */
export default async function ModLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ mod: string }>
}) {
  const { mod } = await params
  const parsed = parseModParam(mod)

  return (
    <>
      {parsed && (
        <Suspense fallback={null}>
          <SecurityNotice mod={parsed} />
        </Suspense>
      )}
      {children}
    </>
  )
}
