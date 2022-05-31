import { configureStore } from "@reduxjs/toolkit"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import { rolesAppSlice } from "./main/rolesSlice"
import { web3Slice } from "./main/web3Slice"

export const REDUX_STORE = configureStore({
  reducer: {
    web3: web3Slice.reducer,
    rolesApp: rolesAppSlice.reducer,
  },
})

export type RootState = ReturnType<typeof REDUX_STORE.getState>
export type AppDispatch = typeof REDUX_STORE.dispatch

export const useRootDispatch = () => useDispatch<AppDispatch>()
export const useRootSelector: TypedUseSelectorHook<RootState> = useSelector
