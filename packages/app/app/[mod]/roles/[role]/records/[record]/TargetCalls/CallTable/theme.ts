import "./theme.css"

import { colorSchemeDarkWarm, themeBalham } from "ag-grid-community"

export const theme = themeBalham.withPart(colorSchemeDarkWarm).withParams({
  cellFontFamily: "var(--font-mono)",
})
