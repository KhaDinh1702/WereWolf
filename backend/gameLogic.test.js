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
      expect(() => assignRoles(players)).toThrow('Tối thiểu cần 4 người chơi để bắt đầu game.');
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
      expect(checkVictory(players)).toBe('VILLAGER');
    });

    it('should return WEREWOLF if werewolves count >= villagers count', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: true },
        { playerId: '2', username: 'Dân 1', role: 'VILLAGER', isAlive: true },
        { playerId: '3', username: 'Dân 2', role: 'VILLAGER', isAlive: false }
      ];
      expect(checkVictory(players)).toBe('WEREWOLF');
    });

    it('should return NONE if game is still active', () => {
      const players = [
        { playerId: '1', username: 'Sói', role: 'WEREWOLF', isAlive: true },
        { playerId: '2', username: 'Dân 1', role: 'VILLAGER', isAlive: true },
        { playerId: '3', username: 'Dân 2', role: 'VILLAGER', isAlive: true }
      ];
      expect(checkVictory(players)).toBe('NONE');
    });
  });
});
