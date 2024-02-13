"use client"
import { useState } from "react"
import { RiArrowRightSLine } from "react-icons/ri"
import Flex from "@/ui/Flex"
import classes from "./style.module.css"
import Link from "next/link"
import { parseBytes32String } from "ethers/lib/utils"
import CopyButton from "@/ui/CopyButton"
import { Mod } from "@/app/params"
import LabeledData from "@/ui/LabeledData"

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
    <Flex direction="column" gap={2} className={classes.container}>
      <Flex
        className={classes.header}
        justifyContent="space-between"
        gap={0}
        alignItems="center"
      >
        <h2>Roles</h2>
        <div className={classes.roleFilter}>
          <svg
            viewBox="0 0 61 61"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={classes.magnifyingGlass}
          >
            <path
              d="M58 58L37.2886 37.2886M37.2886 37.2886C40.8174 33.7598 43 28.8848 43 23.5C43 12.7304 34.2696 4 23.5 4C12.7304 4 4 12.7304 4 23.5C4 34.2696 12.7304 43 23.5 43C28.8848 43 33.7598 40.8174 37.2886 37.2886Z"
              strokeWidth="8"
            />
          </svg>
          <input
            type="search"
            placeholder="Filter by role key or member/target address"
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
          />
        </div>
      </Flex>

      <Flex direction="column" gap={2}>
        {matchingRoles.map((role) => {
          const parsedKey = tryParseBytes32String(role.key)
          return (
            <Link
              key={role.key}
              href={`/${mod.chainPrefix}:${
                mod.address
              }/roles/${encodeURIComponent(parsedKey || role.key)}`}
              className={classes.row}
              prefetch={false}
            >
              <Flex direction="column" gap={0} className={classes.roleName}>
                <div className={classes.parsedKey}>{parsedKey}</div>
                <Flex className={classes.key} gap={1} alignItems="center">
                  <code>{role.key}</code>
                  <CopyButton small value={role.key} />
                </Flex>
              </Flex>
              <LabeledData label="Members">{role.members.length}</LabeledData>
              <LabeledData label="Targets">{role.targets.length}</LabeledData>
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
