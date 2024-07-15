import axios from "axios";
import axiosInstance from "../../config/axios.config.js";
import https from "https";

const getFavouriteList = async (sport) => {
  const { data } = await axiosInstance.get(
    `/api/v1/config/follow-suggestions/teams/IN`
  );

  return data.teams;
};

export default {
  getFavouriteList,
};
