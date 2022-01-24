import { configureStore } from "@reduxjs/toolkit"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import { web3Slice } from "./main"

export const REDUX_STORE = configureStore({
  reducer: {
    web3: web3Slice.reducer,
  },
})

export type RootState = ReturnType<typeof REDUX_STORE.getState>
export type AppDispatch = typeof REDUX_STORE.dispatch

export const useRootDispatch = () => useDispatch<AppDispatch>()
export const useRootSelector: TypedUseSelectorHook<RootState> = useSelector
