'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { CreditCard, MessageCircle, ScrollText, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import AboutModal from '@/app/components/AboutModal';
import PhaseTransitionCanvas from '@/app/components/PhaseTransitionCanvas';
import HostBroadcastView from '@/app/components/HostBroadcastView';
import NightQuizModal from '@/app/components/NightQuizModal';
import VoteLedger from '@/app/components/VoteLedger';

const getStoredPlayerId = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('werewolf_player_id') || '';
};

const getStoredUsername = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('werewolf_username') || '';
};

const ROLE_LABELS = {
  WEREWOLF: 'Ma Sói',
  SEER: 'Tiên Tri',
  WITCH: 'Phù Thủy',
  BODYGUARD: 'Bảo Vệ',
  VILLAGER: 'Dân Làng',
  NONE: 'Chưa rõ'
};

const getRoleLabel = (role) => ROLE_LABELS[role] || 'Chưa rõ';

const ANONYMOUS_ROLE_LOGO = '/images/anonymous-logo-small.png';

const ROLE_CARD_META = {
  WEREWOLF: {
    title: 'Ma Sói',
    faction: 'Phe Ma Sói',
    omen: 'Ẩn mình ban ngày, săn mồi khi đêm xuống.',
    sigil: 'wolf',
    cardImage: '/images/werewolf-card.png',
    logoSmall: '/images/werewolf-logo-small.png'
  },
  SEER: {
    title: 'Tiên Tri',
    faction: 'Phe Dân Làng',
    omen: 'Nhìn xuyên mặt nạ, tìm dấu vết trong bóng tối.',
    sigil: 'seer',
    cardImage: '/images/prophet-card.png',
    logoSmall: '/images/prophet-logo-small.png'
  },
  WITCH: {
    title: 'Phù Thủy',
    faction: 'Phe Dân Làng',
    omen: 'Giữ sinh mệnh và cái chết trong hai bình thuốc cổ.',
    sigil: 'witch',
    cardImage: '/images/witch-card.png',
    logoSmall: '/images/witch-logo-small.png'
  },
  BODYGUARD: {
    title: 'Bảo Vệ',
    faction: 'Phe Dân Làng',
    omen: 'Canh giữ một linh hồn trước nanh vuốt trong đêm.',
    sigil: 'guard',
    cardImage: '/images/protector-card.png',
    logoSmall: '/images/protector-logo-small.png'
  },
  VILLAGER: {
    title: 'Dân Làng',
    faction: 'Phe Dân Làng',
    omen: 'Không có quyền năng, chỉ còn lý trí và lời nói.',
    sigil: 'villager',
    cardImage: '/images/villager-card.png',
    logoSmall: '/images/villager-logo-small.png'
  },
  NONE: {
    title: 'Chưa rõ',
    faction: 'Chưa thuộc phe',
    omen: 'Nghi lễ chưa gọi tên bạn.',
    sigil: 'unknown',
    logoSmall: ANONYMOUS_ROLE_LOGO
  }
};

const getRoleCardMeta = (role) => ROLE_CARD_META[role] || ROLE_CARD_META.NONE;

const PHASE_OVERLAYS = {
  NIGHT: {
    title: 'Đêm buông xuống',
    subtitle: 'Mọi ánh mắt khép lại. Những vai trò trong bóng tối bắt đầu nghi lễ.',
    tone: 'night'
  },
  DAY: {
    title: 'Bình minh hé mở',
    subtitle: 'Ngôi làng thức dậy và lần theo dấu vết còn sót lại trong đêm.',
    tone: 'day'
  },
  VOTING: {
    title: 'Giờ phán xét',
    subtitle: 'Mỗi lá phiếu là một lời buộc tội. Hãy chọn thật cẩn trọng.',
    tone: 'vote'
  },
  FINISHED: {
    title: 'Nghi lễ kết thúc',
    subtitle: 'Màn đêm khép lại, kẻ chiến thắng đã lộ diện.',
    tone: 'end'
  }
};

const getPhaseClass = (room) => {
  if (!room) return 'game-stage-lobby';
  if (room.status === 'FINISHED') return 'game-stage-finished';
  if (room.status === 'LOBBY') return 'game-stage-lobby';
  return `game-stage-${room.currentPhase.toLowerCase()}`;
};

const emitSoundEffect = (effect) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('werewolf_sound_effect', { detail: { effect } }));
};

