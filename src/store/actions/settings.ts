import { createAsyncThunk } from '@reduxjs/toolkit';
import { Settings } from '../../types/settings';
import { RootState } from '../reducers';

export const loadSettings = createAsyncThunk(
  'settings/load',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      return await response.json() as Settings;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateSettings = createAsyncThunk(
  'settings/update',
  async (settings: Settings, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      return await response.json() as Settings;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
); 