"use client";
import { ChainId } from "@/app/chains";
import Flex from "@/ui/Flex";
import Address from "@/ui/Address";

const MembersList: React.FC<{ members: string[]; chainId: ChainId }> = ({
  members,
  chainId,
}) => {
  return (
    <Flex direction="column" gap={1}>
      {members.map((member) => (
        <Address
          chainId={chainId}
          key={member}
          address={member}
          explorerLink
          copyToClipboard
        />
      ))}
    </Flex>
  );
};

export default MembersList;
