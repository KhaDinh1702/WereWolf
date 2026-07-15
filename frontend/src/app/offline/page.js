'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import VoteLedger from '@/app/components/VoteLedger';

const ROLE_LABELS = {
  WEREWOLF: 'Ma Sói',
  SEER: 'Tiên Tri',
  WITCH: 'Phù Thủy',
  BODYGUARD: 'Bảo Vệ',
  VILLAGER: 'Dân Làng',
};

const PHASE_LABELS = {
  SETUP: 'Chuẩn bị',
  REVEAL: 'Trao vai',
  NIGHT: 'Ban đêm',
  DAY: 'Ban ngày',
  VOTING: 'Bỏ phiếu',
  FINISHED: 'Kết thúc',
};

const initialNames = [
  'Người chơi 1',
  'Người chơi 2',
  'Người chơi 3',
  'Người chơi 4',
  'Người chơi 5',
  'Người chơi 6',
  'Người chơi 7',
  'Người chơi 8'
].join('\n');

const shuffle = (items) => {
  const nextItems = [...items];
  for (let i = nextItems.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [nextItems[i], nextItems[j]] = [nextItems[j], nextItems[i]];
  }
  return nextItems;
};

const buildRoles = () => [
    'WEREWOLF',
    'WEREWOLF',
    'SEER',
    'WITCH',
    'BODYGUARD',
    'VILLAGER',
    'VILLAGER',
    'VILLAGER'
  ];

const assignRoles = (names) => {
  const roles = shuffle(buildRoles());
  return names.map((name, index) => ({
    id: `offline_${index}_${Date.now()}`,
    name,
    role: roles[index],
    isAlive: true,
  }));
};

const checkVictory = (players) => {
  const alivePlayers = players.filter((player) => player.isAlive);
  const werewolfCount = alivePlayers.filter((player) => player.role === 'WEREWOLF').length;
  const villagerCount = alivePlayers.length - werewolfCount;

  if (werewolfCount === 0) return 'VILLAGER';
  if (werewolfCount >= villagerCount) return 'WEREWOLF';
  return 'NONE';
};

const getRoleLabel = (role) => ROLE_LABELS[role] || 'Chưa rõ';

const getPlayerName = (players, playerId) => (
  players.find((player) => player.id === playerId)?.name || 'Không ai'
);

