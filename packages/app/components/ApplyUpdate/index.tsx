import {
  Annotation,
  ChainId,
  Role,
  Target,
  planApplyRole,
  LicenseError,
} from "zodiac-roles-sdk"

import Flex from "@/ui/Flex"
import Alert from "@/ui/Alert"
import { LinkButton } from "@/ui/Button"

import { isGovernor } from "./ApplyViaGovernor/isGovernor"
import { isRethinkFactory } from "./ApplyViaRethinkFactory/isRethinkFactory"
import ApplyUpdateInteractive from "./ApplyUpdateInteractive"

type Call = { to: `0x${string}`; data: `0x${string}` }

interface Props {
  chainId: ChainId
  address: `0x${string}`
  owner: `0x${string}`
  role: Role

  members?: `0x${string}`[]
  targets?: Target[]
  annotations?: Annotation[]

  appendCalls?: Call[]
  appendComments?: string[]
}

const ApplyUpdates: React.FC<Props> = async ({
  chainId,
  address,
  owner,
  role,
  members,
  targets,
  annotations,
  appendCalls,
  appendComments,
}) => {
  const comments: string[] = []
  const logCall = (log: string) => comments.push(log)

  let calls: { to: `0x${string}`; data: `0x${string}` }[] = []
  try {
    calls = await planApplyRole(
      {
        key: role.key,
        members,
        targets,
        annotations,
      },
      { chainId, address, log: logCall }
    )
  } catch (error) {
    if (error instanceof LicenseError) {
      if (error.status === "BLOCKED") {
        return (
          <Alert title="Subscription expired">
            Permissions updates are blocked. To proceed, renew your Zodiac
            subscription. For support contact us at ops@gnosisguild.org
          </Alert>
        )
      }

      return (
        <Flex direction="column" gap={3}>
          <Alert title="Zodiac OS account required">
            This role is using allowances, a feature requiring a Zodiac OS
            account. Please add the owner of the Roles Modifier to your Zodiac
            OS organization using the button below. Afterwards, reload this page
            to continue.
          </Alert>
          <LinkButton
            primary
            target="_blank"
            href={`https://app.zodiac.eco/create/${error.owner}`}
          >
            Add account to Zodiac OS
          </LinkButton>
        </Flex>
      )
    }
    throw error
  }

  let applyType: "safe" | "governor" | "rethink" = "safe"
  if (await isGovernor(chainId, owner)) applyType = "governor"
  else if (await isRethinkFactory(chainId, owner)) applyType = "rethink"

  return (
    <ApplyUpdateInteractive
      appendCalls={appendCalls}
      appendComments={appendComments}
      initialCalls={calls}
      comments={comments}
      address={address}
      owner={owner}
      roleKey={role.key}
      chainId={chainId}
      applyType={applyType}
    />
  )
}

export default ApplyUpdates
