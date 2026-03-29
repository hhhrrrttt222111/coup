import axios from 'axios';
import type { Player, PlayerCard } from '../types';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/api`,
});

api.interceptors.request.use((config) => {
  const playerId = sessionStorage.getItem('playerId');
  if (playerId) {
    config.headers['X-Player-Id'] = playerId;
  }
  return config;
});

export async function getPlayer(id: string): Promise<Player> {
  const { data } = await api.get<Player>(`/players/${encodeURIComponent(id)}`);
  return data;
}

export async function getPlayerCards(id: string): Promise<PlayerCard[]> {
  const { data } = await api.get<PlayerCard[]>(`/players/${encodeURIComponent(id)}/cards`);
  return data;
}
