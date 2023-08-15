"use client";
import { useState } from "react";
import { RiArrowRightSLine } from "react-icons/ri";
import Flex from "../Flex";
import { LinkButton } from "../Button";
import { useRouter } from "next/navigation";
import { IconLinkButton } from "../IconButton";
import classes from "./style.module.css";
import Link from "next/link";

interface RoleSummary {
  key: string;
  members: `0x${string}`[];
  targets: `0x${string}`[];
}

const RolesTable: React.FC<{ roles: RoleSummary[]; mod: string }> = ({
  roles,
  mod,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <Flex direction="column" gap={2}>
      <input
        type="search"
        placeholder="Filter by role key or member/target address"
        value={query}
        onChange={(ev) => setQuery(ev.target.value)}
      />

      <Flex direction="column" gap={0}>
        {roles.map((role) => (
          <Link
            key={role.key}
            href={`/${mod}/roles/${role.key}`}
            className={classes.row}
          >
            <div className={classes.key}>{role.key}</div>
            <div className={classes.members}>{role.members.length} Members</div>
            <div className={classes.targets}>{role.targets.length} Targets</div>
            <div className={classes.meta}>
              <RiArrowRightSLine />
            </div>
          </Link>
        ))}
      </Flex>
    </Flex>
  );
};

export default RolesTable;
