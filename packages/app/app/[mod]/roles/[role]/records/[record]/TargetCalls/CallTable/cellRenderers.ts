import { invariant } from "@epic-web/invariant"
import {
  _escapeString,
  type ICellRendererComp,
  type ICellRendererParams,
} from "ag-grid-community"
import { NestedArrayValues, Row } from "./types"
import classes from "./style.module.css"

export class NestedValuesRenderer implements ICellRendererComp<Row> {
  eGui!: HTMLDivElement

  className = classes.nestedValues

  init(params: ICellRendererParams<Row, NestedArrayValues>) {
    invariant(params.value != null, "unexpected empty cell value")

    this.eGui = document.createElement("div")
    this.eGui.dataset.span = params.value.span.toString()
    this.eGui.classList.add(this.className)

    const valueFormatter =
      params.formatValue ??
      ((val: any) => (val != null ? val.toString() : undefined))

    const html = this.render(params.value, valueFormatter)
    this.eGui.innerHTML = html
  }

  render(
    value: NestedArrayValues,
    valueFormatter: (value: any | null | undefined) => string | undefined
  ): string {
    if ("value" in value) {
      return this.formatElementValue(value.value, valueFormatter)
    }

    const lis = value.children.map((child) => {
      return (
        `<li data-span="${child.span}">` +
        this.render(child, valueFormatter) +
        `</li>`
      )
    })

    return '<ol start="0">' + lis.join("") + "</ol>"
  }

  // Format the value of an element according to the column definition.
  // ATTENTION: It's crucial to properly escape the value to prevent XSS attacks.
  formatElementValue(
    element: any,
    valueFormatter: (value: any | null | undefined) => string | undefined
  ) {
    const escaped = _escapeString(valueFormatter(element))
    invariant(escaped != null, "unexpected empty formatted value")
    return escaped
  }

  getGui() {
    return this.eGui
  }

  refresh(params: ICellRendererParams): boolean {
    return false
  }
}

export class NestedIndicesRenderer extends NestedValuesRenderer {
  override className = classes.nestedIndices
}

export class RecordedCellRenderer implements ICellRendererComp<Row> {
  eGui!: HTMLDivElement

  className = classes.recorded

  init(params: ICellRendererParams<Row, Row["metadata"]>) {
    this.eGui = document.createElement("div")
    this.eGui.classList.add(this.className)

    this.eGui.innerHTML = this.render(params.value)
  }

  render(metadata: Row["metadata"] | null) {
    const recordedAt = metadata?.recordedAt
    if (!recordedAt) return ""

    const date = new Date(recordedAt)
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
    console.log({ absoluteTime, relativeTime })
    return `<time dateTime="${date.toISOString()}" title="${absoluteTime}">${relativeTime}</time>`
  }

  getGui() {
    return this.eGui
  }

  refresh(params: ICellRendererParams): boolean {
    return false
  }
}
