"use client"
import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import Address from "@/ui/Address"
import classes from "./style.module.css"
import Box from "@/ui/Box"

const MembersList: React.FC<{ members: string[]; chainId: ChainId }> = ({
  members,
  chainId,
}) => {
  return (
    <Flex direction="column" gap={1}>
      {members.map((member) => (
        <Box key={member} bg p={2}>
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
