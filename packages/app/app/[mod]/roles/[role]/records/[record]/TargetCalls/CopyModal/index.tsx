import { useState } from "react"
import * as Headless from "@headlessui/react"
import Flex from "@/ui/Flex"
import Button from "@/ui/Button"
import classes from "./style.module.css"

export const useCopyModal = () => {
  const [isOpen, setIsOpen] = useState(false)

  return {
    modal: <CopyModal open={isOpen} onClose={() => setIsOpen(false)} />,
    open: () => setIsOpen(true),
  }
}

const CopyModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const copy = () => {
    throw new Error("Not implemented")
  }

  return (
    <Headless.Dialog open={open} onClose={onClose}>
      <Headless.DialogBackdrop transition className={classes.backdrop} />
      <div className={classes.wrapper}>
        <div className={classes.container}>
          <Headless.DialogPanel transition className={classes.panel}>
            <Flex direction="column" gap={4}>
              <p>
                You don't have write access. Ask the author to invite you as
                collaborator or create a copy of this page to edit it for your
                own purposes.
              </p>

              <Flex gap={2}>
                <Button onClick={() => onClose()}>Cancel</Button>
                <Button primary onClick={copy}>
                  Copy
                </Button>
              </Flex>
            </Flex>
          </Headless.DialogPanel>
        </div>
      </div>
    </Headless.Dialog>
  )
}
