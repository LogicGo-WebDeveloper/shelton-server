import axios from "axios";
import config from "./config.js";

let apiUrl;
let headers = {};

if ((config.sofascore.apiMode === "free")) {
  apiUrl = config.sofascore.freeUrl;
} else {
  apiUrl = config.sofascore.paidUrl;
  headers = {
    "X-RapidAPI-Key": config.sofascore.apiKey,
    "X-RapidAPI-Host": "sportapi7.p.rapidapi.com",
    'Host': 'sportapi7.p.rapidapi.com'
  };
}

const axiosInstance = axios.create({
  baseURL: apiUrl,
  headers: headers,
});

export default axiosInstance;
