/**
 * Game logic functions for Werewolf Game
 */

/**
 * Assign roles to players based on the player count.
 * Roles: WEREWOLF, SEER, BODYGUARD, VILLAGER
 */
export const assignRoles = (players, hostId = null) => {
  const playingPlayers = hostId ? players.filter(p => p.playerId !== hostId) : players;
  const count = playingPlayers.length;
  if (count < 4) {
    throw new Error('Tối thiểu cần 4 người chơi (không tính Chủ phòng) để bắt đầu game.');
  }

  // Determine role counts
  let werewolfCount = 1;
  let seerCount = 1;
  let bodyguardCount = 1;

  if (count >= 6) {
    werewolfCount = 2;
  }
  if (count >= 9) {
    werewolfCount = 3;
  }

  const villagerCount = count - werewolfCount - seerCount - bodyguardCount;

  // Build pool of roles
  const rolesPool = [];
  for (let i = 0; i < werewolfCount; i++) rolesPool.push('WEREWOLF');
  for (let i = 0; i < seerCount; i++) rolesPool.push('SEER');
  for (let i = 0; i < bodyguardCount; i++) rolesPool.push('BODYGUARD');
  for (let i = 0; i < villagerCount; i++) rolesPool.push('VILLAGER');

  // Shuffle roles using Fisher-Yates
  for (let i = rolesPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolesPool[i], rolesPool[j]] = [rolesPool[j], rolesPool[i]];
  }

  // Assign to players
  let poolIdx = 0;
  return players.map((player) => {
    if (hostId && player.playerId === hostId) {
      return {
        ...player,
        role: 'HOST',
        isAlive: false,
        hasVoted: false,
        voteTarget: null,
        actionTarget: null,
        roleActionDone: true
      };
    }
    const role = rolesPool[poolIdx++];
    return {
      ...player,
      role,
      isAlive: true,
      hasVoted: false,
      voteTarget: null,
      actionTarget: null,
      roleActionDone: false
    };
  });
};

/**
 * Process actions taken during the night.
 * - Werewolves select a target to kill.
 * - Bodyguard selects a target to protect.
 * - Returns the id of the killed player (or null) and updated players list.
 */
export const processNightActions = (players) => {
  const updatedPlayers = players.map(p => ({ ...p }));
  
  // Find bodyguard target
  const bodyguard = updatedPlayers.find(p => p.role === 'BODYGUARD' && p.isAlive);
  const protectedPlayerId = bodyguard ? bodyguard.actionTarget : null;

  // Find werewolf targets
  const werewolves = updatedPlayers.find(p => p.role === 'WEREWOLF' && p.isAlive);
  
  let targetCounts = {};
  updatedPlayers.forEach(p => {
    if (p.role === 'WEREWOLF' && p.isAlive && p.actionTarget) {
      targetCounts[p.actionTarget] = (targetCounts[p.actionTarget] || 0) + 1;
    }
  });

  // Find the target with maximum votes from werewolves
  let werewolfTargetId = null;
  let maxVotes = 0;
  for (const [targetId, votes] of Object.entries(targetCounts)) {
    if (votes > maxVotes) {
      maxVotes = votes;
      werewolfTargetId = targetId;
    }
  }

  let killedPlayerId = null;
  
  // If werewolves picked someone and they are not protected by bodyguard, they die
  if (werewolfTargetId && werewolfTargetId !== protectedPlayerId) {
    const victim = updatedPlayers.find(p => p.playerId === werewolfTargetId);
    if (victim && victim.isAlive) {
      victim.isAlive = false;
      killedPlayerId = werewolfTargetId;
    }
  }

  // Clear night action targets for the next round
  updatedPlayers.forEach(p => {
    p.actionTarget = null;
    p.roleActionDone = false;
  });

  return { killedPlayerId, players: updatedPlayers };
};

/**
 * Process public voting at the end of the day.
 * - Calculates who has the most votes.
 * - If there is a tie or no votes, no one is killed.
 * - Returns the id of the voted out player (or null) and updated players list.
 */
export const processVoting = (players) => {
  const updatedPlayers = players.map(p => ({ ...p }));
  
  const voteCounts = {};
  let totalVotes = 0;

  updatedPlayers.forEach(p => {
    if (p.isAlive && p.voteTarget) {
      voteCounts[p.voteTarget] = (voteCounts[p.voteTarget] || 0) + 1;
      totalVotes++;
    }
  });

  if (totalVotes === 0) {
    return { votedOutPlayerId: null, players: updatedPlayers };
  }

  // Find max votes
  let maxVotes = 0;
  let candidates = [];

  for (const [targetId, votes] of Object.entries(voteCounts)) {
    if (votes > maxVotes) {
      maxVotes = votes;
      candidates = [targetId];
    } else if (votes === maxVotes) {
      candidates.push(targetId);
    }
  }

  let votedOutPlayerId = null;

  // Kill the player only if there is a clear majority (no tie)
  if (candidates.length === 1 && maxVotes > 0) {
    votedOutPlayerId = candidates[0];
    const victim = updatedPlayers.find(p => p.playerId === votedOutPlayerId);
    if (victim) {
      victim.isAlive = false;
    }
  }

  // Reset vote states for next round
  updatedPlayers.forEach(p => {
    p.hasVoted = false;
    p.voteTarget = null;
  });

  return { votedOutPlayerId, players: updatedPlayers };
};

/**
 * Check if the game has ended and determine the winner.
 * Custom Rule:
 * - Werewolves win if:
 *   (1) Dead villagers/town players >= 2 AND aliveVillagers <= aliveWolves
 *   (2) OR aliveVillagers === 0
 * - Villagers win if:
 *   (1) Werewolf count === 0
 *   (2) OR currentTurn >= 4 (Max 4 nights / After 3 nights if wolves haven't won, Villagers win!)
 * Returns 'WEREWOLF', 'VILLAGER', or 'NONE'
 */
export const checkVictory = (players, currentTurn = 1) => {
  const alivePlayers = players.filter(p => p.isAlive && p.role !== 'HOST');
  const aliveWolves = alivePlayers.filter(p => p.role === 'WEREWOLF').length;
  const aliveVillagers = alivePlayers.filter(p => p.role !== 'WEREWOLF').length;

  // Count dead villagers (non-host, non-werewolf players who are dead)
  const deadVillagerCount = players.filter(p => p.role !== 'HOST' && p.role !== 'WEREWOLF' && !p.isAlive).length;

  // 1. Villagers win if all werewolves are dead
  if (aliveWolves === 0) {
    return 'VILLAGER';
  }

  // 2. Werewolves win if killed at least 2 villagers AND alive villagers <= alive wolves (or 0 villagers)
  if ((deadVillagerCount >= 2 && aliveVillagers <= aliveWolves) || aliveVillagers === 0) {
    return 'WEREWOLF';
  }

  // 3. Max duration rule: Game ends after 4 nights (when turn > 4). If wolves haven't won after 4 nights, Villagers win!
  if (currentTurn > 4) {
    return 'VILLAGER';
  }

  return 'NONE';
};
