import { invariant } from "@epic-web/invariant"
import {
  _escapeString,
  type ICellRendererComp,
  type ICellRendererParams,
} from "ag-grid-community"
import { Row } from "./types"

type PrimitiveCellValue = string | number | boolean | bigint
// type ArrayCellValue = PrimitiveCellValue[]

export interface NestedCellValue {
  value: PrimitiveCellValue[] | NestedCellValue[]
  span: number[]
  totalSpan: number
}

// export interface NestedCellValue {
//   value: PrimitiveCellValue[] | ArrayCellValue[]
//   span: number[]
//   totalSpan: number
// }

export class NestedCellRenderer implements ICellRendererComp<Row> {
  eGui!: HTMLDivElement

  init(params: ICellRendererParams<Row, NestedCellValue>) {
    invariant(params.value != null, "unexpected empty cell value")

    this.eGui = document.createElement("div")
    this.eGui.dataset.span = params.value.totalSpan.toString()

    const html = this.renderValues(
      params.value.value.map((element) =>
        this.formatElementValue(element, params)
      ),
      params.value.span
    )
    this.eGui.innerHTML = html
  }

  render(
    value: NestedCellValue,
    params: ICellRendererParams<Row, NestedCellValue>
  ) {
    const isNested =
      Array.isArray(value.value) &&
      value.value.length > 0 &&
      !Array.isArray(value.value[0])

    if (!isNested) {
      if (Array.isArray(value.value)) {
        return (
          '<ol start="0">' +
          value.value
            .map((element) => `<li data-span="1">${element}</li>`)
            .join("") +
          "</ol>"
        )
      } else {
        return this.formatElementValue(value.value, params)
      }
    }

    // is nested
    return (
      '<ol start="0">' +
      value
        .map((element) => `<li data-span="${span}">${element}</li>`)
        .join("") +
      "</ol>"
    )
  }

  renderNested(elements: string[], span: number[]) {}

  renderPrimitive(elements: string[], span: number[]) {
    return (
      '<ol start="0">' +
      elements
        .map((element) => `<li data-span="${span}">${element}</li>`)
        .join("") +
      "</ol>"
    )
  }

  renderValues(elements: string[], span: number[]) {
    return (
      '<ol start="0">' +
      elements
        .map((element) => `<li data-span="${span}">${element}</li>`)
        .join("") +
      "</ol>"
    )
  }

  formatElementValue(
    element: any,
    params: ICellRendererParams<Row, NestedCellValue>
  ) {
    const valueFormatter =
      typeof params.colDef?.valueFormatter === "function"
        ? params.colDef?.valueFormatter
        : (val: any) => val.toString()

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

interface ArrayElements {
  value: any[]
  span: number[]
  totalSpan: number
}

/** Renders (nested) array elements as a lists. */
// export class ArrayElementsRenderer implements ICellRendererComp<Row> {
//   eGui!: HTMLDivElement

//   init(params: ICellRendererParams<Row, ArrayElements[]>) {
//     params.invariant(Array.isArray(params.value), "Expected array")

//     this.eGui = document.createElement("div")
//     // this.eGui.setAttribute("start", "0")

//     const ols = params.value.map((indices) =>
//       this.renderArray(indices.value.map(String), indices.span)
//     )
//     const html = this.renderArray(
//       ols,
//       ols.map((_, i) => i)
//     )

//     this.eGui.innerHTML = html
//   }

//   renderArray(elements: string[], span: number[]) {
//     return (
//       '<ol start="0">' +
//       elements
//         .map((element) => `<li data-span="${span}">${element}</li>`)
//         .join("") +
//       "</ol>"
//     )
//   }

//   getGui() {
//     return this.eGui
//   }

//   refresh(params: ICellRendererParams): boolean {
//     return false
//   }
// }
