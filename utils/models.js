import axios from "axios";
import { config } from "dotenv";

config();

export const getModels = async () => {
  const response = await axios.get(
    `https://api.openai.com/${process.env.OPENAI_VER}/models`,
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );
  return response.data;
};
