import { useState } from "react"
import * as Headless from "@headlessui/react"
import { useParams, useRouter } from "next/navigation"
import Flex from "@/ui/Flex"
import Button from "@/ui/Button"
import classes from "./style.module.css"
import { serverCreateCopy } from "../serverActions"

export const useCopyModal = () => {
  const [isOpen, setIsOpen] = useState(false)

  return {
    modal: <CopyModal open={isOpen} onClose={() => setIsOpen(false)} />,
    open: () => setIsOpen(true),
  }
}

const CopyModal: React.FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { mod, role, record } = useParams<{
    mod: string
    role: string
    record: string
  }>()
  const router = useRouter()

  const copy = async () => {
    setIsLoading(true)
    const copy = await serverCreateCopy({ recordId: record })
    router.push(
      `/${mod}/roles/${role}/records/${copy.id}/auth/${copy.authToken}`
    )
  }

  return (
    <Headless.Dialog open={open} onClose={isLoading ? () => {} : onClose}>
      <Headless.DialogBackdrop transition className={classes.backdrop} />
      <div className={classes.wrapper}>
        <div className={classes.container}>
          <Headless.DialogPanel transition className={classes.panel}>
            <Flex direction="column" gap={4}>
              <p>
                You don't have permission to edit this page. To make changes,
                ask the author to invite you as a collaborator, or create a copy
                to edit it separately.
              </p>

              <Flex gap={2}>
                <Button disabled={isLoading} onClick={() => onClose()}>
                  Cancel
                </Button>
                <Button disabled={isLoading} primary onClick={copy}>
                  {isLoading ? "Creating copy..." : "Create Copy"}
                </Button>
              </Flex>
            </Flex>
          </Headless.DialogPanel>
        </div>
      </div>
    </Headless.Dialog>
  )
}