export default function OfflineGamePage() {
  const [phase, setPhase] = useState('SETUP');
  const [namesInput, setNamesInput] = useState(initialNames);
  const [players, setPlayers] = useState([]);
  const [revealIndex, setRevealIndex] = useState(0);
  const [isRoleVisible, setIsRoleVisible] = useState(false);
  const [turn, setTurn] = useState(1);
  const [wolfTargetId, setWolfTargetId] = useState('');
  const [guardTargetId, setGuardTargetId] = useState('');
  const [seerTargetId, setSeerTargetId] = useState('');
  const [seerResult, setSeerResult] = useState(null);
  const [witchHealUsed, setWitchHealUsed] = useState(false);
  const [witchPoisonUsed, setWitchPoisonUsed] = useState(false);
  const [witchUseHeal, setWitchUseHeal] = useState(false);
  const [witchPoisonTargetId, setWitchPoisonTargetId] = useState('');
  const [offlineVotes, setOfflineVotes] = useState({});
  const [offlineVoteResult, setOfflineVoteResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [winner, setWinner] = useState('NONE');
  const [error, setError] = useState('');

  const alivePlayers = useMemo(() => players.filter((player) => player.isAlive), [players]);
  const currentRevealPlayer = players[revealIndex];
  const werewolves = players.filter((player) => player.role === 'WEREWOLF');
  const offlineLedgerPlayers = players.map((player) => ({
    playerId: player.id,
    username: player.name,
    isAlive: player.isAlive,
    hasVoted: Object.prototype.hasOwnProperty.call(offlineVotes, player.id),
    voteTarget: offlineVotes[player.id] && offlineVotes[player.id] !== 'ABSTAIN'
      ? offlineVotes[player.id]
      : null
  }));

  const addLog = (message) => {
    setLogs((currentLogs) => [
      {
        id: `${Date.now()}_${currentLogs.length}`,
        turn,
        phase: PHASE_LABELS[phase],
        message,
      },
      ...currentLogs,
    ]);
  };

  const startOfflineGame = () => {
    const names = namesInput
      .split(/\n|,/)
      .map((name) => name.trim())
      .filter(Boolean);

    if (names.length !== 8) {
      setError('Chế độ này cần đúng 8 người chơi để bắt đầu.');
      return;
    }

    const uniqueNames = names.map((name, index) => {
      const duplicateCount = names.slice(0, index).filter((item) => item.toLowerCase() === name.toLowerCase()).length;
      return duplicateCount ? `${name} ${duplicateCount + 1}` : name;
    });

    setPlayers(assignRoles(uniqueNames));
    setRevealIndex(0);
    setIsRoleVisible(false);
    setTurn(1);
    setLogs([]);
    setWinner('NONE');
    setWitchHealUsed(false);
    setWitchPoisonUsed(false);
    setWitchUseHeal(false);
    setWitchPoisonTargetId('');
    setOfflineVotes({});
    setOfflineVoteResult(null);
    setError('');
    setPhase('REVEAL');
  };

  const goToNextReveal = () => {
    if (revealIndex >= players.length - 1) {
      setPhase('NIGHT');
      setIsRoleVisible(false);
      return;
    }

    setRevealIndex((currentIndex) => currentIndex + 1);
    setIsRoleVisible(false);
  };

  const handleSeerCheck = (targetId) => {
    setSeerTargetId(targetId);
    const target = players.find((player) => player.id === targetId);
    if (!target) {
      setSeerResult(null);
      return;
    }

    setSeerResult({
      name: target.name,
      result: target.role === 'WEREWOLF' ? 'Ma Sói' : 'Dân Làng',
    });
  };

  const finishNight = () => {
    const nextPlayers = players.map((player) => ({ ...player }));
    const killedPlayerIds = [];
    const healApplied = Boolean(wolfTargetId && witchUseHeal && !witchHealUsed);

    if (wolfTargetId && wolfTargetId !== guardTargetId && !healApplied) {
      const victim = nextPlayers.find((player) => player.id === wolfTargetId);
      if (victim?.isAlive) {
        victim.isAlive = false;
        killedPlayerIds.push(victim.id);
      }
    }

    if (witchPoisonTargetId && !witchPoisonUsed) {
      const poisonVictim = nextPlayers.find((player) => player.id === witchPoisonTargetId);
      if (poisonVictim?.isAlive) {
        poisonVictim.isAlive = false;
        if (!killedPlayerIds.includes(poisonVictim.id)) killedPlayerIds.push(poisonVictim.id);
      }
    }

    if (healApplied) setWitchHealUsed(true);
    if (witchPoisonTargetId && !witchPoisonUsed) setWitchPoisonUsed(true);

    const killedNames = killedPlayerIds.map((id) => getPlayerName(nextPlayers, id));
    const nightMessage = killedNames.length === 0
      ? 'Đêm trôi qua yên bình. Không ai chết.'
      : killedNames.length === 1
        ? `Đêm qua, ${killedNames[0]} đã chết trong bóng tối.`
        : `Đêm qua, ${killedNames.join(' và ')} đã chết trong bóng tối.`;

    const nextWinner = checkVictory(nextPlayers);
    setPlayers(nextPlayers);
    addLog(nightMessage);
    setWolfTargetId('');
    setGuardTargetId('');
    setSeerTargetId('');
    setSeerResult(null);
    setWitchUseHeal(false);
    setWitchPoisonTargetId('');

    if (nextWinner !== 'NONE') {
      setWinner(nextWinner);
      setPhase('FINISHED');
      return;
    }

    setPhase('DAY');
  };

  const startVoting = () => {
    setOfflineVotes({});
    setOfflineVoteResult(null);
    setPhase('VOTING');
  };

  const finishVoting = () => {
    const nextPlayers = players.map((player) => ({ ...player }));
    const voters = nextPlayers.filter((player) => player.isAlive);
    const playerById = new Map(nextPlayers.map((player) => [player.id, player]));
    const voteCounts = {};
    const ballots = voters.map((voter) => {
      const selectedTargetId = offlineVotes[voter.id];
      const target = selectedTargetId && selectedTargetId !== 'ABSTAIN'
        ? playerById.get(selectedTargetId)
        : null;

      if (target) {
        voteCounts[target.id] = (voteCounts[target.id] || 0) + 1;
      }

      return {
        voterPlayerId: voter.id,
        voterUsername: voter.name,
        targetPlayerId: target?.id || null,
        targetUsername: target?.name || null
      };
    });
    const tallies = voters
      .map((player) => ({
        playerId: player.id,
        username: player.name,
        votes: voteCounts[player.id] || 0
      }))
      .sort((a, b) => b.votes - a.votes || a.username.localeCompare(b.username, 'vi'));
    const highestVoteCount = tallies[0]?.votes || 0;
    const leadingPlayers = highestVoteCount > 0
      ? tallies.filter((tally) => tally.votes === highestVoteCount)
      : [];
    const votedOutPlayerId = leadingPlayers.length === 1 ? leadingPlayers[0].playerId : null;
    const victim = votedOutPlayerId
      ? nextPlayers.find((player) => player.id === votedOutPlayerId)
      : null;

    if (victim) victim.isAlive = false;

    const totalVotes = ballots.filter((ballot) => ballot.targetPlayerId).length;
    const voteMessage = victim
      ? `Dân làng đã treo cổ ${victim.name} (${getRoleLabel(victim.role)}).`
      : leadingPlayers.length > 1
        ? 'Biểu quyết hòa phiếu, không ai bị treo cổ trong lượt này.'
        : 'Dân làng không treo cổ ai trong lượt này.';

    setOfflineVoteResult({
      turn,
      ballots,
      tallies,
      totalVotes,
      eligibleVoters: voters.length,
      votedOutPlayerId,
      votedOutUsername: victim?.name || null,
      isTie: leadingPlayers.length > 1
    });

    const nextWinner = checkVictory(nextPlayers);
    setPlayers(nextPlayers);
    addLog(voteMessage);
    setWinner(nextWinner);
  };

  const continueAfterVoting = () => {
    if (winner !== 'NONE') {
      setPhase('FINISHED');
      return;
    }

    setOfflineVotes({});
    setOfflineVoteResult(null);
    setTurn((currentTurn) => currentTurn + 1);
    setPhase('NIGHT');
  };

  const resetGame = () => {
    setPhase('SETUP');
    setPlayers([]);
    setRevealIndex(0);
    setIsRoleVisible(false);
    setTurn(1);
    setWolfTargetId('');
    setGuardTargetId('');
    setSeerTargetId('');
    setSeerResult(null);
    setWitchHealUsed(false);
    setWitchPoisonUsed(false);
    setWitchUseHeal(false);
    setWitchPoisonTargetId('');
    setOfflineVotes({});
    setOfflineVoteResult(null);
    setLogs([]);
    setWinner('NONE');
    setError('');
  };

  return (
    <div className="offline-stage min-h-screen bg-background text-on-background font-body-gothic overflow-y-auto">
      <div className="offline-stage__mist" aria-hidden="true" />
      <header className="offline-header">
        <div>
          <p className="text-xs text-primary/70 font-bold">Chế độ dự phòng</p>
          <h1 className="text-2xl md:text-3xl font-bold text-primary blood-glow">Ma Sói offline cho lớp học</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Chạy hoàn toàn trên trình duyệt; người cầm máy làm quản trò cho 8 người chơi.
          </p>
        </div>
        <Link href="/" className="offline-ghost-button">Về sảnh online</Link>
      </header>

      <main className="offline-shell">
        <section className="offline-panel offline-main-panel">
          <div className="offline-phase-bar">
            <span>{PHASE_LABELS[phase]}</span>
            {phase !== 'SETUP' && <span>Vòng {turn}</span>}
          </div>

          {phase === 'SETUP' && (
            <div className="space-y-5">
              <div>
                <h2 className="offline-title">Nhập danh sách người chơi</h2>
                <p className="offline-help">Mỗi dòng một tên, hoặc ngăn cách bằng dấu phẩy. Cần đúng 8 người chơi.</p>
              </div>
              <textarea
                value={namesInput}
                onChange={(event) => setNamesInput(event.target.value)}
                className="offline-textarea"
                rows={9}
              />
              {error && <p className="offline-error">{error}</p>}
              <button type="button" onClick={startOfflineGame} className="offline-primary-button">
                Chia vai và bắt đầu
              </button>
            </div>
          )}

          {phase === 'REVEAL' && currentRevealPlayer && (
            <div className="offline-reveal">
              <p className="offline-help">Đưa máy cho đúng người chơi, chỉ người đó được nhìn màn hình.</p>
              <div className={`offline-role-card ${isRoleVisible ? 'is-visible' : ''}`}>
                <div className="offline-role-card__front">
                  <span>{currentRevealPlayer.name}</span>
                  <small>Chạm để hiện vai trò</small>
                </div>
                <div className="offline-role-card__back">
                  <span>{getRoleLabel(currentRevealPlayer.role)}</span>
                  <small>{currentRevealPlayer.name}</small>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button type="button" onClick={() => setIsRoleVisible((visible) => !visible)} className="offline-secondary-button">
                  {isRoleVisible ? 'Ẩn vai trò' : 'Hiện vai trò'}
                </button>
                <button type="button" onClick={goToNextReveal} className="offline-primary-button">
                  {revealIndex >= players.length - 1 ? 'Vào đêm đầu tiên' : 'Người tiếp theo'}
                </button>
              </div>
            </div>
          )}

          {phase === 'NIGHT' && (
            <div className="space-y-5">
              <div>
                <h2 className="offline-title">Ban đêm</h2>
                <p className="offline-help">Quản trò gọi từng vai trò thức dậy và chọn mục tiêu.</p>
              </div>
              <div className="offline-action-grid">
                <label className="offline-field">
                  Hai Ma Sói thống nhất nạn nhân
                  <select value={wolfTargetId} onChange={(event) => setWolfTargetId(event.target.value)}>
                    <option value="">Không cắn ai</option>
                    {alivePlayers.filter((player) => player.role !== 'WEREWOLF').map((player) => (
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                  </select>
                </label>
                <label className="offline-field">
                  Bảo Vệ che chở
                  <select value={guardTargetId} onChange={(event) => setGuardTargetId(event.target.value)}>
                    <option value="">Không bảo vệ ai</option>
                    {alivePlayers.map((player) => (
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                  </select>
                </label>
                <label className="offline-field">
                  Tiên Tri soi
                  <select value={seerTargetId} onChange={(event) => handleSeerCheck(event.target.value)}>
                    <option value="">Chưa soi</option>
                    {alivePlayers.filter((player) => player.role !== 'SEER').map((player) => (
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <section className="offline-witch-actions" aria-labelledby="offline-witch-title">
                <div className="offline-witch-actions__header">
                  <div>
                    <p className="offline-witch-actions__eyebrow">Tủ thuốc trong đêm</p>
                    <h3 id="offline-witch-title">Phù Thủy</h3>
                  </div>
                  <div className="offline-potion-stock" aria-label="Số bình thuốc còn lại">
                    <span className={witchHealUsed ? 'is-empty' : ''}>
                      Bình cứu: {witchHealUsed ? 'đã dùng' : 'còn 1'}
                    </span>
                    <span className={witchPoisonUsed ? 'is-empty' : ''}>
                      Bình độc: {witchPoisonUsed ? 'đã dùng' : 'còn 1'}
                    </span>
                  </div>
                </div>

                <p className="offline-witch-victim">
                  {wolfTargetId
                    ? `Đêm nay Ma Sói đã chọn ${getPlayerName(players, wolfTargetId)}.`
                    : 'Đêm nay Ma Sói không chọn được nạn nhân.'}
                </p>

                <div className="offline-witch-actions__controls">
                  <label className={`offline-potion-choice ${witchHealUsed || !wolfTargetId ? 'is-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={witchUseHeal}
                      onChange={(event) => setWitchUseHeal(event.target.checked)}
                      disabled={witchHealUsed || !wolfTargetId}
                    />
                    <span>
                      <strong>Dùng bình cứu</strong>
                      <small>Cứu nạn nhân mà Ma Sói vừa chọn.</small>
                    </span>
                  </label>

                  <label className={`offline-field offline-poison-field ${witchPoisonUsed ? 'is-disabled' : ''}`}>
                    Dùng bình độc
                    <select
                      value={witchPoisonTargetId}
                      onChange={(event) => setWitchPoisonTargetId(event.target.value)}
                      disabled={witchPoisonUsed}
                    >
                      <option value="">Giữ lại bình độc</option>
                      {alivePlayers.map((player) => (
                        <option key={player.id} value={player.id}>{player.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="offline-help">
                  Mỗi bình chỉ dùng một lần trong cả ván. Phù Thủy có thể dùng cả hai bình trong cùng một đêm.
                </p>
              </section>
              {seerResult && (
                <div className="offline-result">
                  Kết quả soi: <strong>{seerResult.name}</strong> là <strong>{seerResult.result}</strong>
                </div>
              )}
              <button type="button" onClick={finishNight} className="offline-primary-button">Kết thúc đêm</button>
            </div>
          )}

          {phase === 'DAY' && (
            <div className="space-y-5">
              <h2 className="offline-title">Ban ngày thảo luận</h2>
              <p className="offline-help">
                Cho cả lớp thảo luận ngoài đời. Khi đã sẵn sàng, chuyển sang bỏ phiếu.
              </p>
              <button type="button" onClick={startVoting} className="offline-primary-button">Bắt đầu bỏ phiếu</button>
            </div>
          )}

          {phase === 'VOTING' && (
            <div className="space-y-5">
              <h2 className="offline-title">Bỏ phiếu treo cổ</h2>
              {!offlineVoteResult && (
                <div className="offline-vote-entry">
                  {alivePlayers.map((voter) => (
                    <label key={voter.id} className="offline-field">
                      Lá phiếu của {voter.name}
                      <select
                        value={offlineVotes[voter.id] || ''}
                        onChange={(event) => setOfflineVotes((currentVotes) => {
                          const nextVotes = { ...currentVotes };
                          if (event.target.value) {
                            nextVotes[voter.id] = event.target.value;
                          } else {
                            delete nextVotes[voter.id];
                          }
                          return nextVotes;
                        })}
                      >
                        <option value="">Chưa bỏ phiếu</option>
                        <option value="ABSTAIN">Không bỏ phiếu</option>
                        {alivePlayers
                          .filter((candidate) => candidate.id !== voter.id)
                          .map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                          ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}

              <VoteLedger
                players={offlineLedgerPlayers}
                voteResult={offlineVoteResult}
                currentTurn={turn}
              />

              {offlineVoteResult ? (
                <button type="button" onClick={continueAfterVoting} className="offline-primary-button">
                  {winner !== 'NONE' ? 'Công bố phe chiến thắng' : 'Tiếp tục sang đêm'}
                </button>
              ) : (
                <button type="button" onClick={finishVoting} className="offline-primary-button">
                  Chốt và công bố phiếu
                </button>
              )}
            </div>
          )}

          {phase === 'FINISHED' && (
            <div className="space-y-5">
              <h2 className="offline-title">
                Phe {winner === 'WEREWOLF' ? 'Ma Sói' : 'Dân Làng'} chiến thắng
              </h2>
              <p className="offline-help">Có thể công bố toàn bộ vai trò cho lớp.</p>
              <button type="button" onClick={resetGame} className="offline-primary-button">Tạo ván mới</button>
            </div>
          )}
        </section>

        <aside className="offline-panel">
          <h2 className="offline-title">Bảng điều phối</h2>
          <div className="offline-player-list">
            {players.length === 0 ? (
              <p className="offline-help">Danh sách người chơi sẽ hiện ở đây sau khi chia vai.</p>
            ) : (
              players.map((player) => (
                <div key={player.id} className={`offline-player ${player.isAlive ? '' : 'is-dead'}`}>
                  <div>
                    <strong>{player.name}</strong>
                    <span>{phase === 'FINISHED' ? getRoleLabel(player.role) : player.isAlive ? 'Đang sống' : getRoleLabel(player.role)}</span>
                  </div>
                  <small>{player.isAlive ? 'Sống' : 'Đã chết'}</small>
                </div>
              ))
            )}
          </div>

          {players.length > 0 && (
            <div className="offline-wolves">
              <h3>Gợi ý cho quản trò</h3>
              <p>Ma Sói: {werewolves.map((player) => player.name).join(', ')}</p>
              <p>Không cho người chơi nhìn bảng này trong lúc ván đang diễn ra.</p>
            </div>
          )}

          <div className="offline-log">
            <h3>Nhật ký</h3>
            {logs.length === 0 ? (
              <p className="offline-help">Chưa có sự kiện nào.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="offline-log-item">
                  <span>Vòng {log.turn} - {log.phase}</span>
                  <p>{log.message}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
