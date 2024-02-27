"use client"

import { Fragment, ReactNode, useState } from "react"
import { Switch as HeadlessSwitch } from "@headlessui/react"
import { MdCheck } from "react-icons/md"
import { MdClear } from "react-icons/md"
import classNames from "classnames"

import classes from "./style.module.css"

type Props = {
  label?: ReactNode
  checked: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}

const Switch: React.FC<Props> = ({ label, checked, onChange, disabled }) => {
  // re-enable when we want to add editing
  // const [, setChecked] = useState(false)
  return (
    <HeadlessSwitch checked={checked} onChange={() => {}} as={Fragment}>
      {({ checked }) => (
        <button
          className={classNames(classes.switch, disabled && classes.disabled)}
        >
          <div
            className={classNames(
              classes.knobCase,
              checked && classes.checkedKnobCase
            )}
          >
            <div
              className={classNames(
                classes.knob,
                checked && classes.checkedKnob
              )}
            >
              {checked ? <MdCheck /> : <MdClear />}
            </div>
          </div>
          <div>{label}</div>
        </button>
      )}
    </HeadlessSwitch>
  )
}

export default Switch
