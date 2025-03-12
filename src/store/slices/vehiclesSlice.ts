import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from '../types';
import { Vehicle } from '../types';
import { getDB } from '../../utils/db';

interface VehiclesState {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
}

const initialState: VehiclesState = {
  vehicles: [],
  loading: false,
  error: null,
};

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setVehicles: (state, action: PayloadAction<Vehicle[]>) => {
      state.vehicles = action.payload;
    },
    updateVehicle: (state, action: PayloadAction<Vehicle>) => {
      const index = state.vehicles.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.vehicles[index] = action.payload;
      }
    },
  },
});

export const { setLoading, setError, setVehicles, updateVehicle } = vehiclesSlice.actions;

export const loadVehicles = (): AppThunk => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const db = await getDB();
    const vehicles = await db.getAll('vehicles');
    dispatch(setVehicles(vehicles));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to load vehicles'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateVehicleData = (vehicle: Vehicle): AppThunk => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const db = await getDB();
    await db.put('vehicles', vehicle);
    dispatch(updateVehicle(vehicle));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to update vehicle'));
  } finally {
    dispatch(setLoading(false));
  }
};

export default vehiclesSlice.reducer; 