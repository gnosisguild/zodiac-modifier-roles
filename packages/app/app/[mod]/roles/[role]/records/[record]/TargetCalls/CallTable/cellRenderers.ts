import { invariant } from "@epic-web/invariant"
import {
  _escapeString,
  type ICellRendererComp,
  type ICellRendererParams,
} from "ag-grid-community"
import { NestedArrayValues, Row } from "./types"

export class NestedValuesRenderer implements ICellRendererComp<Row> {
  eGui!: HTMLDivElement

  init(params: ICellRendererParams<Row, NestedArrayValues>) {
    invariant(params.value != null, "unexpected empty cell value")

    this.eGui = document.createElement("div")
    this.eGui.dataset.span = params.value.span.toString()

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
