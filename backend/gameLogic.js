/**
 * Game logic functions for Werewolf Game
 */

export const REQUIRED_PLAYER_COUNT = 8;
export const FIXED_ROLE_DECK = [
  'WEREWOLF',
  'WEREWOLF',
  'SEER',
  'WITCH',
  'BODYGUARD',
  'VILLAGER',
  'VILLAGER',
  'VILLAGER'
];

/**
 * Assign the fixed eight-player role deck.
 */
export const assignRoles = (players) => {
  if (players.length !== REQUIRED_PLAYER_COUNT) {
    throw new Error(`Cần đúng ${REQUIRED_PLAYER_COUNT} người chơi để bắt đầu game.`);
  }

  const rolesPool = [...FIXED_ROLE_DECK];

  // Shuffle roles using Fisher-Yates
  for (let i = rolesPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolesPool[i], rolesPool[j]] = [rolesPool[j], rolesPool[i]];
  }

  return players.map((player, index) => ({
    ...player,
    role: rolesPool[index],
    isAlive: true,
    hasVoted: false,
    voteTarget: null,
    actionTarget: null,
    roleActionDone: false,
    witchHealUsed: false,
    witchPoisonUsed: false,
    witchHealTarget: null,
    witchPoisonTarget: null
  }));
};

export const getWerewolfTargetId = (players) => {
  const werewolves = players.filter(player => player.role === 'WEREWOLF' && player.isAlive);
  if (werewolves.length === 0) return null;

  const allWerewolvesChose = werewolves.every(player => player.roleActionDone || player.actionTarget);
  if (!allWerewolvesChose) return null;

  const targetCounts = {};
  werewolves.forEach(player => {
    if (player.actionTarget) {
      targetCounts[player.actionTarget] = (targetCounts[player.actionTarget] || 0) + 1;
    }
  });

  let maxVotes = 0;
  let candidates = [];
  Object.entries(targetCounts).forEach(([targetId, votes]) => {
    if (votes > maxVotes) {
      maxVotes = votes;
      candidates = [targetId];
    } else if (votes === maxVotes) {
      candidates.push(targetId);
    }
  });

  return candidates.length === 1 ? candidates[0] : null;
};

/**
 * Process actions taken during the night.
 * - Werewolves select a target to kill.
 * - Bodyguard can block the werewolf attack.
 * - Witch can save the werewolf victim and poison another player.
 * - Returns every killed player id and the updated players list.
 */
export const processNightActions = (players) => {
  const updatedPlayers = players.map(p => ({ ...p }));
  
  // Find bodyguard target
  const bodyguard = updatedPlayers.find(p => p.role === 'BODYGUARD' && p.isAlive);
  const protectedPlayerId = bodyguard ? bodyguard.actionTarget : null;

  const witch = updatedPlayers.find(p => p.role === 'WITCH' && p.isAlive);
  const werewolfTargetId = getWerewolfTargetId(updatedPlayers);
  const wasSavedByWitch = Boolean(
    werewolfTargetId
    && witch?.witchHealTarget === werewolfTargetId
    && witch.witchHealUsed
  );
  const killedPlayerIds = [];

  if (werewolfTargetId && werewolfTargetId !== protectedPlayerId && !wasSavedByWitch) {
    const victim = updatedPlayers.find(p => p.playerId === werewolfTargetId);
    if (victim?.isAlive) {
      victim.isAlive = false;
      killedPlayerIds.push(victim.playerId);
    }
  }

  if (witch?.witchPoisonTarget && witch.witchPoisonUsed) {
    const poisonVictim = updatedPlayers.find(p => p.playerId === witch.witchPoisonTarget);
    if (poisonVictim?.isAlive) {
      poisonVictim.isAlive = false;
      if (!killedPlayerIds.includes(poisonVictim.playerId)) {
        killedPlayerIds.push(poisonVictim.playerId);
      }
    }
  }

  // Clear night action targets for the next round
  updatedPlayers.forEach(p => {
    p.actionTarget = null;
    p.roleActionDone = false;
    p.witchHealTarget = null;
    p.witchPoisonTarget = null;
  });

  return {
    killedPlayerId: killedPlayerIds[0] || null,
    killedPlayerIds,
    werewolfTargetId,
    wasSavedByWitch,
    players: updatedPlayers
  };
};

/**
 * Process public voting at the end of the day.
 * - Calculates who has the most votes.
 * - If there is a tie or no votes, no one is killed.
 * - Returns the id of the voted out player (or null) and updated players list.
 */
export const processVoting = (players) => {
  const updatedPlayers = players.map(p => ({ ...p }));
  const eligiblePlayers = updatedPlayers.filter(p => p.isAlive);
  const playersById = new Map(updatedPlayers.map(p => [p.playerId, p]));
  const voteCounts = {};
  const ballots = eligiblePlayers.map(p => {
    const target = p.voteTarget ? playersById.get(p.voteTarget) : null;

    if (target) {
      voteCounts[p.voteTarget] = (voteCounts[p.voteTarget] || 0) + 1;
    }

    return {
      voterPlayerId: p.playerId,
      voterUsername: p.username,
      targetPlayerId: target?.playerId || null,
      targetUsername: target?.username || null
    };
  });
  const totalVotes = ballots.filter(ballot => ballot.targetPlayerId).length;

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

  const tallies = eligiblePlayers
    .map(player => ({
      playerId: player.playerId,
      username: player.username,
      votes: voteCounts[player.playerId] || 0
    }))
    .sort((a, b) => b.votes - a.votes || a.username.localeCompare(b.username, 'vi'));

  const voteResult = {
    ballots,
    tallies,
    totalVotes,
    eligibleVoters: eligiblePlayers.length,
    votedOutPlayerId,
    votedOutUsername: votedOutPlayerId ? playersById.get(votedOutPlayerId)?.username || null : null,
    isTie: totalVotes > 0 && candidates.length > 1
  };

  // Reset vote states for next round
  updatedPlayers.forEach(p => {
    p.hasVoted = false;
    p.voteTarget = null;
  });

  return { votedOutPlayerId, players: updatedPlayers, voteResult };
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
export const checkVictory = (players, currentTurn = 1, currentPhase = 'NIGHT') => {
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

  // 3. Max duration rule: Game ends after 4 nights. If wolves haven't won after voting on Day 4, Villagers win!
  if (currentTurn >= 4 && currentPhase === 'VOTING') {
    return 'VILLAGER';
  }
  
  // Fallback max duration
  if (currentTurn > 4) {
    return 'VILLAGER';
  }

  return 'NONE';
};
