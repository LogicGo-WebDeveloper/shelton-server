import axiosInstance from "../config/axios.config.js";

const getAllLiveMatches = async (sport) => {
  const { data } = await axiosInstance.get(`/api/v1/sport/${sport}/events/live`);
  return data;
};

const getSportList = async (timezoneOffset = 0) => {
    const { data } = await axiosInstance.get(`/api/v1/sport/${timezoneOffset}/event-count`);
    return data;
  };

export default {
    getAllLiveMatches,
    getSportList,
};