import type { Namespace } from 'socket.io';
import PlayerModel from '../models/Player';

interface LobbyClientToServer {
  join_room: (payload: { roomId: string; playerName: string }) => void;
}

interface LobbyServerToClient {
  player_joined: (payload: { player: { id: string; name: string }; players: { id: string; name: string }[] }) => void;
  player_left: (payload: { socketId: string }) => void;
  error: (payload: { message: string }) => void;
}

type LobbyNamespace = Namespace<LobbyClientToServer, LobbyServerToClient>;

function registerLobbySocket(nsp: LobbyNamespace): void {
  nsp.on('connection', (socket) => {
    const { roomId } = socket.handshake.query as { roomId?: string };
    if (roomId) socket.join(roomId);

    socket.on('join_room', async ({ roomId: rid, playerName }) => {
      try {
        const trimmed = playerName.trim();
        let player = await PlayerModel.findByRoomAndName(rid, trimmed);
        if (!player) {
          player = await PlayerModel.create(rid, trimmed);
        }
        await PlayerModel.setSocket(player.id, socket.id);
        socket.join(rid);

        const players = await PlayerModel.findByRoom(rid);
        const mapped = players.map((p) => ({ id: p.id, name: p.name }));
        nsp.to(rid).emit('player_joined', { player: { id: player.id, name: player.name }, players: mapped });
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('disconnect', () => {
      if (roomId) {
        nsp.to(roomId).emit('player_left', { socketId: socket.id });
      }
    });
  });
}

export default registerLobbySocket;
