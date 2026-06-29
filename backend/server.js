import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, Room } from './db.js';
import { assignRoles, processNightActions, processVoting, checkVictory } from './gameLogic.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Máy chủ Ma Sói đang hoạt động' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, restrict this to next.js frontend URL
    methods: ['GET', 'POST']
  }
});

const ROLE_LABELS = {
  WEREWOLF: 'Ma Sói',
  SEER: 'Tiên Tri',
  BODYGUARD: 'Bảo Vệ',
  VILLAGER: 'Dân Làng',
  NONE: 'Chưa rõ'
};

const getRoleLabel = (role) => ROLE_LABELS[role] || 'Chưa rõ';

// Connect to MongoDB
connectDB();

/**
 * Helper: Sanitizes room state before sending to a specific player
 * to prevent cheating (hiding roles of other players).
 */
const sanitizeRoomState = (room, playerId) => {
  const roomObj = room.toObject ? room.toObject() : JSON.parse(JSON.stringify(room));
  const viewer = roomObj.players.find(p => p.playerId === playerId);
  
  if (!viewer) return roomObj; // Default fallback

  // If lobby or finished, reveal all roles
  if (roomObj.status === 'LOBBY' || roomObj.status === 'FINISHED') {
    return roomObj;
  }

  // If game is active, hide roles
  roomObj.players = roomObj.players.map(player => {
    // Keep viewer's role
    if (player.playerId === playerId) {
      return player;
    }
    // Dead players have their roles revealed
    if (!player.isAlive) {
      return player;
    }
    // Werewolves can see other werewolves
    if (viewer.role === 'WEREWOLF' && player.role === 'WEREWOLF') {
      return player;
    }
    // Otherwise, obscure role
    return {
      ...player,
      role: 'NONE'
    };
  });

  return roomObj;
};

/**
 * Helper: Emits the correct sanitized room state to each player in the room
 */
const broadcastRoomState = async (roomId) => {
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return;

    // Send personalized room states to each player based on their playerId
    for (const player of room.players) {
      if (player.socketId) {
        const sanitizedState = sanitizeRoomState(room, player.playerId);
        io.to(player.socketId).emit('room_updated', sanitizedState);
      }
    }
  } catch (error) {
    console.error('Error broadcasting room state:', error);
  }
};

// Map to track timers for each room
const activeTimers = new Map();

/**
 * Helper: Manages phase timers and advances phase automatically on timeout
 */
const startPhaseTimer = (roomId, duration, nextPhaseCallback) => {
  if (activeTimers.has(roomId)) {
    clearTimeout(activeTimers.get(roomId));
  }

  let timeLeft = duration;
  
  const tick = () => {
    io.to(roomId).emit('timer_tick', { timeLeft });
    if (timeLeft <= 0) {
      activeTimers.delete(roomId);
      nextPhaseCallback();
    } else {
      timeLeft--;
      const timerId = setTimeout(tick, 1000);
      activeTimers.set(roomId, timerId);
    }
  };

  tick();
};

const clearPhaseTimer = (roomId) => {
  if (activeTimers.has(roomId)) {
    clearTimeout(activeTimers.get(roomId));
    activeTimers.delete(roomId);
  }
};

/**
 * Helper: Removes a player from all other rooms they are currently in.
 * Helps prevent duplicate states if players create or join new rooms on the same connection.
 */
const leaveAllOtherRooms = async (playerId, currentRoomId) => {
  try {
    const otherRooms = await Room.find({ 
      'players.playerId': playerId, 
      roomId: { $ne: currentRoomId } 
    });

    for (const room of otherRooms) {
      const playerIndex = room.players.findIndex(p => p.playerId === playerId);
      if (playerIndex !== -1) {
        if (room.status === 'LOBBY') {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            clearPhaseTimer(room.roomId);
            await Room.deleteOne({ _id: room._id });
            console.log(`Cleaned up empty room ${room.roomId} after player left for another room`);
            continue;
          } else if (room.hostId === playerId) {
            room.hostId = room.players[0].playerId;
          }
          await room.save();
          broadcastRoomState(room.roomId);
        } else {
          // If game is active, just offline them by unsetting socketId
          room.players[playerIndex].socketId = '';
          await room.save();
          broadcastRoomState(room.roomId);
        }
      }
    }
  } catch (error) {
    console.error('Error leaving other rooms:', error);
  }
};

