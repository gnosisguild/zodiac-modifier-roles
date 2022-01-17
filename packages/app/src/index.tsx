import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App/App";
import { Provider as ReduxProvider } from 'react-redux'
import { REDUX_STORE } from "./store";

ReactDOM.render(
  <React.StrictMode>
    <ReduxProvider store={REDUX_STORE}>
      <App />
    </ReduxProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
