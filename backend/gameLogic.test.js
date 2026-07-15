import { describe, it, expect } from 'vitest';
import {
  assignRoles,
  checkVictory,
  FIXED_ROLE_DECK,
  getWerewolfTargetId,
  processNightActions,
  processVoting
} from './gameLogic.js';

const makeEightPlayers = () => Array.from({ length: 8 }, (_, index) => ({
  playerId: String(index + 1),
  username: `Người chơi ${index + 1}`
}));

const makeNightPlayers = ({
  wolfOneTarget = '6',
  wolfTwoTarget = '6',
  guardTarget = '3',
  healTarget = null,
  poisonTarget = null
} = {}) => [
  { playerId: '1', username: 'Sói 1', role: 'WEREWOLF', isAlive: true, actionTarget: wolfOneTarget, roleActionDone: true },
  { playerId: '2', username: 'Sói 2', role: 'WEREWOLF', isAlive: true, actionTarget: wolfTwoTarget, roleActionDone: true },
  { playerId: '3', username: 'Tiên Tri', role: 'SEER', isAlive: true, actionTarget: '1', roleActionDone: true },
  {
    playerId: '4',
    username: 'Phù Thủy',
    role: 'WITCH',
    isAlive: true,
    actionTarget: null,
    roleActionDone: true,
    witchHealUsed: Boolean(healTarget),
    witchPoisonUsed: Boolean(poisonTarget),
    witchHealTarget: healTarget,
    witchPoisonTarget: poisonTarget
  },
  { playerId: '5', username: 'Bảo Vệ', role: 'BODYGUARD', isAlive: true, actionTarget: guardTarget, roleActionDone: true },
  { playerId: '6', username: 'Dân 1', role: 'VILLAGER', isAlive: true, actionTarget: null, roleActionDone: false },
  { playerId: '7', username: 'Dân 2', role: 'VILLAGER', isAlive: true, actionTarget: null, roleActionDone: false },
  { playerId: '8', username: 'Dân 3', role: 'VILLAGER', isAlive: true, actionTarget: null, roleActionDone: false }
];

