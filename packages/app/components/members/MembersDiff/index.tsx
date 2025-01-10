import { ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import classes from "./style.module.css"
import Box from "@/ui/Box"
import MembersList from "../MembersList"
import { diffMembers } from "./diff"

const MembersDiff: React.FC<{
  left: string[]
  right: string[]
  chainId: ChainId
}> = ({ left, right, chainId }) => {
  const diff = diffMembers(left, right)

  return (
    <Flex direction="row" gap={1}>
      <Box p={3} className={classes.left}>
        <MembersList members={left} diff={diff} chainId={chainId} />
      </Box>
      <Box p={3} className={classes.right}>
        <MembersList members={right} diff={diff} chainId={chainId} />
      </Box>
    </Flex>
  )
}

export default MembersDiff
