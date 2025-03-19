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
    return `<time dateTime="${date.toISOString()}" title="${absoluteTime}">${relativeTime}</time>`
  }

  getGui() {
    return this.eGui
  }

  refresh(params: ICellRendererParams): boolean {
    return false
  }
}

export class EditableCellRenderer implements ICellRendererComp<Row> {
  eGui!: HTMLDivElement
  span!: HTMLSpanElement

  className = classes.editable

  init(params: ICellRendererParams<Row, any>) {
    this.eGui = document.createElement("div")
    this.eGui.classList.add(this.className)
    this.span = document.createElement("span")
    this.span.innerText = params.value ?? ""
    this.eGui.appendChild(this.span)

    const editButton = document.createElement("button")
    editButton.classList.add(classes.iconButton)
    editButton.innerHTML = editIconSvg
    editButton.onclick = (ev) => {
      params.api.startEditingCell({
        rowIndex: params.node.rowIndex!,
        colKey: params.colDef!.field!,
      })
    }
    this.eGui.appendChild(editButton)
  }

  getGui() {
    return this.eGui
  }

  refresh(params: ICellRendererParams): boolean {
    this.span.innerText = params.valueFormatted ?? ""
    return true
  }
}

const editIconSvg = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg"><path d="M5 18.89H6.41421L15.7279 9.57627L14.3137 8.16206L5 17.4758V18.89ZM21 20.89H3V16.6473L16.435 3.21231C16.8256 2.82179 17.4587 2.82179 17.8492 3.21231L20.6777 6.04074C21.0682 6.43126 21.0682 7.06443 20.6777 7.45495L9.24264 18.89H21V20.89ZM15.7279 6.74785L17.1421 8.16206L18.5563 6.74785L17.1421 5.33363L15.7279 6.74785Z"></path></svg>`
const deleteIconSvg = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg"><path d="M7 4V2H17V4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7ZM6 6V20H18V6H6ZM9 9H11V17H9V9ZM13 9H15V17H13V9Z"></path></svg>`

export class ActionsCellRenderer implements ICellRendererComp<Row> {
  eGui!: HTMLDivElement

  className = classes.actions

  init(params: ICellRendererParams<Row, any>) {
    this.eGui = document.createElement("div")
    this.eGui.classList.add(this.className)

    this.eGui.innerHTML = `<button class="${classes.iconButton}" title="Remove this call">${deleteIconSvg}</button>`
    this.eGui.querySelector("button")!.onclick = () => {
      if (params.node.rowIndex !== null) {
        params.context.onDelete(params.node.rowIndex)
      }
    }
  }

  getGui() {
    return this.eGui
  }

  refresh(params: ICellRendererParams): boolean {
    return false
  }
}
