"use client"
import { useState } from "react"
import { RiArrowRightSLine } from "react-icons/ri"
import Flex from "@/ui/Flex"
import { LinkButton } from "@/ui/Button"
import { useRouter } from "next/navigation"
import { IconLinkButton } from "@/ui/IconButton"
import classes from "./style.module.css"
import Link from "next/link"
import { parseBytes32String } from "ethers/lib/utils"

interface RoleSummary {
  key: string
  members: `0x${string}`[]
  targets: `0x${string}`[]
}

const RolesList: React.FC<{ roles: readonly RoleSummary[]; mod: string }> = ({
  roles,
  mod,
}) => {
  const router = useRouter()
  const [query, setQuery] = useState("")

  return (
    <Flex direction="column" gap={2}>
      <input
        type="search"
        placeholder="Filter by role key or member/target address"
        value={query}
        onChange={(ev) => setQuery(ev.target.value)}
      />

      <Flex direction="column" gap={0}>
        {roles.map((role) => {
          const parsedKey = parseBytes32String(role.key)
          return (
            <Link
              key={role.key}
              href={`/${mod}/roles/${encodeURIComponent(parsedKey)}`}
              className={classes.row}
            >
              <div className={classes.key}>{parsedKey}</div>
              <div className={classes.members}>
                {role.members.length} Members
              </div>
              <div className={classes.targets}>
                {role.targets.length} Targets
              </div>
              <div className={classes.meta}>
                <RiArrowRightSLine />
              </div>
            </Link>
          )
        })}
      </Flex>
    </Flex>
  )
}

export default RolesList
