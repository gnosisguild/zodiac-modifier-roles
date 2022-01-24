import React from "react"
import ReactDOM from "react-dom"
import { ThemeProvider } from "styled-components"
import { CssBaseline, ThemeProvider as MUIThemeProvider } from "@material-ui/core"
import { theme as gnosisTheme } from "@gnosis.pm/safe-react-components"
import App from "./components/App"
import { ZodiacStyle } from "./theme/ZodiacStyle"
import { ZODIAC_THEME } from "./theme/ZodiacTheme"
import { Provider as ReduxProvider } from "react-redux"
import { REDUX_STORE } from "./store"
import SafeProvider from "@gnosis.pm/safe-apps-react-sdk"

const Main = () => {
  return (
    <MUIThemeProvider theme={ZODIAC_THEME}>
      <ThemeProvider theme={gnosisTheme}>
        <CssBaseline />
        <ZodiacStyle />
        <SafeProvider>
          <ReduxProvider store={REDUX_STORE}>
            <App />
          </ReduxProvider>
        </SafeProvider>
      </ThemeProvider>
    </MUIThemeProvider>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
  document.getElementById("root"),
)
