'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

const ROLE_LABELS = {
  WEREWOLF: 'Ma Sói',
  SEER: 'Tiên Tri',
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

const initialNames = ['Người chơi 1', 'Người chơi 2', 'Người chơi 3', 'Người chơi 4'].join('\n');

const shuffle = (items) => {
  const nextItems = [...items];
  for (let i = nextItems.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [nextItems[i], nextItems[j]] = [nextItems[j], nextItems[i]];
  }
  return nextItems;
};

const buildRoles = (count) => {
  let werewolfCount = 1;
  if (count >= 6) werewolfCount = 2;
  if (count >= 9) werewolfCount = 3;

  return [
    ...Array(werewolfCount).fill('WEREWOLF'),
    'SEER',
    'BODYGUARD',
    ...Array(count - werewolfCount - 2).fill('VILLAGER'),
  ];
};

const assignRoles = (names) => {
  const roles = shuffle(buildRoles(names.length));
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
  const [voteTargetId, setVoteTargetId] = useState('');
  const [logs, setLogs] = useState([]);
  const [winner, setWinner] = useState('NONE');
  const [error, setError] = useState('');

  const alivePlayers = useMemo(() => players.filter((player) => player.isAlive), [players]);
  const currentRevealPlayer = players[revealIndex];
  const werewolves = players.filter((player) => player.role === 'WEREWOLF');

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

    if (names.length < 4) {
      setError('Cần tối thiểu 4 người chơi để bắt đầu.');
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
    let nightMessage = 'Đêm trôi qua yên bình. Không ai chết.';

    if (wolfTargetId && wolfTargetId !== guardTargetId) {
      const victim = nextPlayers.find((player) => player.id === wolfTargetId);
      if (victim?.isAlive) {
        victim.isAlive = false;
        nightMessage = `Đêm qua, ${victim.name} đã bị Ma Sói cắn.`;
      }
    } else if (wolfTargetId && wolfTargetId === guardTargetId) {
      nightMessage = `${getPlayerName(players, wolfTargetId)} đã được Bảo Vệ che chở qua đêm.`;
    }

    const nextWinner = checkVictory(nextPlayers);
    setPlayers(nextPlayers);
    addLog(nightMessage);
    setWolfTargetId('');
    setGuardTargetId('');
    setSeerTargetId('');
    setSeerResult(null);

    if (nextWinner !== 'NONE') {
      setWinner(nextWinner);
      setPhase('FINISHED');
      return;
    }

    setPhase('DAY');
  };

  const startVoting = () => {
    setVoteTargetId('');
    setPhase('VOTING');
  };

  const finishVoting = () => {
    const nextPlayers = players.map((player) => ({ ...player }));
    let voteMessage = 'Dân làng không treo cổ ai trong lượt này.';

    if (voteTargetId) {
      const victim = nextPlayers.find((player) => player.id === voteTargetId);
      if (victim?.isAlive) {
        victim.isAlive = false;
        voteMessage = `Dân làng đã treo cổ ${victim.name} (${getRoleLabel(victim.role)}).`;
      }
    }

    const nextWinner = checkVictory(nextPlayers);
    setPlayers(nextPlayers);
    addLog(voteMessage);
    setVoteTargetId('');

    if (nextWinner !== 'NONE') {
      setWinner(nextWinner);
      setPhase('FINISHED');
      return;
    }

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
    setVoteTargetId('');
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
            Chạy hoàn toàn trên trình duyệt, không cần máy chủ, socket hay MongoDB.
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
                <p className="offline-help">Mỗi dòng một tên, hoặc ngăn cách bằng dấu phẩy. Tối thiểu 4 người.</p>
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
                  Ma Sói chọn nạn nhân
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
              <label className="offline-field">
                Người bị treo cổ
                <select value={voteTargetId} onChange={(event) => setVoteTargetId(event.target.value)}>
                  <option value="">Không treo cổ ai</option>
                  {alivePlayers.map((player) => (
                    <option key={player.id} value={player.id}>{player.name}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={finishVoting} className="offline-primary-button">Chốt bỏ phiếu</button>
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
