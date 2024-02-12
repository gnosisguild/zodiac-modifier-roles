"use client"
import cn from "classnames"
import copy from "copy-to-clipboard"
import React from "react"
import { RiExternalLinkLine, RiFileCopyLine } from "react-icons/ri"

import Blockie from "../Blockie"
import Box from "../Box"
import IconButton, { IconLinkButton } from "../IconButton"

import classes from "./style.module.css"
import { getAddress } from "viem"
import { CHAINS, ChainId } from "@/app/chains"
import Flex from "../Flex"

interface Props {
  address: string
  explorerLink?: boolean
  displayFull?: boolean
  chainId?: ChainId
  copyToClipboard?: boolean
  className?: string
  blockieClassName?: string
  addressClassName?: string
}

const VISIBLE_START = 5
const VISIBLE_END = 5

export const shortenAddress = (address: string): string => {
  const checksumAddress = getAddress(address)
  const start = checksumAddress.substring(0, VISIBLE_START + 2)
  const end = checksumAddress.substring(42 - VISIBLE_END, 42)
  return `${start}...${end}`
}

const Address: React.FC<Props> = ({
  address,
  chainId,
  explorerLink,
  copyToClipboard,
  displayFull,
  className,
  blockieClassName,
  addressClassName,
}) => {
  const explorer =
    explorerLink && chainId && CHAINS[chainId]?.blockExplorers.default

  const checksumAddress = getAddress(address)
  const displayAddress = displayFull
    ? checksumAddress
    : shortenAddress(checksumAddress)

  return (
    <Flex
      className={cn(className, classes.container)}
      gap={2}
      alignItems="center"
    >
      <Box rounded className={cn(classes.blockieContainer, blockieClassName)}>
        {address && <Blockie address={address} className={classes.blockies} />}
      </Box>
      <div
        className={cn(classes.address, addressClassName)}
        title={checksumAddress}
      >
        {displayAddress}
      </div>
      {(copyToClipboard || explorerLink) && (
        <Flex gap={0} alignItems="center">
          {copyToClipboard && (
            <IconButton
              title="Copy to clipboard"
              onClick={() => {
                copy(checksumAddress)
              }}
            >
              <RiFileCopyLine />
            </IconButton>
          )}
          {explorer && (
            <IconLinkButton
              href={`${explorer.url}/search?q=${address}`}
              target="_blank"
              className={classes.link}
              title={`View on ${explorer.name}`}
              rel="noreferrer"
            >
              <RiExternalLinkLine />
            </IconLinkButton>
          )}
        </Flex>
      )}
    </Flex>
  )
}

export default Address
