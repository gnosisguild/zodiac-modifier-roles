import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import Address from "@/ui/Address"
import classes from "./style.module.css"
import Box from "@/ui/Box"
import { DiffFlag } from "@/components/permissions/types"

const MembersList: React.FC<{
  members: string[]
  chainId: ChainId
  diff?: Map<string, DiffFlag.Added | DiffFlag.Removed>
}> = ({ members, chainId, diff }) => {
  const sorted = members.map((member) => member.toLowerCase()).sort()

  return (
    <Flex direction="column" gap={1}>
      {sorted.map((member) => (
        <Box
          key={member}
          bg={diff?.get(member) ? false : true}
          p={2}
          className={
            diff?.get(member) &&
            classes[DiffFlag[diff.get(member)!].toLowerCase()]
          }
        >
          <Address
            chainId={chainId}
            address={member}
            explorerLink
            copyToClipboard
            displayFull
          />
        </Box>
      ))}

      {members.length === 0 && <i className={classes.empty}>No members</i>}
    </Flex>
  )
}

export default MembersList
