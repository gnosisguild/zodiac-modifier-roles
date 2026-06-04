"use client"

import { useState } from "react"
import classes from "./style.module.css"

const NOTICE_URL = "https://x.com/zodiaceco/status/2061862711206502902"

/**
 * The dismissable warning banner. Dismissal is in-memory only, so it reappears
 * on reload — the notice should keep nagging until the setup is remediated.
 */
export default function Banner({
  status,
  affectedCount,
  remediationUrl,
}: {
  status: "affected" | "incomplete"
  affectedCount: number
  remediationUrl: string
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) {
    return null
  }

  return (
    <div role="alert" className={classes.banner}>
      <div className={classes.content}>
        <span className={classes.icon} aria-hidden>
          ⚠️
        </span>
        <span className={classes.headline}>
          Security update: a vulnerability affects Zodiac Roles Modifier v2 and
          Delay Modifier v1.1.0 in specific setups.
        </span>
        {status === "affected" ? (
          <span>
            This Roles modifier is affected — {affectedCount} Safe
            {affectedCount === 1 ? "" : "s"} reachable through it still need
            {affectedCount === 1 ? "s" : ""} action.{" "}
            <a href={remediationUrl} className={classes.action}>
              Review &amp; remediate
            </a>
          </span>
        ) : (
          <span>
            We couldn&apos;t fully check this Roles modifier — its status is
            unknown.{" "}
            <a href={remediationUrl} className={classes.action}>
              Open the checker
            </a>
          </span>
        )}
        <a
          href={NOTICE_URL}
          target="_blank"
          rel="noreferrer noopener"
          className={classes.action}
        >
          Read the full notice
        </a>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className={classes.dismiss}
      >
        ✕
      </button>
    </div>
  )
}
