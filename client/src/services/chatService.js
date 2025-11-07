import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ChatService {
  async sendMessage(message) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, { message });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getUniversityInfo() {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/info`);
      return response.data;
    } catch (error) {
      console.error('Error getting university info:', error);
      throw error;
    }
  }

  async getSchedule(group, day = null) {
    try {
      const params = { group };
      if (day) params.day = day;
      const response = await axios.get(`${API_BASE_URL}/schedule`, { params });
      return response.data;
    } catch (error) {
      console.error('Error getting schedule:', error);
      throw error;
    }
  }

  async getEvents(category = null, limit = null) {
    try {
      const params = {};
      if (category) params.category = category;
      if (limit) params.limit = limit;
      const response = await axios.get(`${API_BASE_URL}/events`, { params });
      return response.data;
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  }

  async createApplication(data) {
    try {
      const response = await axios.post(`${API_BASE_URL}/applications`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  }

  async getApplicationTypes() {
    try {
      const response = await axios.get(`${API_BASE_URL}/applications/types`);
      return response.data;
    } catch (error) {
      console.error('Error getting application types:', error);
      throw error;
    }
  }
}

export default new ChatService();
