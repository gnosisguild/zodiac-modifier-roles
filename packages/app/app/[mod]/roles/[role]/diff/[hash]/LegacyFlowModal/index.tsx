"use client"
import { useState } from "react"
import * as Headless from "@headlessui/react"
import Flex from "@/ui/Flex"
import Button from "@/ui/Button"
import CopyButton from "@/ui/CopyButton"
import classes from "./style.module.css"

const UPSTREAM_MERGE_STEPS = `git remote add upstream https://github.com/gnosisguild/permissions-starter-kit.git
git fetch upstream
git checkout upstream/main -- .lib/scripts/sync-template.mjs
node .lib/scripts/sync-template.mjs`

/**
 * Shown when permissions were pushed through the Roles app's legacy flow.
 * Until the flow is switched off (`dismissable`), users can click it away and
 * proceed as before. After that, the modal blocks the page for good.
 */
const LegacyFlowModal: React.FC<{ dismissable: boolean }> = ({
  dismissable,
}) => {
  const [open, setOpen] = useState(true)

  return (
    <Headless.Dialog
      open={open}
      onClose={dismissable ? () => setOpen(false) : () => {}}
    >
      <Headless.DialogBackdrop transition className={classes.backdrop} />
      <div className={classes.wrapper}>
        <div className={classes.container}>
          <Headless.DialogPanel transition className={classes.panel}>
            <Flex direction="column" gap={4}>
              <Headless.DialogTitle className={classes.title}>
                <span className={classes.warningIcon}>&#x26A0;</span> Pushing
                permissions through the Roles app is being sunset
              </Headless.DialogTitle>

              <p>
                You pushed these permissions through the Roles app&apos;s legacy
                flow.{" "}
                {dismissable ? (
                  <>
                    Starting <strong>August 15, 2026</strong>, this flow will no
                    longer be available.
                  </>
                ) : (
                  <>
                    Since <strong>August 15, 2026</strong>, this flow is no
                    longer available.
                  </>
                )}
              </p>

              <p>To continue managing your permissions:</p>

              <ul className={classes.instructions}>
                <li>
                  Update your project to{" "}
                  <a
                    href="https://www.npmjs.com/package/zodiac-roles-sdk"
                    target="_blank"
                    rel="noreferrer"
                  >
                    zodiac-roles-sdk v4
                  </a>
                </li>
                <li>
                  or if you based your project off the{" "}
                  <a
                    href="https://github.com/gnosisguild/permissions-starter-kit"
                    target="_blank"
                    rel="noreferrer"
                  >
                    permissions starter kit
                  </a>
                  , run through these steps:
                  <div className={classes.codeBlock}>
                    <pre>{UPSTREAM_MERGE_STEPS}</pre>
                    <div className={classes.copyButton}>
                      <CopyButton value={UPSTREAM_MERGE_STEPS} />
                    </div>
                  </div>
                </li>
              </ul>

              {dismissable && (
                <Flex gap={2} justifyContent="end">
                  <Button onClick={() => setOpen(false)}>
                    Continue anyway
                  </Button>
                </Flex>
              )}
            </Flex>
          </Headless.DialogPanel>
        </div>
      </div>
    </Headless.Dialog>
  )
}

export default LegacyFlowModal
