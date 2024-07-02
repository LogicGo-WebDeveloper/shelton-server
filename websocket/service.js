import axiosInstance from "../config/axios.config.js";

const getAllLiveMatches = async (sport) => {
  const { data } = await axiosInstance.get(`/api/v1/sport/${sport}/events/live`);
  return data;
};

const getSportList = async (timezoneOffset = 0) => {
    const { data } = await axiosInstance.get(`/api/v1/sport/${timezoneOffset}/event-count`);
    return data;
};

const getLiveMatch = async (matchId) => {
    const { data } = await axiosInstance.get(`/api/v1/event/${matchId}`);
    return data;
};

const getScorecard = async (matchId) => {
    const { data } = await axiosInstance.get(`/api/v1/event/${matchId}/innings`);
    return data;
};

const getSquad = async (matchId) => {
    const { data } = await axiosInstance.get(`/api/v1/event/${matchId}/lineups`);
    return data;
};

const getOvers = async (matchId) => {
    const { data } = await axiosInstance.get(`/api/v1/event/${matchId}/incidents`);
    return data;
};

const getMatches = async (customId) => {
    const { data } = await axiosInstance.get(`/api/v1/event/${customId}/h2h/events`);
    return data;
};

const getVotes = async (matchId) => {
    const { data } = await axiosInstance.get(`/api/v1/event/${matchId}/votes`);
    return data;
};

const getStandings = async (matchId) => {
    const { data } = await axiosInstance.get(`/api/v1/event/${matchId}/standings`);
    return data;
};

export default {
    getAllLiveMatches,
    getSportList,
    getLiveMatch,
    getScorecard,
    getSquad,
    getOvers,
    getMatches,
    getVotes,
    getStandings
};