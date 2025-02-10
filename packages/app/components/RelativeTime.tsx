import React from "react"

export interface Props {
  value: string | number | Date
}

export function RelativeTime({ value }: Props) {
  const date = new Date(value)
  const now = new Date()
  const diffSeconds = (date.getTime() - now.getTime()) / 1000

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  let relativeTime: string

  const absDiffSeconds = Math.abs(diffSeconds)
  if (absDiffSeconds < 60) {
    // For differences smaller than a minute.
    relativeTime = rtf.format(Math.round(diffSeconds), "seconds")
  } else if (absDiffSeconds < 3600) {
    // For differences smaller than an hour.
    relativeTime = rtf.format(Math.round(diffSeconds / 60), "minutes")
  } else if (absDiffSeconds < 86400) {
    // For differences smaller than a day.
    relativeTime = rtf.format(Math.round(diffSeconds / 3600), "hours")
  } else {
    // For differences in days (or larger).
    relativeTime = rtf.format(Math.round(diffSeconds / 86400), "days")
  }

  // Use the browser's locale to display the absolute date and time.
  const absoluteTime = date.toLocaleString()

  return (
    <time dateTime={date.toISOString()} title={absoluteTime}>
      {relativeTime}
    </time>
  )
}
