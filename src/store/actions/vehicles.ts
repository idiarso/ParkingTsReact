import { AppThunk } from '../types';
import { setVehicles, setLoading, setError } from '../reducers/vehiclesReducer';
import '../types/electron';

export const loadVehicles = (): AppThunk => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const db = await window.electronAPI.getDB();
    const vehicles = await db.getAllVehicles();
    dispatch(setVehicles(vehicles));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to load vehicles'));
  }
}; 