describe('Game Logic Tests', () => {
  describe('assignRoles', () => {
    it('requires exactly eight players', () => {
      expect(() => assignRoles(makeEightPlayers().slice(0, 7))).toThrow(
        'Cần đúng 8 người chơi để bắt đầu game.'
      );
      expect(() => assignRoles([...makeEightPlayers(), { playerId: '9', username: 'Người chơi 9' }])).toThrow(
        'Cần đúng 8 người chơi để bắt đầu game.'
      );
    });

    it('randomly assigns the fixed eight-player deck', () => {
      const assigned = assignRoles(makeEightPlayers());

      expect(assigned).toHaveLength(8);
      expect(assigned.map(player => player.role).sort()).toEqual([...FIXED_ROLE_DECK].sort());
      assigned.forEach(player => {
        expect(player.isAlive).toBe(true);
        expect(player.hasVoted).toBe(false);
        expect(player.voteTarget).toBeNull();
        expect(player.actionTarget).toBeNull();
        expect(player.roleActionDone).toBe(false);
        expect(player.witchHealUsed).toBe(false);
        expect(player.witchPoisonUsed).toBe(false);
      });
    });
  });

  describe('werewolf target', () => {
    it('requires every living wolf to finish choosing', () => {
      const players = makeNightPlayers();
      players[1].actionTarget = null;
      players[1].roleActionDone = false;

      expect(getWerewolfTargetId(players)).toBeNull();
    });

    it('returns no target when the two wolves split their votes', () => {
      expect(getWerewolfTargetId(makeNightPlayers({ wolfTwoTarget: '7' }))).toBeNull();
    });
  });

  describe('processNightActions', () => {
    it('kills the shared werewolf target when nobody saves them', () => {
      const { killedPlayerIds, players } = processNightActions(makeNightPlayers());

      expect(killedPlayerIds).toEqual(['6']);
      expect(players.find(player => player.playerId === '6').isAlive).toBe(false);
    });

    it('kills nobody when the two wolves split their votes', () => {
      const { killedPlayerIds } = processNightActions(makeNightPlayers({ wolfTwoTarget: '7' }));

      expect(killedPlayerIds).toEqual([]);
    });

    it('lets the bodyguard block the werewolf attack', () => {
      const { killedPlayerIds, players } = processNightActions(makeNightPlayers({ guardTarget: '6' }));

      expect(killedPlayerIds).toEqual([]);
      expect(players.find(player => player.playerId === '6').isAlive).toBe(true);
    });

    it('lets the Witch heal the werewolf victim', () => {
      const { killedPlayerIds, wasSavedByWitch, players } = processNightActions(
        makeNightPlayers({ healTarget: '6' })
      );
      const witch = players.find(player => player.role === 'WITCH');

      expect(killedPlayerIds).toEqual([]);
      expect(wasSavedByWitch).toBe(true);
      expect(players.find(player => player.playerId === '6').isAlive).toBe(true);
      expect(witch.witchHealUsed).toBe(true);
      expect(witch.witchHealTarget).toBeNull();
    });

    it('lets the Witch poison a living player through protection', () => {
      const { killedPlayerIds, players } = processNightActions(
        makeNightPlayers({ guardTarget: '6', poisonTarget: '7' })
      );

      expect(killedPlayerIds).toEqual(['7']);
      expect(players.find(player => player.playerId === '7').isAlive).toBe(false);
    });

    it('supports using both potions in the same night', () => {
      const { killedPlayerIds, players } = processNightActions(
        makeNightPlayers({ healTarget: '6', poisonTarget: '7' })
      );

      expect(killedPlayerIds).toEqual(['7']);
      expect(players.find(player => player.playerId === '6').isAlive).toBe(true);
      expect(players.find(player => player.playerId === '7').isAlive).toBe(false);
    });

    it('can resolve one werewolf death and one poison death in the same night', () => {
      const { killedPlayerIds } = processNightActions(
        makeNightPlayers({ poisonTarget: '7' })
      );

      expect(killedPlayerIds).toEqual(['6', '7']);
    });
  });

  describe('processVoting', () => {
    it('records a tied public ballot without eliminating anyone', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: true, voteTarget: '4', hasVoted: true },
        { playerId: '2', username: 'Tiên Tri', role: 'SEER', isAlive: true, voteTarget: '4', hasVoted: true },
        { playerId: '3', username: 'Bảo Vệ', role: 'BODYGUARD', isAlive: true, voteTarget: '1', hasVoted: true },
        { playerId: '4', username: 'Dân', role: 'VILLAGER', isAlive: true, voteTarget: '1', hasVoted: true }
      ];

      const { votedOutPlayerId, players: nextPlayers, voteResult } = processVoting(players);

      expect(votedOutPlayerId).toBeNull();
      expect(nextPlayers.every(player => player.isAlive)).toBe(true);
      expect(voteResult.isTie).toBe(true);
      expect(voteResult.totalVotes).toBe(4);
      expect(voteResult.ballots).toEqual(expect.arrayContaining([
        expect.objectContaining({ voterPlayerId: '1', targetPlayerId: '4' }),
        expect.objectContaining({ voterPlayerId: '4', targetPlayerId: '1' })
      ]));
      expect(voteResult.tallies.find(tally => tally.playerId === '1').votes).toBe(2);
      expect(voteResult.tallies.find(tally => tally.playerId === '4').votes).toBe(2);
    });

    it('eliminates the only player with the most votes', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: true, voteTarget: '4', hasVoted: true },
        { playerId: '2', username: 'Tiên Tri', role: 'SEER', isAlive: true, voteTarget: '4', hasVoted: true },
        { playerId: '3', username: 'Bảo Vệ', role: 'BODYGUARD', isAlive: true, voteTarget: '4', hasVoted: true },
        { playerId: '4', username: 'Dân', role: 'VILLAGER', isAlive: true, voteTarget: '1', hasVoted: true }
      ];

      const { votedOutPlayerId, players: nextPlayers, voteResult } = processVoting(players);

      expect(votedOutPlayerId).toBe('4');
      expect(nextPlayers.find(player => player.playerId === '4').isAlive).toBe(false);
      expect(voteResult.votedOutUsername).toBe('Dân');
      expect(voteResult.tallies[0]).toEqual(expect.objectContaining({ playerId: '4', votes: 3 }));
    });

    it('records living players who did not vote before the timer ended', () => {
      const players = [
        { playerId: '1', username: 'An', role: 'WEREWOLF', isAlive: true, voteTarget: '2', hasVoted: true },
        { playerId: '2', username: 'Bình', role: 'VILLAGER', isAlive: true, voteTarget: null, hasVoted: false },
        { playerId: '3', username: 'Chi', role: 'VILLAGER', isAlive: false, voteTarget: null, hasVoted: false }
      ];

      const { voteResult } = processVoting(players);

      expect(voteResult.eligibleVoters).toBe(2);
      expect(voteResult.totalVotes).toBe(1);
      expect(voteResult.ballots.find(ballot => ballot.voterPlayerId === '2')).toEqual(
        expect.objectContaining({ targetPlayerId: null, targetUsername: null })
      );
    });
  });

  describe('checkVictory', () => {
    it('returns VILLAGER if all werewolves are dead', () => {
      const players = [
        { playerId: '1', role: 'WEREWOLF', isAlive: false },
        { playerId: '2', role: 'VILLAGER', isAlive: true }
      ];
      expect(checkVictory(players, 1)).toBe('VILLAGER');
    });

    it('returns WEREWOLF after at least two town deaths when wolves reach parity', () => {
      const players = [
        { playerId: '1', role: 'WEREWOLF', isAlive: true },
        { playerId: '2', role: 'VILLAGER', isAlive: false },
        { playerId: '3', role: 'VILLAGER', isAlive: false },
        { playerId: '4', role: 'VILLAGER', isAlive: true }
      ];
      expect(checkVictory(players, 2)).toBe('WEREWOLF');
    });

    it('returns VILLAGER if the game exceeds four nights', () => {
      const players = [
        { playerId: '1', role: 'WEREWOLF', isAlive: true },
        { playerId: '2', role: 'VILLAGER', isAlive: true },
        { playerId: '3', role: 'VILLAGER', isAlive: true },
        { playerId: '4', role: 'VILLAGER', isAlive: false }
      ];
      expect(checkVictory(players, 5)).toBe('VILLAGER');
    });

    it('returns NONE while the game is still active', () => {
      const players = [
        { playerId: '1', role: 'WEREWOLF', isAlive: true },
        { playerId: '2', role: 'VILLAGER', isAlive: true },
        { playerId: '3', role: 'VILLAGER', isAlive: true }
      ];
      expect(checkVictory(players, 4)).toBe('NONE');
    });
  });

  describe('Economic Questions Logic', () => {
    it('loads eight questions and returns two per turn', async () => {
      const { ECONOMIC_QUESTIONS, getQuestionsForTurn } = await import('./questionsData.js');
      expect(ECONOMIC_QUESTIONS).toHaveLength(8);
      expect(getQuestionsForTurn(1).map(question => question.id)).toEqual([1, 2]);
      expect(getQuestionsForTurn(2).map(question => question.id)).toEqual([3, 4]);
    });
  });
});