// Socket.io Events
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 1. Create Room
  socket.on('create_room', async ({ username, playerId }, callback) => {
    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Clean up player presence from any other rooms first
      await leaveAllOtherRooms(playerId, roomId);

      const newRoom = new Room({
        roomId,
        status: 'LOBBY',
        hostId: playerId,
        players: [{
          playerId,
          username,
          socketId: socket.id,
          role: 'NONE',
          isAlive: true
        }],
        currentPhase: 'NONE',
        currentTurn: 0
      });

      await newRoom.save();
      socket.join(roomId);
      
      console.log(`Room created: ${roomId} by host: ${username}`);
      
      callback({ success: true, roomId, roomState: sanitizeRoomState(newRoom, playerId) });
    } catch (error) {
      console.error('Create room error:', error);
      callback({ success: false, error: 'Không thể tạo phòng chơi.' });
    }
  });

  // 2. Join Room
  socket.on('join_room', async ({ roomId, username, playerId }, callback) => {
    try {
      const formattedRoomId = roomId.toUpperCase();
      
      // Clean up player presence from any other rooms first
      await leaveAllOtherRooms(playerId, formattedRoomId);

      const room = await Room.findOne({ roomId: formattedRoomId });
      
      if (!room) {
        return callback({ success: false, error: 'Phòng không tồn tại.' });
      }

      if (room.status !== 'LOBBY') {
        return callback({ success: false, error: 'Trò chơi đã bắt đầu.' });
      }

      // Check if player is already in room (handle reconnect/tab refresh)
      let player = room.players.find(p => p.playerId === playerId);
      
      if (player) {
        player.socketId = socket.id;
        player.username = username; // Update username if changed
      } else {
        // Prevent duplicate names in lobby
        const nameExists = room.players.some(p => p.username.toLowerCase() === username.toLowerCase());
        const finalUsername = nameExists ? `${username} (${room.players.length + 1})` : username;
        
        room.players.push({
          playerId,
          username: finalUsername,
          socketId: socket.id,
          role: 'NONE',
          isAlive: true
        });
      }

      await room.save();
      socket.join(room.roomId);

      console.log(`Player ${username} joined room ${room.roomId}`);

      callback({ success: true, roomId: room.roomId, roomState: sanitizeRoomState(room, playerId) });
      
      // Notify other players
      broadcastRoomState(room.roomId);
    } catch (error) {
      console.error('Join room error:', error);
      callback({ success: false, error: 'Có lỗi xảy ra khi vào phòng.' });
    }
  });

  // 3. Start Game
  socket.on('start_game', async ({ roomId, playerId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      if (room.hostId !== playerId) {
        return socket.emit('error_message', 'Chỉ có chủ phòng mới khởi động được game.');
      }

      if (room.players.length < 4) {
        return socket.emit('error_message', 'Tối thiểu cần 4 người chơi để bắt đầu game.');
      }

      // Assign roles
      const playersWithRoles = assignRoles(room.players.map(p => p.toObject()));
      room.players = playersWithRoles;
      room.status = 'PLAYING';
      room.currentPhase = 'NIGHT';
      room.currentTurn = 1;
      room.logs.push({
        turn: 1,
        phase: 'SYSTEM',
        action: 'Trò chơi bắt đầu. Đêm đầu tiên buông xuống.'
      });

      await room.save();

      io.to(roomId).emit('game_started', { roomId });
      broadcastRoomState(roomId);
      
      // Start night phase
      triggerNightPhase(roomId);
    } catch (error) {
      console.error('Start game error:', error);
      socket.emit('error_message', 'Không thể khởi chạy trò chơi.');
    }
  });

  // Helper trigger night phase
  const triggerNightPhase = async (roomId) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      room.currentPhase = 'NIGHT';
      // Reset night actions
      room.players.forEach(p => {
        p.actionTarget = null;
        p.roleActionDone = false;
      });
      await room.save();

      broadcastRoomState(roomId);

      // Setup night timer (e.g. 30 seconds)
      startPhaseTimer(roomId, room.gameSettings.timerNight, () => {
        endNightPhase(roomId);
      });
    } catch (error) {
      console.error('Trigger night phase error:', error);
    }
  };

  // 4. Night Actions
  socket.on('night_action', async ({ roomId, playerId, targetPlayerId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room || room.currentPhase !== 'NIGHT') return;

      const player = room.players.find(p => p.playerId === playerId);
      if (!player || !player.isAlive || player.role === 'VILLAGER') return;
      if (player.roleActionDone) return;

      const target = room.players.find(p => p.playerId === targetPlayerId);
      if (!target || !target.isAlive) return;
      if ((player.role === 'WEREWOLF' || player.role === 'SEER') && target.playerId === playerId) return;
      if (player.role === 'WEREWOLF' && target.role === 'WEREWOLF') return;

      player.actionTarget = targetPlayerId;
      player.roleActionDone = true;

      // Handle Seer custom feedback right away
      if (player.role === 'SEER') {
        socket.emit('seer_result', {
          targetId: targetPlayerId,
          role: target.role === 'WEREWOLF' ? 'WEREWOLF' : 'VILLAGER'
        });
      }

      await room.save();
      broadcastRoomState(roomId);

      // Check if all alive special roles have acted
      const activeSpecialRoles = room.players.filter(p => 
        p.isAlive && 
        p.role !== 'VILLAGER' && 
        !p.roleActionDone
      );

      if (activeSpecialRoles.length === 0) {
        // All acted, end night immediately
        clearPhaseTimer(roomId);
        endNightPhase(roomId);
      }
    } catch (error) {
      console.error('Night action error:', error);
    }
  });

  // End Night Phase
  const endNightPhase = async (roomId) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      const { killedPlayerId, players: nextPlayers } = processNightActions(room.players.map(p => p.toObject()));
      room.players = nextPlayers;

      let logMessage = '';
      if (killedPlayerId) {
        const victim = room.players.find(p => p.playerId === killedPlayerId);
        logMessage = `Đêm qua, ${victim.username} đã bị Ma Sói cắn chết.`;
      } else {
        logMessage = 'Một đêm trôi qua bình yên, không ai chết.';
      }

      room.logs.push({
        turn: room.currentTurn,
        phase: 'NIGHT',
        action: logMessage
      });

      // Check victory
      const winner = checkVictory(room.players);
      if (winner !== 'NONE') {
        room.status = 'FINISHED';
        room.winner = winner;
        room.logs.push({
          turn: room.currentTurn,
          phase: 'SYSTEM',
          action: `Trò chơi kết thúc! Phe ${winner === 'WEREWOLF' ? 'Ma Sói' : 'Dân Làng'} chiến thắng.`
        });
        await room.save();
        broadcastRoomState(roomId);
        return;
      }

      room.currentPhase = 'DAY';
      await room.save();
      broadcastRoomState(roomId);
      
      // Start Day Discussion Phase
      startPhaseTimer(roomId, room.gameSettings.timerDay, () => {
        triggerVotingPhase(roomId);
      });
    } catch (error) {
      console.error('End night phase error:', error);
    }
  };

  // Trigger Voting Phase
  const triggerVotingPhase = async (roomId) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      room.currentPhase = 'VOTING';
      // Reset votes
      room.players.forEach(p => {
        p.hasVoted = false;
        p.voteTarget = null;
      });
      await room.save();
      broadcastRoomState(roomId);

      startPhaseTimer(roomId, room.gameSettings.timerVote, () => {
        endVotingPhase(roomId);
      });
    } catch (error) {
      console.error('Trigger voting phase error:', error);
    }
  };

  // 5. Cast Vote
  socket.on('cast_vote', async ({ roomId, playerId, targetPlayerId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room || room.currentPhase !== 'VOTING') return;

      const player = room.players.find(p => p.playerId === playerId);
      if (!player || !player.isAlive) return;
      if (player.hasVoted) return;

      const target = room.players.find(p => p.playerId === targetPlayerId);
      if (!target || !target.isAlive || target.playerId === playerId) return;

      player.voteTarget = targetPlayerId;
      player.hasVoted = true;

      await room.save();
      broadcastRoomState(roomId);

      // Check if all alive players have voted
      const alivePlayers = room.players.filter(p => p.isAlive);
      const votedCount = alivePlayers.filter(p => p.hasVoted).length;

      if (votedCount === alivePlayers.length) {
        clearPhaseTimer(roomId);
        endVotingPhase(roomId);
      }
    } catch (error) {
      console.error('Cast vote error:', error);
    }
  });

  // End Voting Phase
  const endVotingPhase = async (roomId) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      const { votedOutPlayerId, players: nextPlayers } = processVoting(room.players.map(p => p.toObject()));
      room.players = nextPlayers;

      let logMessage = '';
      if (votedOutPlayerId) {
        const victim = room.players.find(p => p.playerId === votedOutPlayerId);
        logMessage = `Dân làng đã treo cổ ${victim.username} (vai trò: ${getRoleLabel(victim.role)}).`;
      } else {
        logMessage = 'Không có ai bị treo cổ trong ngày hôm nay do số phiếu bằng nhau hoặc không ai vote.';
      }

      room.logs.push({
        turn: room.currentTurn,
        phase: 'VOTING',
        action: logMessage
      });

      // Check victory
      const winner = checkVictory(room.players);
      if (winner !== 'NONE') {
        room.status = 'FINISHED';
        room.winner = winner;
        room.logs.push({
          turn: room.currentTurn,
          phase: 'SYSTEM',
          action: `Trò chơi kết thúc! Phe ${winner === 'WEREWOLF' ? 'Ma Sói' : 'Dân Làng'} chiến thắng.`
        });
        await room.save();
        broadcastRoomState(roomId);
        return;
      }

      // Next Night
      room.currentPhase = 'NIGHT';
      room.currentTurn += 1;
      await room.save();
      broadcastRoomState(roomId);

      triggerNightPhase(roomId);
    } catch (error) {
      console.error('End voting phase error:', error);
    }
  };

  // 6. Chat messages
  socket.on('send_message', async ({ roomId, playerId, text }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      const player = room.players.find(p => p.playerId === playerId);
      if (!player) return;

      const messagePayload = {
        sender: player.username,
        senderId: playerId,
        text,
        phase: room.currentPhase,
        timestamp: new Date()
      };

      // Rules for chat:
      // 1. If player is dead, they can only chat to other dead players (or spectate)
      if (!player.isAlive) {
        room.players.forEach(p => {
          if (!p.isAlive && p.socketId) {
            io.to(p.socketId).emit('receive_message', { ...messagePayload, isDeadChat: true });
          }
        });
        return;
      }

      // 2. If it is Night, only Werewolves can chat with other Werewolves
      if (room.currentPhase === 'NIGHT') {
        if (player.role === 'WEREWOLF') {
          room.players.forEach(p => {
            if (p.role === 'WEREWOLF' && p.isAlive && p.socketId) {
              io.to(p.socketId).emit('receive_message', { ...messagePayload, isWolfChat: true });
            }
          });
        }
        // Villagers, Seer, Bodyguard cannot chat at night
        return;
      }

      // 3. In other phases (DAY, VOTING, LOBBY), everyone alive can chat publicly
      io.to(roomId).emit('receive_message', messagePayload);
    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // 7. Reconnect / Refresh state check
  socket.on('reconnect_check', async ({ roomId, playerId }, callback) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return callback({ success: false });

      const player = room.players.find(p => p.playerId === playerId);
      if (player) {
        player.socketId = socket.id; // Map to new socket id
        await room.save();
        socket.join(roomId);
        callback({ success: true, roomState: sanitizeRoomState(room, playerId) });
        broadcastRoomState(roomId);
      } else {
        callback({ success: false });
      }
    } catch (error) {
      console.error('Reconnect error:', error);
      callback({ success: false });
    }
  });

  // 8. Leave Room
  socket.on('leave_room', async ({ roomId, playerId }, callback) => {
    try {
      const room = await Room.findOne({ roomId });
      if (room) {
        const playerIndex = room.players.findIndex(p => p.playerId === playerId);
        if (playerIndex !== -1) {
          if (room.status === 'LOBBY' || room.status === 'FINISHED') {
            room.players.splice(playerIndex, 1);
            
            if (room.players.length === 0) {
              clearPhaseTimer(room.roomId);
              await Room.deleteOne({ _id: room._id });
              console.log(`Room ${roomId} deleted as it became empty after player left`);
            } else {
              if (room.hostId === playerId) {
                room.hostId = room.players[0].playerId;
              }
              await room.save();
              broadcastRoomState(room.roomId);
              console.log(`Player ${playerId} left lobby/finished room ${roomId}`);
            }
          } else {
            // If active game, just offline them by unsetting socketId
            room.players[playerIndex].socketId = '';
            await room.save();
            broadcastRoomState(room.roomId);
            console.log(`Player ${playerId} marked offline in active room ${roomId}`);
          }
        }
      }
      socket.leave(roomId);
      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Leave room error:', error);
      if (callback) callback({ success: false, error: 'Không thể rời phòng.' });
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const disconnectedSocketId = socket.id;
    try {
      const rooms = await Room.find({ 'players.socketId': disconnectedSocketId });
      for (const room of rooms) {
        const playerIndex = room.players.findIndex(p => p.socketId === disconnectedSocketId);
        if (playerIndex !== -1) {
          const player = room.players[playerIndex];
          
          if (room.status === 'LOBBY') {
            // Delayed check to allow reconnection on refresh (lobby only)
            const targetPlayerId = player.playerId;
            const targetRoomId = room.roomId;
            
            setTimeout(async () => {
              try {
                const currentRoom = await Room.findOne({ roomId: targetRoomId });
                if (!currentRoom || currentRoom.status !== 'LOBBY') return;
                
                const currentPlayer = currentRoom.players.find(p => p.playerId === targetPlayerId);
                // If the player still has the disconnected socketId, it means they did not reconnect
                if (currentPlayer && currentPlayer.socketId === disconnectedSocketId) {
                  const idx = currentRoom.players.findIndex(p => p.playerId === targetPlayerId);
                  if (idx !== -1) {
                    currentRoom.players.splice(idx, 1);
                    
                    if (currentRoom.players.length === 0) {
                      clearPhaseTimer(currentRoom.roomId);
                      await Room.deleteOne({ _id: currentRoom._id });
                      console.log(`Room ${targetRoomId} deleted as empty after player disconnect timeout`);
                      return;
                    } else if (currentRoom.hostId === targetPlayerId) {
                      currentRoom.hostId = currentRoom.players[0].playerId;
                    }
                    
                    await currentRoom.save();
                    broadcastRoomState(currentRoom.roomId);
                    console.log(`Player ${currentPlayer.username} removed from room ${targetRoomId} after disconnect timeout`);
                  }
                }
              } catch (err) {
                console.error('Error in delayed disconnect handling:', err);
              }
            }, 3000); // 3-second grace period
            
          } else {
            // If game is active, just unset socketId, keep player as alive/dead (can reconnect)
            player.socketId = '';
            await room.save();
            broadcastRoomState(room.roomId);
          }
        }
      }
    } catch (error) {
      console.error('Disconnect handling error:', error);
    }
  });
});

// Run server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
