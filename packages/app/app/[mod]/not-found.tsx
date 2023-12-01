import Layout from "@/components/Layout"
import { LinkButton } from "@/ui/Button"

export default function NotFound() {
  return (
    <Layout>
      <h2>There&apos;s nothing here!</h2>
      <p>Could not find a Roles Mod at this address</p>
      <LinkButton href="/">Connect a Roles Mod</LinkButton>
    </Layout>
  )
}
