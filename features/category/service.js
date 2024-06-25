import axios from 'axios';

const getAllTournamentsByCategory = async (id, headers) => {
  const url = `https://www.sofascore.com/api/v1/category/${id}/unique-tournaments`;
  const response = await axios.get(url, { headers });
  console.log("response", response)
  return response.data;
};

export default {
  getAllTournamentsByCategory,
};