'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import AboutModal from '@/app/components/AboutModal';
import PhaseTransitionCanvas from '@/app/components/PhaseTransitionCanvas';
import HostBroadcastView from '@/app/components/HostBroadcastView';
import NightQuizModal from '@/app/components/NightQuizModal';

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
  const [seerReveal, setSeerReveal] = useState(null); // { targetName, role }
  const [showRole, setShowRole] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'logs'
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [phaseOverlay, setPhaseOverlay] = useState(null);
  const [showHostBroadcast, setShowHostBroadcast] = useState(false);
  
  const chatEndRef = useRef(null);
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
      const currentRoom = roomRef.current;
      if (!currentRoom) return;
      const targetPlayer = currentRoom.players.find(p => p.playerId === targetId);
      const targetName = targetPlayer ? targetPlayer.username : 'Ẩn danh';
      setSeerReveal({ targetName, role });
    };

    const handleErrorMessage = (errMsg) => {
      setError(errMsg);
      setTimeout(() => setError(''), 5000);
    };

    const handleGameStarted = () => {
      setMessages([]); // Clear chat logs when game starts
      setSeerReveal(null);
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
      setShowHostBroadcast(true);
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
    roleActionDone: false
  };

  const myRoleMeta = getRoleCardMeta(me.role);

  const handleStartGame = () => {
    emitSoundEffect('start');
    setShowHostBroadcast(true);
    socket.emit('start_game', { roomId, playerId });
  };

  const handleNightAction = (targetPlayerId) => {
    emitSoundEffect(me.role === 'WEREWOLF' ? 'wolf' : me.role === 'SEER' ? 'seer' : 'guard');
    socket.emit('night_action', { roomId, playerId, targetPlayerId });
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
                className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-100 hover:text-white text-xs font-bold px-3.5 py-2 rounded shadow-md cursor-pointer transition-all flex items-center gap-1.5 uppercase tracking-wider blood-glow-box"
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

    const bannerTitle = room.status === 'FINISHED' ? 'KẾT THÚC NGHI LỄ' : room.currentPhase === 'NIGHT' ? 'BAN ĐÊM' : room.currentPhase === 'DAY' ? 'BAN NGÀY' : 'BIỂU QUYẾT';
    const bannerDesc = room.status === 'FINISHED' ? 'Kết quả cuộc săn đã ngã ngũ' : room.currentPhase === 'NIGHT' ? 'Đêm tối tịch mịch - Các vai trò bắt đầu nghi thức' : room.currentPhase === 'DAY' ? 'Bình minh rực rỡ - Hãy thảo luận về kẻ tình nghi' : 'Giờ phán xét - Bỏ phiếu treo cổ kẻ tình nghi';

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
              className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-100 hover:text-white text-xs font-bold px-3.5 py-2 rounded shadow-md cursor-pointer transition-all flex items-center gap-1.5 uppercase tracking-wider blood-glow-box"
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
            <strong className={timeLeft <= 10 ? 'is-urgent' : ''}>
              {timeLeft}s
            </strong>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-background text-on-background h-screen flex flex-col md:flex-row font-body-gothic textured-bg overflow-hidden ${room.status === 'LOBBY' ? 'room-shell-lobby' : ''} ${room.status === 'PLAYING' ? 'room-shell-playing' : ''} ${room.currentPhase === 'NIGHT' ? 'room-shell-night' : ''} ${room.currentPhase === 'DAY' ? 'room-shell-day' : ''} ${room.currentPhase === 'VOTING' ? 'room-shell-voting' : ''}`}>
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
        <div className="flex-grow p-6 overflow-y-auto z-10 flex flex-col">
          
          {/* My Role Widget */}
          {room.status !== 'LOBBY' && (
            <section className="role-card-panel mb-6">
              <div className="role-card-panel__header">
                <div className="role-card-panel__copy">
                  <div className="role-card-panel__eyebrow-row">
                    <span className="role-card-panel__crest" aria-hidden="true" />
                    <p className="role-card-panel__eyebrow">Lá bài định mệnh</p>
                    <span className="role-card-panel__divider" aria-hidden="true" />
                  </div>
                  <h2>Vai trò của ông chủ</h2>
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
                    <>
                      <Image
                        src={myRoleMeta.cardImage}
                        alt={`Lá bài ${myRoleMeta.title}`}
                        width={1024}
                        height={1536}
                        className="role-card-showcase__full-art"
                      />
                      <span className="role-card-showcase__logo-badge">
                        <Image
                          src={myRoleMeta.logoSmall || ANONYMOUS_ROLE_LOGO}
                          alt=""
                          width={72}
                          height={72}
                          className="role-card-showcase__role-logo-image"
                        />
                      </span>
                    </>
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

          {/* Lobby Screen */}
          {room.status === 'LOBBY' && (
            <div className="lobby-ritual">
              <section className="lobby-centerpiece" aria-label="Danh sách người chơi trong sảnh chờ">
                <div className="lobby-invocation">
                  <span />
                  <p>Tập hợp nghi lễ cần tối thiểu 5 người chơi để bắt đầu.</p>
                  <span />
                </div>

                <div className="lobby-player-row">
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
                          <div className="lobby-player-card__ribbon">Chủ phòng</div>
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
                    {room.players.length < 5
                      ? `Cần thêm ${5 - room.players.length} người chơi...`
                      : 'Đã đủ điều kiện khai mạc nghi lễ!'}
                  </span>
                </div>

                {isHost ? (
                  <button
                    onClick={handleStartGame}
                    disabled={room.players.length < 5}
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
            <div className="flex-grow flex flex-col">
              <div className="night-player-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-grow content-start">
                {room.players.map((player) => {
                  const isPlayerSelf = player.playerId === playerId;
                  const isAlive = player.isAlive;
                  
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
                    } else if (room.currentPhase === 'VOTING' && !me.hasVoted) {
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
                        {(room.status === 'FINISHED' || (me.role === 'WEREWOLF' && player.role === 'WEREWOLF')) && (
                          <div className={`night-player-card__role ${player.role === 'WEREWOLF' ? 'is-wolf-role' : ''}`}>
                            {getRoleLabel(player.role)}
                          </div>
                        )}
                        
                        {/* Vote markers */}
                        {room.currentPhase === 'VOTING' && player.hasVoted && (
                          <span className="night-player-card__vote-mark">
                            ĐÃ BỎ PHIẾU
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

      {/* Side Panel (Exclusive Chat for Players) */}
      <aside className="game-chat-sidebar w-full md:w-[23vw] md:min-w-[360px] md:max-w-[460px] flex flex-col h-[40%] md:h-full shrink-0 z-40 relative">
        
        {/* Sidebar Header */}
        <div className="game-chat-sidebar__top border-b border-red-900/50 pb-3 mb-2 px-4 pt-3 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#e9c349] uppercase tracking-wider blood-glow">
            💬 TRÒ CHUYỆN NGHI LỄ
          </h3>
          <span className="text-[10px] text-red-300/70 font-bold bg-red-950/80 px-2 py-0.5 rounded border border-red-800/40">
            TRỰC TIẾP
          </span>
        </div>

        {/* Chat Content */}
        <div className="flex-grow flex flex-col overflow-hidden p-3">
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

                if (msg.isWolfChat) {
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
                  room.status === 'PLAYING' && 
                  ((room.currentPhase === 'NIGHT' && me.role !== 'WEREWOLF') || !me.isAlive) && 
                  me.isAlive
                }
                placeholder={
                  !me.isAlive 
                    ? "Trò chuyện với linh hồn khác..." 
                    : room.currentPhase === 'NIGHT' && me.role !== 'WEREWOLF'
                      ? "Đêm tối tĩnh lặng..." 
                      : "Nhập tin nhắn..."
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
        </div>

      </aside>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
