"use client"
import { useState } from "react"
import * as Headless from "@headlessui/react"
import { Interface } from "ethers"
import { rolesAbi, ChainId } from "zodiac-roles-sdk"
import Flex from "@/ui/Flex"
import Button from "@/ui/Button"
import { parseCalls } from "./parseCalls"
import {
  MORPHO_BUNDLER3,
  MORPHO_BUNDLER_ADAPTER,
  MORPHO_BUNDLER_SELECTOR,
} from "./const"
import classes from "./style.module.css"

type Call = { to: `0x${string}`; data: `0x${string}` }

interface Props {
  open: boolean
  onClose: () => void
  onAppend: (calls: Call[]) => void
  address: `0x${string}`
  chainId: ChainId
}

const rolesInterface = new Interface(rolesAbi)

function encodeMorphoBundlerUnwrapper(
  rolesModifier: `0x${string}`,
  chainId: ChainId
): string | null {
  const bundler = MORPHO_BUNDLER3[chainId]
  if (!bundler) return null

  return JSON.stringify(
    {
      to: rolesModifier,
      data: rolesInterface.encodeFunctionData("setTransactionUnwrapper", [
        bundler,
        MORPHO_BUNDLER_SELECTOR,
        MORPHO_BUNDLER_ADAPTER,
      ]),
    },
    null,
    2
  )
}

const AppendCallsModal: React.FC<Props> = ({
  open,
  onClose,
  onAppend,
  address,
  chainId,
}) => {
  const [value, setValue] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const reset = () => {
    setValue("")
    setErrorMessage("")
  }

  const handleChange = (text: string) => {
    setValue(text)
    if (!text.trim()) {
      setErrorMessage("")
      return
    }
    try {
      parseCalls(text)
      setErrorMessage("")
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Invalid input")
    }
  }

  const handleAppend = () => {
    try {
      const calls = parseCalls(value)
      onAppend(calls)
      reset()
      onClose()
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Invalid input")
    }
  }

  const handleCancel = () => {
    reset()
    onClose()
  }

  const morphoPreset = encodeMorphoBundlerUnwrapper(address, chainId)
  const isValid = value.trim() !== "" && errorMessage === ""

  return (
    <Headless.Dialog open={open} onClose={handleCancel}>
      <Headless.DialogBackdrop transition className={classes.backdrop} />
      <div className={classes.wrapper}>
        <div className={classes.container}>
          <Headless.DialogPanel transition className={classes.panel}>
            <Flex direction="column" gap={3}>
              <h5>Append additional calls</h5>
              <p style={{ fontSize: 12, opacity: 0.7 }}>
                Paste a Safe Transaction Builder JSON, an array of{" "}
                {"{to, data}"} objects, or a single {"{to, data}"} object.
              </p>
              {morphoPreset && (
                <Flex gap={2}>
                  <Button
                    className={classes.presetButton}
                    onClick={() => handleChange(morphoPreset)}
                  >
                    Enable MorphoBundlerUnwrapper
                  </Button>
                </Flex>
              )}
              <textarea
                className={classes.textarea}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder='[{"to": "0x...", "data": "0x..."}]'
              />
              {errorMessage && (
                <div className={classes.error}>{errorMessage}</div>
              )}
              <Flex gap={2}>
                <Button onClick={handleCancel}>Cancel</Button>
                <Button primary onClick={handleAppend} disabled={!isValid}>
                  Append
                </Button>
              </Flex>
            </Flex>
          </Headless.DialogPanel>
        </div>
      </div>
    </Headless.Dialog>
  )
}

export default AppendCallsModal