export default function GameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id ? params.id.toUpperCase() : '';
  
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState(null);
  const [playerId] = useState(getStoredPlayerId);
  const [username] = useState(getStoredUsername);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const [seerResults, setSeerResults] = useState({}); // { [playerId]: role }
  const [showRole, setShowRole] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'logs'
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [phaseOverlay, setPhaseOverlay] = useState(null);
  const [showHostBroadcast, setShowHostBroadcast] = useState(false);
  const [witchDraft, setWitchDraft] = useState({
    turn: null,
    useHeal: false,
    poisonTargetId: ''
  });
  
  const chatEndRef = useRef(null);
  const gameContentRef = useRef(null);
  const roomRef = useRef(null);
  const lastPhaseKeyRef = useRef(null);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // Redirect visitors that do not have a saved identity from the lobby.
  useEffect(() => {
    if (!playerId || !username) {
      router.push('/');
    }
  }, [playerId, username, router]);

  // Connect to socket and setup event listeners
  useEffect(() => {
    if (!socket || !isConnected || !roomId || !playerId || !username) return;

    // Check reconnection/restore state
    socket.emit('reconnect_check', { roomId, playerId }, (response) => {
      if (response.success) {
        setRoom(response.roomState);
      } else {
        // If reconnect fails, try to join room normally
        socket.emit('join_room', { roomId, username, playerId }, (joinResp) => {
          if (joinResp.success) {
            setRoom(joinResp.roomState);
          } else {
            setError(joinResp.error || 'Không thể tham gia phòng chơi.');
            setTimeout(() => router.push('/'), 3000);
          }
        });
      }
    });

    // Register event listeners
    const handleRoomUpdated = (updatedRoom) => {
      setRoom(updatedRoom);
    };

    const handleTimerTick = ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    };

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleSeerResult = ({ targetId, role }) => {
      setSeerResults(prev => ({ ...prev, [targetId]: role }));
    };

    const handleErrorMessage = (errMsg) => {
      setError(errMsg);
      setTimeout(() => setError(''), 5000);
    };

    const handleGameStarted = () => {
      setMessages([]); // Clear chat logs when game starts
      setSeerResults({});
    };

    socket.on('room_updated', handleRoomUpdated);
    socket.on('timer_tick', handleTimerTick);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('seer_result', handleSeerResult);
    socket.on('error_message', handleErrorMessage);
    socket.on('game_started', handleGameStarted);

    return () => {
      socket.off('room_updated', handleRoomUpdated);
      socket.off('timer_tick', handleTimerTick);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('seer_result', handleSeerResult);
      socket.off('error_message', handleErrorMessage);
      socket.off('game_started', handleGameStarted);
    };
  }, [socket, isConnected, roomId, playerId, username, router]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentPhaseKey = room
    ? room.status === 'FINISHED'
      ? 'FINISHED'
      : room.status === 'PLAYING'
        ? room.currentPhase
        : room.status
    : null;

  useEffect(() => {
    if (!currentPhaseKey) return;

    if (lastPhaseKeyRef.current && lastPhaseKeyRef.current !== currentPhaseKey) {
      const overlay = PHASE_OVERLAYS[currentPhaseKey];
      if (overlay) {
        emitSoundEffect(overlay.tone);

        const showTimerId = setTimeout(() => {
          setPhaseOverlay(overlay);
        }, 0);

        const hideTimerId = setTimeout(() => {
          setPhaseOverlay(null);
        }, 2700);

        lastPhaseKeyRef.current = currentPhaseKey;
        return () => {
          clearTimeout(showTimerId);
          clearTimeout(hideTimerId);
        };
      }
    }

    lastPhaseKeyRef.current = currentPhaseKey;
  }, [currentPhaseKey]);

  const isHost = room?.hostId === playerId;
  const roomStatus = room?.status;

  // Auto-open Host View for Host when game status is active
  useEffect(() => {
    if (isHost && roomStatus && roomStatus !== 'LOBBY') {
      const openTimer = setTimeout(() => setShowHostBroadcast(true), 0);
      return () => clearTimeout(openTimer);
    }
  }, [isHost, roomStatus]);

  if (!room) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center font-body-gothic demonic-bg">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-primary tracking-widest uppercase text-sm animate-pulse">
            Đang triệu hồi phòng chơi...
          </p>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      </div>
    );
  }

  // Get current player's data
  const me = room.players.find(p => p.playerId === playerId) || {
    role: 'NONE',
    isAlive: true,
    hasVoted: false,
    roleActionDone: false,
    witchHealUsed: false,
    witchPoisonUsed: false
  };

  const myRoleMeta = getRoleCardMeta(me.role);
  const activeVoteResult = room.lastVoteResult?.turn === room.currentTurn
    ? room.lastVoteResult
    : null;
  const gamePlayers = room.players.filter(player => player.playerId !== room.hostId);
  const lobbyPlayerCount = gamePlayers.length;
  const lobbyCardCount = room.players.length;
  const lobbyColumnCount = lobbyCardCount <= 5
    ? Math.max(lobbyCardCount, 1)
    : Math.min(6, Math.ceil(lobbyCardCount / 2));
  const lobbyRowCount = Math.ceil(lobbyCardCount / lobbyColumnCount);
  const currentWitchDraft = witchDraft.turn === room.currentTurn
    ? witchDraft
    : { turn: room.currentTurn, useHeal: false, poisonTargetId: '' };
  const witchNightReady = Boolean(room.witchNight?.werewolvesReady);
  const witchVictim = room.witchNight?.victim || null;

  const handleStartGame = () => {
    emitSoundEffect('start');
    setShowHostBroadcast(true);
    socket.emit('start_game', { roomId, playerId });
  };

  const handleNightAction = (targetPlayerId) => {
    emitSoundEffect(me.role === 'WEREWOLF' ? 'wolf' : me.role === 'SEER' ? 'seer' : 'guard');
    socket.emit('night_action', { roomId, playerId, targetPlayerId });
  };

  const handleWitchAction = () => {
    emitSoundEffect('whisper');
    socket.emit('witch_action', {
      roomId,
      playerId,
      useHeal: currentWitchDraft.useHeal,
      poisonTargetId: currentWitchDraft.poisonTargetId || null
    });
  };

  const handleCastVote = (targetPlayerId) => {
    emitSoundEffect('mark');
    socket.emit('cast_vote', { roomId, playerId, targetPlayerId });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    socket.emit('send_message', {
      roomId,
      playerId,
      text: chatInput.trim()
    });
    emitSoundEffect('whisper');
    setChatInput('');
  };

  const handleHostAdvancePhase = () => {
    socket.emit('host_advance_phase', { roomId, playerId });
    setShowHostBroadcast(false);
  };

  const handleLeaveRoom = () => {
    if (socket && isConnected) {
      socket.emit('leave_room', { roomId, playerId }, (response) => {
        router.push('/');
      });
      setTimeout(() => {
        router.push('/');
      }, 500);
    } else {
      router.push('/');
    }
  };

  // Helper rendering for current phase banner
  const renderPhaseBanner = () => {
    if (room.status === 'LOBBY') {
      return (
        <div className="lobby-header">
            <div className="lobby-brand">
              <div className="lobby-brand__badge" aria-hidden="true">
                <Image src="/images/werewolf-logo.png" alt="" width={40} height={40} className="lobby-brand__logo" />
              </div>
            <div>
              <h1>Sảnh chờ nghi lễ</h1>
              <p>Mã phòng: <span>{room.roomId}</span></p>
            </div>
          </div>
          <div className="lobby-header__actions">
            {isHost && (
              <button
                onClick={() => setShowHostBroadcast(true)}
                className="host-view-button bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-100 hover:text-white text-xs font-bold px-3.5 py-2 rounded shadow-md cursor-pointer transition-all flex items-center gap-1.5 uppercase tracking-wider blood-glow-box"
              >
                <span>MÀN HÌNH HOST VIEW</span>
              </button>
            )}
            <button 
              onClick={() => setIsAboutOpen(true)}
              className="lobby-rule-button"
            >
              <Image src="/images/rule-book.png" alt="" width={20} height={20} className="lobby-action-icon" />
              <span>LUẬT NGHI LỄ</span>
            </button>
          </div>
        </div>
      );
    }

    const maxTurn = 4;
    const nightsLeft = maxTurn - (room.currentTurn || 1);
    const nightsLeftText = room.status === 'FINISHED' ? '' : ` (Còn ${nightsLeft} đêm)`;

    const bannerTitle = room.status === 'FINISHED' ? 'KẾT THÚC NGHI LỄ' : room.currentPhase === 'NIGHT' ? `BAN ĐÊM${nightsLeftText}` : room.currentPhase === 'DAY' ? `BAN NGÀY${nightsLeftText}` : `BIỂU QUYẾT${nightsLeftText}`;
    const bannerDesc = room.status === 'FINISHED' ? `Kết quả cuộc săn đã ngã ngũ. Phe ${room.winner === 'WEREWOLF' ? 'MA SÓI' : 'DÂN LÀNG'} đã giành chiến thắng!` : room.currentPhase === 'NIGHT' ? 'Đêm tối tịch mịch - Các vai trò bắt đầu nghi thức' : room.currentPhase === 'DAY' ? 'Bình minh rực rỡ - Hãy thảo luận về kẻ tình nghi' : 'Giờ phán xét - Bỏ phiếu treo cổ kẻ tình nghi';

    return (
      <div className="phase-header">
        <div className="phase-header__title">
          <div className="phase-header__icon font-serif-gothic text-[#e9c349]">
            <Image src={room.currentPhase === 'NIGHT' ? '/images/night-logo.png' : '/images/day-logo.png'} alt="" width={32} height={32} />
          </div>
          <div>
            <h2>{bannerTitle} (ĐÊM {room.currentTurn || 1})</h2>
            <p>{bannerDesc}</p>
          </div>
        </div>
        
        <div className="phase-header__actions">
          {isHost && (
            <button
              onClick={() => setShowHostBroadcast(true)}
              className="host-view-button bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-100 hover:text-white text-xs font-bold px-3.5 py-2 rounded shadow-md cursor-pointer transition-all flex items-center gap-1.5 uppercase tracking-wider blood-glow-box"
            >
              <span>MÀN HÌNH HOST VIEW</span>
            </button>
          )}
          <button 
            onClick={() => setIsAboutOpen(true)}
            className="phase-rule-button"
          >
            <Image src="/images/rule-book.png" alt="" width={20} height={20} className="phase-rule-icon" />
            <span>LUẬT VAI TRÒ</span>
          </button>
          <div className="phase-timer">
            <span>Thời gian còn lại</span>
            <strong className={timeLeft <= 10 && room.currentPhase !== 'NIGHT' ? 'is-urgent' : ''}>
              {room.currentPhase === 'NIGHT' ? '∞' : `${timeLeft}s`}
            </strong>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`room-shell bg-background text-on-background h-screen flex flex-col md:flex-row font-body-gothic textured-bg overflow-hidden ${room.status === 'LOBBY' ? 'room-shell-lobby' : ''} ${room.status === 'PLAYING' ? 'room-shell-playing' : ''} ${room.currentPhase === 'NIGHT' ? 'room-shell-night' : ''} ${room.currentPhase === 'DAY' ? 'room-shell-day' : ''} ${room.currentPhase === 'VOTING' ? 'room-shell-voting' : ''}`}>
      {phaseOverlay && <PhaseTransitionCanvas overlay={phaseOverlay} />}
      {showHostBroadcast && (
        <HostBroadcastView
          room={room}
          timeLeft={timeLeft}
          onCloseHostView={() => setShowHostBroadcast(false)}
          onAdvancePhase={handleHostAdvancePhase}
        />
      )}
      
      {/* Main Game Screen */}
      <main 
        className={`game-stage ${getPhaseClass(room)} flex-grow flex flex-col relative overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-outline-variant h-[60%] md:h-full shadow-[inset_0_0_100px_rgba(0,0,0,0.95)]`}
      >
        {room.status !== 'LOBBY' && (
          <>
            <div className="game-stage__mist game-stage__mist-a" aria-hidden="true" />
            <div className="game-stage__mist game-stage__mist-b" aria-hidden="true" />
            <div className="game-stage__phase-glow" aria-hidden="true" />
          </>
        )}
        
        {/* Phase Header Banner */}
        {renderPhaseBanner()}

        {/* Game Canvas Area */}
        <div
          ref={gameContentRef}
          className={`game-content flex-grow p-6 z-10 flex flex-col ${room.status === 'LOBBY' ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          
          {/* My Role Widget */}
          {room.status !== 'LOBBY' && !isHost && (
            <section className="role-card-panel mb-6 shrink-0">
              <div className="role-card-panel__header">
                <div className="role-card-panel__copy">
                  <div className="role-card-panel__eyebrow-row">
                    <span className="role-card-panel__crest" aria-hidden="true" />
                    <p className="role-card-panel__eyebrow">Lá bài định mệnh</p>
                    <span className="role-card-panel__divider" aria-hidden="true" />
                  </div>
                  <h2>Vai trò của bạn</h2>
                </div>
                <div className="role-card-panel__status">
                  <span>Trạng thái</span>
                  <strong className={me.isAlive ? 'is-alive' : 'is-dead'}>
                    {me.isAlive ? 'Còn sống' : 'Đã chết'}
                  </strong>
                  <span className={`role-card-panel__life ${me.isAlive ? 'is-alive' : 'is-dead'}`} aria-hidden="true" />
                </div>
              </div>

              <button
                onClick={() => {
                  emitSoundEffect(showRole ? 'seal' : 'whisper');
                  setShowRole(!showRole);
                }}
                className={`role-card-showcase ${showRole ? 'is-revealed' : ''}`}
                data-role={me.role}
                aria-label={showRole ? 'Ẩn vai trò' : 'Xem vai trò'}
              >
                <span className="role-card-showcase__face role-card-showcase__front">
                  <span className="role-card-showcase__seal">
                    <Image
                      src={ANONYMOUS_ROLE_LOGO}
                      alt=""
                      width={96}
                      height={96}
                      className="role-card-showcase__seal-image"
                    />
                  </span>
                  <span className="role-card-showcase__hint">Bấm để mở vai trò</span>
                </span>

                <span className={`role-card-showcase__face role-card-showcase__back ${myRoleMeta.cardImage ? 'role-card-showcase__back--image' : ''}`}>
                  {myRoleMeta.cardImage ? (
                    <Image
                      src={myRoleMeta.cardImage}
                      alt={`Lá bài ${myRoleMeta.title}`}
                      fill
                      sizes="(min-width: 768px) 310px, 280px"
                      className="role-card-showcase__full-art"
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                  ) : (
                    <>
                      <span className={`role-card-art role-card-art--${myRoleMeta.sigil}`} aria-hidden="true">
                        <span className="role-card-art__mark role-card-art__mark-a" />
                        <span className="role-card-art__mark role-card-art__mark-b" />
                        <span className="role-card-art__beast">
                          <span className="role-card-art__face" />
                          <span className="role-card-art__eye" />
                        </span>
                        <span className="role-card-art__orb" />
                        <span className="role-card-art__shield" />
                        <span className="role-card-art__lantern" />
                      </span>
                      <span className="role-card-showcase__title">{myRoleMeta.title}</span>
                      <span className="role-card-showcase__faction">{myRoleMeta.faction}</span>
                      <span className="role-card-showcase__omen">{myRoleMeta.omen}</span>
                    </>
                  )}
                </span>
              </button>
            </section>
          )}

          {room.currentPhase === 'NIGHT' && me.role === 'WITCH' && me.isAlive && (
            <section className="witch-apothecary" aria-labelledby="witch-apothecary-title">
              <header className="witch-apothecary__header">
                <div>
                  <p>Gian thuốc trong đêm</p>
                  <h2 id="witch-apothecary-title">Quyết định của Phù Thủy</h2>
                </div>
                <div className="witch-apothecary__stock">
                  <span className={me.witchHealUsed ? 'is-used' : ''}>
                    Bình cứu: {me.witchHealUsed ? 'Đã dùng' : 'Còn 1'}
                  </span>
                  <span className={me.witchPoisonUsed ? 'is-used' : ''}>
                    Bình độc: {me.witchPoisonUsed ? 'Đã dùng' : 'Còn 1'}
                  </span>
                </div>
              </header>

              {!witchNightReady ? (
                <div className="witch-apothecary__waiting">
                  Đang chờ hai Ma Sói thống nhất nạn nhân...
                </div>
              ) : me.roleActionDone ? (
                <div className="witch-apothecary__waiting is-complete">
                  Quyết định đã được niêm phong cho đêm nay.
                </div>
              ) : (
                <div className="witch-apothecary__controls">
                  <div className="witch-apothecary__victim">
                    <span>Nạn nhân của Sói</span>
                    <strong>{witchVictim?.username || 'Không có, hai Sói không thống nhất'}</strong>
                  </div>

                  <label className={`witch-potion-option is-heal ${me.witchHealUsed || !witchVictim ? 'is-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={currentWitchDraft.useHeal}
                      disabled={me.witchHealUsed || !witchVictim}
                      onChange={(event) => setWitchDraft({
                        ...currentWitchDraft,
                        turn: room.currentTurn,
                        useHeal: event.target.checked
                      })}
                    />
                    <span>
                      <strong>Dùng bình cứu</strong>
                      <small>Cứu {witchVictim?.username || 'nạn nhân của Sói'} khỏi cái chết.</small>
                    </span>
                  </label>

                  <label className={`witch-potion-option is-poison ${me.witchPoisonUsed ? 'is-disabled' : ''}`}>
                    <span>
                      <strong>Dùng bình độc</strong>
                      <small>Chọn một người sẽ chết khi bình minh đến.</small>
                    </span>
                    <select
                      value={currentWitchDraft.poisonTargetId}
                      disabled={me.witchPoisonUsed}
                      onChange={(event) => setWitchDraft({
                        ...currentWitchDraft,
                        turn: room.currentTurn,
                        poisonTargetId: event.target.value
                      })}
                    >
                      <option value="">Không dùng bình độc</option>
                      {gamePlayers.filter(player => player.isAlive).map(player => (
                        <option key={player.playerId} value={player.playerId}>{player.username}</option>
                      ))}
                    </select>
                  </label>

                  <button type="button" onClick={handleWitchAction} className="witch-apothecary__confirm">
                    {me.witchHealUsed && me.witchPoisonUsed
                      ? 'Khép lại lượt của Phù Thủy'
                      : currentWitchDraft.useHeal || currentWitchDraft.poisonTargetId
                      ? 'Niêm phong lựa chọn'
                      : 'Giữ lại cả hai bình đêm nay'}
                  </button>
                </div>
              )}
            </section>
          )}

          {room.currentPhase === 'VOTING' && (
            <VoteLedger
              players={gamePlayers}
              voteResult={activeVoteResult}
              currentTurn={room.currentTurn}
            />
          )}

          {/* Lobby Screen */}
          {room.status === 'LOBBY' && (
            <div className="lobby-ritual">
              <section className="lobby-centerpiece" aria-label="Danh sách người chơi trong sảnh chờ">
                <div className="lobby-invocation">
                  <span />
                  <p>Nghi lễ chỉ khai mạc khi đủ 8 người chơi và 1 quản trò.</p>
                  <span />
                </div>

                <div
                  className={`lobby-player-row ${lobbyRowCount > 1 ? 'is-compact' : ''}`}
                  style={{
                    '--lobby-columns': lobbyColumnCount,
                    '--lobby-rows': lobbyRowCount
                  }}
                >
                  {room.players.map((player) => {
                    const hostCard = player.playerId === room.hostId;
                    return (
                      <div
                        key={player.playerId}
                        className={`lobby-player-card ${hostCard ? 'is-host' : ''}`}
                      >
                        <span className="lobby-player-card__corner lobby-player-card__corner-tl" aria-hidden="true" />
                        <span className="lobby-player-card__corner lobby-player-card__corner-tr" aria-hidden="true" />
                        <span className="lobby-player-card__corner lobby-player-card__corner-bl" aria-hidden="true" />
                        <span className="lobby-player-card__corner lobby-player-card__corner-br" aria-hidden="true" />

                        {hostCard && (
                          <div className="lobby-player-card__ribbon">Quản trò</div>
                        )}

                        <div className="lobby-player-card__avatar">
                          <span>{player.username.charAt(0).toUpperCase()}</span>
                        </div>

                        <div className="lobby-player-card__body">
                          <h3>{player.username}</h3>
                          <p>{hostCard ? 'Vị trí: Chủ tọa' : 'Vị trí: Đồng lòng'}</p>
                        </div>

                        <div className="lobby-player-card__crest" aria-hidden="true" />
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="lobby-bottom-bar">
                <button
                  onClick={handleLeaveRoom}
                  className="lobby-leave-button flex items-center justify-center gap-2"
                >
                  <span>THOÁT PHÒNG</span>
                </button>

                <div className="lobby-waiting-status rounded">
                  <span className="lobby-waiting-status__eye" aria-hidden="true" />
                  <span>
                    {lobbyPlayerCount < 8
                      ? `Cần thêm ${8 - lobbyPlayerCount} người chơi...`
                      : 'Đã đủ điều kiện khai mạc nghi lễ!'}
                  </span>
                </div>

                {isHost ? (
                  <button
                    onClick={handleStartGame}
                    disabled={lobbyPlayerCount !== 8}
                    className="lobby-start-button"
                  >
                    <span>KHAI MẠC NGHI LỄ</span>
                  </button>
                ) : (
                  <div className="lobby-bottom-bar__spacer" />
                )}
              </div>
            </div>
          )}

          {/* Playing Screen / Finished Screen (Players Grid) */}
          {room.status !== 'LOBBY' && (
            <div className="flex-grow flex flex-col pb-24">
              <div className="night-player-grid flex flex-wrap justify-center items-stretch gap-4 md:gap-6 flex-grow content-start">
                {gamePlayers.map((player) => {
                  const isPlayerSelf = player.playerId === playerId;
                  const isAlive = player.isAlive;
                  const voteTarget = player.voteTarget
                    ? gamePlayers.find(candidate => candidate.playerId === player.voteTarget)
                    : null;
                  
                  // Action button logic
                  let actionBtn = null;
                  
                  if (me.isAlive && isAlive) {
                    if (room.currentPhase === 'NIGHT' && !me.roleActionDone) {
                      if (me.role === 'WEREWOLF' && player.role !== 'WEREWOLF' && !isPlayerSelf) {
                        actionBtn = (
                          <button
                            onClick={() => handleNightAction(player.playerId)}
                            className="w-full mt-2 py-1.5 px-2 bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-100 hover:text-white rounded text-xs font-bold transition-all blood-glow-box cursor-pointer"
                          >
                            HẠ SÁT 🐺
                          </button>
                        );
                      } else if (me.role === 'SEER' && !isPlayerSelf) {
                        actionBtn = (
                          <button
                            onClick={() => handleNightAction(player.playerId)}
                            className="w-full mt-2 py-1.5 px-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-100 hover:text-white rounded text-xs font-bold transition-all shadow-md cursor-pointer"
                          >
                            SOI BÀI 🔮
                          </button>
                        );
                      } else if (me.role === 'BODYGUARD') {
                        actionBtn = (
                          <button
                            onClick={() => handleNightAction(player.playerId)}
                            className="w-full mt-2 py-1.5 px-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-100 hover:text-white rounded text-xs font-bold transition-all shadow-md cursor-pointer"
                          >
                            BẢO VỆ 🛡️
                          </button>
                        );
                      }
                    } else if (
                      room.currentPhase === 'VOTING'
                      && !activeVoteResult
                      && !me.hasVoted
                      && !isPlayerSelf
                    ) {
                      actionBtn = (
                        <button
                          onClick={() => handleCastVote(player.playerId)}
                          className="w-full mt-2 py-1.5 px-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-100 hover:text-white rounded text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          BỎ PHIẾU ⚖️
                        </button>
                      );
                    }
                  }

                  return (
                    <div
                      key={player.playerId}
                      className={`night-player-card ${isAlive ? 'is-alive' : 'is-dead'} ${isPlayerSelf ? 'is-self' : ''}`}
                    >
                      <div className="night-player-card__avatar font-serif-gothic">
                        {player.username.charAt(0).toUpperCase()}
                      </div>

                      <div className="night-player-card__info text-center flex-grow flex flex-col justify-center">
                        <span className="night-player-card__name font-bold text-sm block">
                          {player.username} {isPlayerSelf && '(Bạn)'}
                        </span>
                        
                        <div className="night-player-card__status mt-1">
                          {isAlive ? (
                            <span className="night-player-card__life-badge is-alive">CÒN SỐNG</span>
                          ) : (
                            <span className="night-player-card__life-badge is-dead">ĐÃ CHẾT</span>
                          )}
                        </div>

                        {/* Show revealed roles if finished or wolf pair or seer result */}
                        {(room.status === 'FINISHED' || (me.role === 'WEREWOLF' && player.role === 'WEREWOLF') || seerResults[player.playerId]) && (
                          <div className={`night-player-card__role ${player.role === 'WEREWOLF' || seerResults[player.playerId] === 'WEREWOLF' ? 'is-wolf-role' : ''}`}>
                            {getRoleLabel(seerResults[player.playerId] || player.role)}
                          </div>
                        )}
                        
                        {/* Vote markers */}
                        {room.currentPhase === 'VOTING' && !activeVoteResult && player.hasVoted && (
                          <span className="night-player-card__vote-mark">
                            PHIẾU: {voteTarget?.username || 'ĐÃ GỬI'}
                          </span>
                        )}
                      </div>

                      {actionBtn}
                    </div>
                  );
                })}
              </div>

              {/* End Finished actions */}
              {room.status === 'FINISHED' && (
                <div className="mt-6 border-t border-outline-variant pt-6 flex justify-center">
                  <button 
                    onClick={handleLeaveRoom}
                    className="bg-secondary text-white font-body-gothic font-semibold text-base py-3 px-8 border-2 border-secondary hover:bg-primary-container transition-colors blood-glow-box cursor-pointer"
                  >
                    QUAY VỀ SẢNH CHỜ
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <nav className="mobile-room-nav" aria-label="Điều hướng trong phòng">
        {room.status !== 'LOBBY' && !isHost && (
          <button
            type="button"
            onClick={() => {
              setIsMobilePanelOpen(false);
              gameContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <CreditCard aria-hidden="true" />
            <span>Vai trò</span>
          </button>
        )}
        <button
          type="button"
          className={isMobilePanelOpen && activeTab === 'chat' ? 'is-active' : ''}
          onClick={() => {
            setActiveTab('chat');
            setIsMobilePanelOpen(true);
          }}
        >
          <MessageCircle aria-hidden="true" />
          <span>Trò chuyện</span>
        </button>
        <button
          type="button"
          className={isMobilePanelOpen && activeTab === 'logs' ? 'is-active' : ''}
          onClick={() => {
            setActiveTab('logs');
            setIsMobilePanelOpen(true);
          }}
        >
          <ScrollText aria-hidden="true" />
          <span>Nhật ký</span>
        </button>
      </nav>

      <button
        type="button"
        className={`mobile-chat-backdrop ${isMobilePanelOpen ? 'is-visible' : ''}`}
        onClick={() => setIsMobilePanelOpen(false)}
        aria-label="Đóng bảng trò chuyện"
      />

      {/* Side Panel (Exclusive Chat for Players) */}
      <aside className={`game-chat-sidebar ${isMobilePanelOpen ? 'is-mobile-open' : ''} w-full md:w-[23vw] md:min-w-[360px] md:max-w-[460px] flex flex-col h-[40%] md:h-full shrink-0 z-40 relative`}>
        
        {/* Sidebar Header */}
        <div className="game-chat-sidebar__top">
          <div className="game-chat-sidebar__tabs" role="tablist" aria-label="Thông tin phòng">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'chat'}
              className={`game-chat-sidebar__tab ${activeTab === 'chat' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Trò chuyện
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'logs'}
              className={`game-chat-sidebar__tab ${activeTab === 'logs' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              Nhật ký
            </button>
          </div>
          <button
            type="button"
            className="game-chat-sidebar__close"
            onClick={() => setIsMobilePanelOpen(false)}
            aria-label="Đóng bảng"
            title="Đóng"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        {/* Chat Content */}
        <div className="flex-grow flex flex-col overflow-hidden p-3">
          {activeTab === 'chat' ? (
            <>
              {/* Messages box */}
              <div className="game-chat-messages flex-grow overflow-y-auto space-y-3 text-sm custom-scrollbar pr-1">
                {messages.length === 0 ? (
                  <div className="game-chat-empty text-center py-10">
                    <div className="game-chat-empty__watermark" aria-hidden="true" />
                    <p className="text-red-200 font-bold text-sm">Không có tin nhắn nào.</p>
                    <span className="text-xs text-red-300/60 italic block mt-1">Nghi thức đang diễn ra trong tĩnh lặng.</span>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    let bubbleBg = 'bg-red-950/40 border border-red-900/40';
                    let textColor = 'text-red-100';
                    let roleTag = '';

                    if (msg.isHostMessage) {
                      bubbleBg = 'bg-amber-950/40 border border-amber-700/60';
                      textColor = 'text-amber-100';
                      roleTag = '[QUẢN TRÒ] ';
                    } else if (msg.isWolfChat) {
                      bubbleBg = 'bg-red-900/40 border border-red-700/60';
                      textColor = 'text-red-200';
                      roleTag = '[SÓI] ';
                    } else if (msg.isDeadChat) {
                      bubbleBg = 'bg-zinc-900/80 border border-zinc-800';
                      textColor = 'text-zinc-400';
                      roleTag = '[HỒN MA] ';
                    }

                    return (
                      <div key={index} className={`game-chat-bubble p-2.5 rounded-xl ${bubbleBg} max-w-[90%] ${msg.senderId === playerId ? 'ml-auto border-l-2 border-l-[#e9c349]' : 'mr-auto border-l-2 border-l-red-600'}`}>
                        <div className="text-[10px] font-body-gothic text-red-300/80 flex justify-between items-center gap-4 mb-1">
                          <span className="font-bold">{roleTag}{msg.sender}</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className={`break-words ${textColor} font-medium`}>{msg.text}</p>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Send Form */}
              {room.status !== 'FINISHED' && (
                <form onSubmit={handleSendMessage} className="game-chat-form flex gap-2 mt-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={
                      room.status === 'PLAYING'
                      && ((room.currentPhase === 'NIGHT' && me.role !== 'WEREWOLF') || !me.isAlive)
                      && me.isAlive
                    }
                    placeholder={
                      !me.isAlive
                        ? 'Trò chuyện với linh hồn khác...'
                        : room.currentPhase === 'NIGHT' && me.role !== 'WEREWOLF'
                          ? 'Đêm tối tĩnh lặng...'
                          : 'Nhập tin nhắn...'
                    }
                    className="game-chat-input flex-grow text-sm bg-red-950/60 border border-red-900/60 rounded-lg px-3 py-2 text-white placeholder:text-red-400/50 focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="submit"
                    className="game-chat-send bg-red-900 hover:bg-red-800 border border-red-700/60 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer transition-all uppercase tracking-wider"
                  >
                    Gửi
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="game-room-logs flex-grow overflow-y-auto custom-scrollbar">
              {(room.logs || []).length === 0 ? (
                <div className="game-chat-empty">
                  <p>Chưa có sự kiện nào.</p>
                  <span>Diễn biến của nghi lễ sẽ xuất hiện tại đây.</span>
                </div>
              ) : (
                (room.logs || []).map((log, index) => (
                  <article key={`${log.timestamp}-${index}`} className="game-log-entry">
                    <div className="game-log-entry__meta">
                      <span>Vòng {log.turn || 1} · {log.phase || 'Sảnh chờ'}</span>
                      <time>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                    <p>{log.action}</p>
                  </article>
                ))
              )}
            </div>
          )}
        </div>

      </aside>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
