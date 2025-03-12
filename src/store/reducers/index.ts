import { combineReducers } from '@reduxjs/toolkit';
import settingsReducer from './settingsReducer';
import parkingSessionsReducer from './parkingSessionsReducer';
import vehiclesReducer from './vehiclesReducer';

const rootReducer = combineReducers({
  settings: settingsReducer,
  parkingSessions: parkingSessionsReducer,
  vehicles: vehiclesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer; 