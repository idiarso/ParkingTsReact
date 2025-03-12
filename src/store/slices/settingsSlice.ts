import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from '../types';
import { Settings, ParkingRate } from '../types';
import { getDB } from '../../utils/db';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: null,
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Settings>) => {
      state.settings = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateSettingsState: (state, action: PayloadAction<Partial<Settings>>) => {
      if (state.settings) {
        const currentSettings = state.settings;
        const updates = action.payload;

        // Create a new settings object with required fields
        const newSettings = {
          maxCapacity: updates.maxCapacity ?? currentSettings.maxCapacity,
          enableOvernight: updates.enableOvernight ?? currentSettings.enableOvernight,
          operatingHours: updates.operatingHours ?? currentSettings.operatingHours,
          parkingRates: updates.parkingRates ?? currentSettings.parkingRates,
          openingTime: updates.openingTime ?? currentSettings.openingTime,
          closingTime: updates.closingTime ?? currentSettings.closingTime,
        } satisfies Settings;

        state.settings = newSettings;
      }
    },
  },
});

export const { setSettings, setLoading, setError, updateSettingsState } = settingsSlice.actions;

export const loadSettings = (): AppThunk => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const db = await getDB();
    const settings = await db.get('settings', 'current');
    if (settings) {
      dispatch(setSettings(settings));
    }
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to load settings'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateSettings = (updates: Partial<Settings>): AppThunk => async (dispatch, getState) => {
  try {
    dispatch(setLoading(true));
    const db = await getDB();
    const currentSettings = getState().settings.settings;
    
    if (!currentSettings) {
      throw new Error('Settings not initialized');
    }

    const updatedSettings: Settings = {
      ...currentSettings,
      ...updates,
    };

    await db.put('settings', updatedSettings);
    dispatch(setSettings(updatedSettings));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to update settings'));
  } finally {
    dispatch(setLoading(false));
  }
};

export default settingsSlice.reducer; 