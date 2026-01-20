import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getUserCanvases = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/api/canvas/list/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user canvases:", error);
    throw error;
  }
};

export const getCanvasById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/canvas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching canvas ${id}:`, error);
    throw error;
  }
};
