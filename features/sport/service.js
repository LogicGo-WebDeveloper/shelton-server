import axios from "axios";
import axiosInstance from "../../config/axios.config.js";
import https from "https";

const getCountryLeagueList = async (sport) => {
  const { data } = await axiosInstance.get(`/api/v1/sport/${sport}/categories`);

  return data.categories;
};

const getSportList = async (timezoneOffset = 0) => {
  const { data } = await axiosInstance.get(
    `/api/v1/sport/${timezoneOffset}/event-count`
  );

  return data;
};

const getAllScheduleMatches = async (sport, date) => {
  const { data } = await axiosInstance.get(
    `/api/v1/sport/${sport}/scheduled-events/${date}`
  );
  return data;
};

const getLeagueTournamentList = async (id) => {
  const { data } = await axiosInstance.get(
    `/api/v1/category/${id}/unique-tournaments`
  );

  return data.groups?.[0]?.uniqueTournaments ?? [];
};

const getSportNews = async () => {
  return new Promise((resolve, reject) => {
    const options = {
      method: "GET",
      hostname: "cricket-news-api.p.rapidapi.com",
      port: null,
      path: "/cricnews/cricbuzz",
      headers: {
        "x-rapidapi-key": "154f0cfa94msh016c007cc0914a5p11dc9ejsnafb4aef8861f",
        "x-rapidapi-host": "cricket-news-api.p.rapidapi.com",
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        try {
          // Check if the response is JSON
          if (
            res.headers["content-type"] &&
            res.headers["content-type"].includes("application/json")
          ) {
            const json = JSON.parse(body);
            resolve(json);
          } else {
            console.error(
              "Invalid content-type. Expected application/json but received:",
              res.headers["content-type"]
            );
            reject(new Error("Invalid content-type"));
          }
        } catch (error) {
          console.error("Error parsing JSON response:", error);
          reject(new Error("Invalid JSON response"));
        }
      });

      res.on("error", (error) => {
        console.error("Error fetching sport news:", error);
        reject(error);
      });
    });

    req.end();
  });
};

export default {
  getCountryLeagueList,
  getSportList,
  getAllScheduleMatches,
  getLeagueTournamentList,
  getSportNews,
};
