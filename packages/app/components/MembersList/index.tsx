"use client";
import Address from "../Address";
import { ChainId } from "@/app/chains";
import Flex from "../Flex";

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
