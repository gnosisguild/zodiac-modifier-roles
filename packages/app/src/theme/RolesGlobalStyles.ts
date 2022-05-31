import { createGlobalStyle } from "styled-components"

export const RolesGlobalStyles = createGlobalStyle`
  :root {
    --scrollbarWidth: 0;
  }
  a {
    text-decoration: none;
  }
  body:before {
    position: fixed;
  }
`
