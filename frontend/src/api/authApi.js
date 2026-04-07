import axios from "axios";

const API_BASE = "/api/auth";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export async function loginUser(username, password) {
  const { data } = await api.post("/login", { username, password });
  return data;
}

export async function registerUser(username, password) {
  const { data } = await api.post("/register", { username, password });
  return data;
}
