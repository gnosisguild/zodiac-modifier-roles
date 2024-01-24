"use client"
import { useState } from "react"
import { RiArrowRightSLine } from "react-icons/ri"
import Flex from "@/ui/Flex"
import classes from "./style.module.css"
import Link from "next/link"
import { parseBytes32String } from "ethers/lib/utils"
import CopyButton from "@/ui/CopyButton"
import { Mod } from "@/app/params"

interface RoleSummary {
  key: string
  members: `0x${string}`[]
  targets: `0x${string}`[]
}

const tryParseBytes32String = (str: string) => {
  try {
    return parseBytes32String(str)
  } catch (err) {
    return null
  }
}

const RolesList: React.FC<{ roles: readonly RoleSummary[]; mod: Mod }> = ({
  roles,
  mod,
}) => {
  const [query, setQuery] = useState("")
  const trimmedQuery = query.trim().toLowerCase()

  const matchingRoles = trimmedQuery
    ? roles.filter((role) =>
        [
          role.key,
          tryParseBytes32String(role.key) || "",
          ...role.members,
          ...role.targets,
        ].some((str) => str.toLowerCase().includes(trimmedQuery))
      )
    : roles

  let emptyMessage = ""
  if (roles.length === 0) {
    emptyMessage = "No roles have been created yet."
  } else if (matchingRoles.length === 0) {
    emptyMessage = "There's no role matching your query."
  }

  return (
    <Flex direction="column" gap={2}>
      <input
        type="search"
        placeholder="Filter by role key or member/target address"
        value={query}
        onChange={(ev) => setQuery(ev.target.value)}
      />

      <Flex direction="column" gap={0}>
        {matchingRoles.map((role) => {
          const parsedKey = tryParseBytes32String(role.key)
          return (
            <Link
              key={role.key}
              href={`/${mod.chainPrefix}:${
                mod.address
              }/roles/${encodeURIComponent(parsedKey || role.key)}`}
              className={classes.row}
            >
              <div className={classes.parseKey}>{parsedKey}</div>
              <Flex className={classes.key} gap={1}>
                <code>{role.key}</code>
                <CopyButton small value={role.key} />
              </Flex>
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
        {emptyMessage && <div className={classes.empty}>{emptyMessage}</div>}
      </Flex>
    </Flex>
  )
}

export default RolesList
