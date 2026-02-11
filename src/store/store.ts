import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

import CustomizerReducer from "./customizer/CustomizerSlice";
import { xrayApi, xray_slice } from "./slices/xray";
import { discoverApi } from "./slices/discover";

// Client-only store - loaded via dynamic import with ssr: false
// No need for noop storage since this never runs on server
const persistConfig = {
  key: "root",
  storage,
};

const rootReducer = combineReducers({
  customizer: persistReducer<any>(persistConfig, CustomizerReducer),
  xray: persistReducer<any>(persistConfig, xray_slice.reducer),
  [xrayApi.reducerPath]: xrayApi.reducer,
  [discoverApi.reducerPath]: discoverApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(xrayApi.middleware, discoverApi.middleware),
});

// Always create persistor - this file only loads on client side
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof rootReducer>;



