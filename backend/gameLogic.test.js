import { describe, it, expect } from 'vitest';
import { assignRoles, processNightActions, processVoting, checkVictory } from './gameLogic.js';

describe('Game Logic Tests', () => {
  describe('assignRoles', () => {
    it('should throw error if players count is less than 4', () => {
      const players = [
        { playerId: '1', username: 'A' },
        { playerId: '2', username: 'B' },
        { playerId: '3', username: 'C' }
      ];
      expect(() => assignRoles(players)).toThrow('Tối thiểu cần 4 người chơi (không tính Chủ phòng) để bắt đầu game.');
    });

    it('should assign roles correctly for 4 players', () => {
      const players = [
        { playerId: '1', username: 'A' },
        { playerId: '2', username: 'B' },
        { playerId: '3', username: 'C' },
        { playerId: '4', username: 'D' }
      ];
      const assigned = assignRoles(players);
      expect(assigned).toHaveLength(4);
      
      const roles = assigned.map(p => p.role);
      expect(roles).toContain('WEREWOLF');
      expect(roles).toContain('SEER');
      expect(roles).toContain('BODYGUARD');
      expect(roles).toContain('VILLAGER');

      assigned.forEach(p => {
        expect(p.isAlive).toBe(true);
        expect(p.hasVoted).toBe(false);
        expect(p.voteTarget).toBeNull();
        expect(p.actionTarget).toBeNull();
        expect(p.roleActionDone).toBe(false);
      });
    });
  });

  describe('processNightActions', () => {
    it('should kill the player targeted by werewolves if not protected', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: true, actionTarget: '4' },
        { playerId: '2', username: 'Tiên tri', role: 'SEER', isAlive: true, actionTarget: '1' },
        { playerId: '3', username: 'Bảo vệ', role: 'BODYGUARD', isAlive: true, actionTarget: '2' },
        { playerId: '4', username: 'Dân', role: 'VILLAGER', isAlive: true, actionTarget: null }
      ];

      const { killedPlayerId, players: nextPlayers } = processNightActions(players);
      expect(killedPlayerId).toBe('4');
      
      const victim = nextPlayers.find(p => p.playerId === '4');
      expect(victim.isAlive).toBe(false);

      // Verify targets are cleared
      nextPlayers.forEach(p => {
        expect(p.actionTarget).toBeNull();
        expect(p.roleActionDone).toBe(false);
      });
    });

    it('should NOT kill the player targeted by werewolves if protected by bodyguard', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: true, actionTarget: '4' },
        { playerId: '2', username: 'Tiên tri', role: 'SEER', isAlive: true, actionTarget: '1' },
        { playerId: '3', username: 'Bảo vệ', role: 'BODYGUARD', isAlive: true, actionTarget: '4' },
        { playerId: '4', username: 'Dân', role: 'VILLAGER', isAlive: true, actionTarget: null }
      ];

      const { killedPlayerId, players: nextPlayers } = processNightActions(players);
      expect(killedPlayerId).toBeNull();
      
      const victim = nextPlayers.find(p => p.playerId === '4');
      expect(victim.isAlive).toBe(true);
    });
  });

  describe('processVoting', () => {
    it('should eliminate the player with the most votes', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: true, voteTarget: '4', hasVoted: true },
        { playerId: '2', username: 'Tiên tri', role: 'SEER', isAlive: true, voteTarget: '4', hasVoted: true },
        { playerId: '3', username: 'Bảo vệ', role: 'BODYGUARD', isAlive: true, voteTarget: '1', hasVoted: true },
        { playerId: '4', username: 'Dân', role: 'VILLAGER', isAlive: true, voteTarget: '1', hasVoted: true }
      ];

      const { votedOutPlayerId, players: nextPlayers } = processVoting(players);
      // Tie between 4 and 1 (2 votes each) -> No one is voted out
      expect(votedOutPlayerId).toBeNull();
      expect(nextPlayers.find(p => p.playerId === '4').isAlive).toBe(true);
      expect(nextPlayers.find(p => p.playerId === '1').isAlive).toBe(true);
    });

    it('should eliminate player if there is a clear majority', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: true, voteTarget: '4', hasVoted: true },
        { playerId: '2', username: 'Tiên tri', role: 'SEER', isAlive: true, voteTarget: '4', hasVoted: true },
        { playerId: '3', username: 'Bảo vệ', role: 'BODYGUARD', isAlive: true, voteTarget: '4', hasVoted: true },
        { playerId: '4', username: 'Dân', role: 'VILLAGER', isAlive: true, voteTarget: '1', hasVoted: true }
      ];

      const { votedOutPlayerId, players: nextPlayers } = processVoting(players);
      expect(votedOutPlayerId).toBe('4');
      expect(nextPlayers.find(p => p.playerId === '4').isAlive).toBe(false);
    });
  });

  describe('checkVictory', () => {
    it('should return VILLAGER if all werewolves are dead', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: false },
        { playerId: '2', username: 'Dân', role: 'VILLAGER', isAlive: true }
      ];
      expect(checkVictory(players, 1)).toBe('VILLAGER');
    });

    it('should return WEREWOLF if werewolves killed at least 2 villagers AND alive villagers <= alive wolves', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: true },
        { playerId: '2', username: 'Dân 1', role: 'VILLAGER', isAlive: false },
        { playerId: '3', username: 'Dân 2', role: 'VILLAGER', isAlive: false },
        { playerId: '4', username: 'Dân 3', role: 'VILLAGER', isAlive: true }
      ];
      expect(checkVictory(players, 2)).toBe('WEREWOLF');
    });

    it('should return VILLAGER if reached turn 4 (after 3 nights) and werewolves did not win', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: true },
        { playerId: '2', username: 'Dân 1', role: 'VILLAGER', isAlive: true },
        { playerId: '3', username: 'Dân 2', role: 'VILLAGER', isAlive: true },
        { playerId: '4', username: 'Dân 3', role: 'VILLAGER', isAlive: false }
      ];
      expect(checkVictory(players, 4)).toBe('VILLAGER');
    });

    it('should return NONE if game is still active within 3 nights', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: true },
        { playerId: '2', username: 'Dân 1', role: 'VILLAGER', isAlive: true },
        { playerId: '3', username: 'Dân 2', role: 'VILLAGER', isAlive: true }
      ];
      expect(checkVictory(players, 2)).toBe('NONE');
    });
  });

  describe('Economic Questions Logic', () => {
    it('should load 8 questions correctly and return 2 questions per turn', async () => {
      const { ECONOMIC_QUESTIONS, getQuestionsForTurn } = await import('./questionsData.js');
      expect(ECONOMIC_QUESTIONS).toHaveLength(8);

      const night1Questions = getQuestionsForTurn(1);
      expect(night1Questions).toHaveLength(2);
      expect(night1Questions[0].id).toBe(1);
      expect(night1Questions[1].id).toBe(2);

      const night2Questions = getQuestionsForTurn(2);
      expect(night2Questions).toHaveLength(2);
      expect(night2Questions[0].id).toBe(3);
      expect(night2Questions[1].id).toBe(4);
    });
  });
});
