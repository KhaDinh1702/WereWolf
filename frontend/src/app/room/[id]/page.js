'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import AboutModal from '@/app/components/AboutModal';

export default function GameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id ? params.id.toUpperCase() : '';
  
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const [seerReveal, setSeerReveal] = useState(null); // { targetName, role }
  const [showRole, setShowRole] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'logs'
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
  const chatEndRef = useRef(null);

  // Initialize identity
  useEffect(() => {
    const storedId = sessionStorage.getItem('werewolf_player_id');
    const storedName = localStorage.getItem('werewolf_username');
    if (!storedId || !storedName) {
      router.push('/');
      return;
    }
    setPlayerId(storedId);
    setUsername(storedName);
  }, [router]);

  // Connect to socket and setup event listeners
  useEffect(() => {
    if (!socket || !isConnected || !roomId || !playerId) return;

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
    socket.on('room_updated', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('timer_tick', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('seer_result', ({ targetId, role }) => {
      if (!room) return;
      const targetPlayer = room.players.find(p => p.playerId === targetId);
      const targetName = targetPlayer ? targetPlayer.username : 'Ẩn danh';
      setSeerReveal({ targetName, role });
    });

    socket.on('error_message', (errMsg) => {
      setError(errMsg);
      setTimeout(() => setError(''), 5000);
    });

    socket.on('game_started', () => {
      setMessages([]); // Clear chat logs when game starts
      setSeerReveal(null);
    });

    return () => {
      socket.off('room_updated');
      socket.off('timer_tick');
      socket.off('receive_message');
      socket.off('seer_result');
      socket.off('error_message');
      socket.off('game_started');
    };
  }, [socket, isConnected, roomId, playerId, username, router, room]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!room) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center font-serif-gothic demonic-bg">
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

  const isHost = room.hostId === playerId;

  const handleStartGame = () => {
    socket.emit('start_game', { roomId, playerId });
  };

  const handleNightAction = (targetPlayerId) => {
    socket.emit('night_action', { roomId, playerId, targetPlayerId });
  };

  const handleCastVote = (targetPlayerId) => {
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
    setChatInput('');
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
        <div className="bg-black/40 backdrop-blur-sm border-b border-outline-variant/30 px-6 py-4 flex flex-row justify-between items-center shrink-0">
          <div>
            <h1 className="font-serif-gothic text-xl text-primary uppercase tracking-widest font-semibold blood-glow">Sảnh chờ nghi lễ</h1>
            <p className="text-xs text-on-surface-variant/80 font-mono-gothic mt-0.5">ID PHÒNG: <span className="text-primary font-bold tracking-widest">{room.roomId}</span></p>
          </div>
          <div className="text-right flex items-center gap-4">
            <button 
              onClick={() => setIsAboutOpen(true)}
              className="text-xs font-serif-gothic text-[#e9c349] hover:text-white uppercase tracking-widest cursor-pointer border border-outline-variant/30 hover:border-[#e9c349]/50 px-3 py-1 rounded transition-all bg-black/40"
            >
              LUẬT CHƠI
            </button>
            <span className="text-xs font-serif-gothic text-primary/70 uppercase tracking-widest">Chờ đồng bọn ({room.players.length})</span>
          </div>
        </div>
      );
    }

    if (room.status === 'FINISHED') {
      return (
        <div className="bg-secondary border-b-2 border-primary px-6 py-4 flex flex-row justify-between items-center shrink-0 blood-glow-box">
          <div>
            <h1 className="font-serif-gothic text-lg text-white uppercase tracking-widest font-bold">NGHI LỄ KẾT THÚC</h1>
            <p className="text-xs text-primary/80 font-mono-gothic">Phòng: {room.roomId}</p>
          </div>
          <div className="text-right flex items-center gap-4">
            <button 
              onClick={() => setIsAboutOpen(true)}
              className="text-xs font-serif-gothic text-[#e9c349] hover:text-white uppercase tracking-widest cursor-pointer border border-outline-variant/30 hover:border-[#e9c349]/50 px-3 py-1 rounded transition-all bg-black/40"
            >
              LUẬT CHƠI
            </button>
            <span className="text-lg font-serif-gothic text-primary uppercase font-bold blood-glow">
              PHE {room.winner === 'WEREWOLF' ? 'MA SÓI' : 'DÂN LÀNG'} CHIẾN THẮNG!
            </span>
          </div>
        </div>
      );
    }

    // PLAYING State
    let bannerTitle = '';
    let bannerBg = '';
    let phaseIcon = '';
    let bannerDesc = '';

    if (room.currentPhase === 'NIGHT') {
      bannerTitle = 'BAN ĐÊM - SÓI THỨC GIẤC';
      bannerBg = 'bg-surface-container-lowest border-blue-950/40 text-blue-300';
      phaseIcon = '🌒';
      bannerDesc = 'Mọi người nhắm mắt, các vai trò đặc biệt thực hiện kỹ năng trong bóng tối.';
    } else if (room.currentPhase === 'DAY') {
      bannerTitle = 'BAN NGÀY - THẢO LUẬN';
      bannerBg = 'bg-yellow-950/20 border-yellow-900/30 text-yellow-200';
      phaseIcon = '☀️';
      bannerDesc = 'Thảo luận công khai tìm kiếm kẻ nghi vấn. Chat tự do.';
    } else if (room.currentPhase === 'VOTING') {
      bannerTitle = 'BIỂU QUYẾT TREO CỔ';
      bannerBg = 'bg-red-950/20 border-red-900/30 text-red-200';
      phaseIcon = '⚖️';
      bannerDesc = 'Đến giờ phán xét. Hãy bỏ phiếu treo cổ kẻ ông chủ nghi ngờ.';
    }

    return (
      <div className={`border-b-2 ${bannerBg} px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{phaseIcon}</span>
          <div>
            <h1 className="font-serif-gothic text-lg uppercase tracking-widest font-semibold flex items-center gap-2">
              {bannerTitle}
              <span className="text-xs font-mono-gothic font-normal text-on-surface-variant/80">(Vòng {room.currentTurn})</span>
            </h1>
            <p className="text-xs text-on-surface-variant/80">{bannerDesc}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 self-end md:self-auto">
          <button 
            onClick={() => setIsAboutOpen(true)}
            className="text-xs font-serif-gothic text-[#e9c349] hover:text-white uppercase tracking-widest cursor-pointer border border-outline-variant/30 hover:border-[#e9c349]/50 px-3 py-1 rounded transition-all bg-black/40"
          >
            LUẬT CHƠI
          </button>
          <div className="text-right">
            <span className="block text-xs font-mono-gothic uppercase tracking-wider text-on-surface-variant">Thời gian còn lại</span>
            <span className={`font-mono-gothic text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background text-on-background h-screen flex flex-col md:flex-row font-body-gothic textured-bg overflow-hidden">
      
      {/* Main Game Screen */}
      <main 
        className="flex-grow flex flex-col relative overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-outline-variant h-[60%] md:h-full shadow-[inset_0_0_100px_rgba(0,0,0,0.95)]"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.85)), url('/images/sidebar_texture.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        
        {/* Phase Header Banner */}
        {renderPhaseBanner()}

        {/* Game Canvas Area */}
        <div className="flex-grow p-6 overflow-y-auto z-10 flex flex-col">
          
          {/* My Role Widget */}
          {room.status !== 'LOBBY' && (
            <div className="mb-6 p-4 border border-outline-variant bg-surface-container-low flex justify-between items-center rounded">
              <div className="flex items-center gap-3">
                <span className="text-sm text-on-surface-variant font-mono-gothic">VAI TRÒ CỦA ÔNG CHỦ:</span>
                <span 
                  onClick={() => setShowRole(!showRole)}
                  className={`font-serif-gothic text-base px-3 py-1 border border-secondary cursor-pointer select-none tracking-widest rounded transition-all ${
                    showRole 
                      ? 'bg-secondary text-white font-bold blood-glow' 
                      : 'bg-black/40 text-primary hover:bg-black/60'
                  }`}
                >
                  {showRole ? me.role : 'BẤM ĐỂ XEM'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-on-surface-variant font-mono-gothic">Trạng thái:</span>
                <span className={`text-sm font-bold font-serif-gothic tracking-widest ${me.isAlive ? 'text-green-400' : 'text-red-500 blood-glow'}`}>
                  {me.isAlive ? 'CÒN SỐNG' : 'ĐÃ CHẾT (HỒN MA)'}
                </span>
              </div>
            </div>
          )}

          {/* Lobby Screen */}
          {room.status === 'LOBBY' && (
            <div className="flex-grow flex flex-col justify-between">
              <div className="text-center space-y-6 my-auto py-8">
                <p className="text-sm text-on-surface-variant/80 italic tracking-wider font-body-gothic">
                  Tập hợp nghi lễ cần tối thiểu 4 người chơi để bắt đầu.
                </p>
                
                {/* Players Flex list in Lobby (Tarot card style) */}
                <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto pt-4">
                  {room.players.map((player) => (
                    <div 
                      key={player.playerId} 
                      className={`relative flex flex-col items-center justify-between p-5 w-40 h-56 bg-black/70 border-2 transition-all duration-300 rounded shadow-[0_12px_28px_rgba(0,0,0,0.85)] hover:shadow-primary/10 group/card ${
                        player.playerId === room.hostId 
                          ? 'border-primary' 
                          : 'border-outline-variant hover:border-secondary'
                      }`}
                    >
                      {/* Inner ornate border */}
                      <div className="absolute inset-1.5 border border-outline-variant/30 pointer-events-none group-hover/card:border-secondary/40 transition-colors"></div>
                      
                      {/* Host ribbon */}
                      {player.playerId === room.hostId && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-black font-serif-gothic text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm shadow-md">
                          CHỦ PHÒNG
                        </div>
                      )}
                      
                      {/* Stylized Centerpiece (Gothic Letter instead of simple icon) */}
                      <div className="w-16 h-16 border-2 border-outline-variant/40 rounded-full flex items-center justify-center bg-black/50 shadow-inner my-auto relative group-hover/card:border-secondary/50 transition-colors">
                        <span className="font-serif-gothic text-2xl font-bold text-primary select-none group-hover/card:text-[#e9c349] transition-colors">
                          {player.username.charAt(0).toUpperCase()}
                        </span>
                        {/* Decorative ticks */}
                        <div className="absolute -inset-1 border border-dashed border-primary/20 rounded-full animate-[spin_25s_linear_infinite]"></div>
                      </div>

                      {/* Username */}
                      <div className="w-full text-center space-y-1 z-10">
                        <div 
                          className="text-xs font-semibold font-serif-gothic text-on-background uppercase tracking-wide truncate px-1"
                          title={player.username}
                        >
                          {player.username}
                        </div>
                        <div className="text-[9px] font-mono-gothic text-primary/50 tracking-wider">
                          {player.playerId === room.hostId ? 'VỊ TRÍ: CHỦ TỌA' : 'VỊ TRÍ: ĐỒNG LÒNG'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start/Exit Button area */}
              <div className="mt-auto border-t border-outline-variant/20 pt-6 flex justify-between items-center px-4">
                <button 
                  onClick={handleLeaveRoom}
                  className="group bg-transparent text-zinc-400 hover:text-red-500 font-serif-gothic text-sm py-2.5 px-6 border border-outline-variant/30 hover:border-red-500/50 transition-all duration-300 uppercase tracking-widest cursor-pointer flex items-center gap-2"
                >
                  RỜI PHÒNG
                  <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-red-500 text-xs -translate-x-2 group-hover:translate-x-0">
                    ▶
                  </span>
                </button>

                {isHost ? (
                  <button 
                    onClick={handleStartGame}
                    disabled={room.players.length < 4}
                    className="group bg-secondary hover:bg-red-700 text-white font-serif-gothic text-base py-3 px-8 border-2 border-secondary hover:border-red-600 transition-all duration-300 blood-glow-box uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    BẮT ĐẦU NGHI THỨC
                    <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-primary text-xs -translate-x-2 group-hover:translate-x-0">
                      ▶
                    </span>
                  </button>
                ) : (
                  <div className="text-xs font-mono-gothic text-primary/80 tracking-widest animate-pulse">
                    ĐANG CHỜ CHỦ PHÒNG KHỞI ĐỘNG NGHI LỄ...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seer Reveal Alert Modal */}
          {seerReveal && (
            <div className="mb-6 p-4 border-2 border-primary bg-indigo-950/20 text-primary flex justify-between items-center rounded animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔮</span>
                <p className="text-sm font-serif-gothic">
                  Kết quả soi: <span className="font-bold text-white uppercase">{seerReveal.targetName}</span> là <span className={`font-bold uppercase ${seerReveal.role === 'WEREWOLF' ? 'text-red-500 blood-glow' : 'text-green-400'}`}>{seerReveal.role === 'WEREWOLF' ? 'MA SÓI' : 'DÂN LÀNG'}</span>!
                </p>
              </div>
              <button 
                onClick={() => setSeerReveal(null)}
                className="text-xs underline hover:text-white cursor-pointer"
              >
                ĐÃ RÕ
              </button>
            </div>
          )}

          {/* Playing Screen / Finished Screen (Players Grid) */}
          {room.status !== 'LOBBY' && (
            <div className="flex-grow flex flex-col">
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-grow content-start">
                {room.players.map((player) => {
                  const isPlayerSelf = player.playerId === playerId;
                  const isAlive = player.isAlive;
                  
                  // Action button logic
                  let actionBtn = null;
                  
                  if (me.isAlive && isAlive && !isPlayerSelf) {
                    if (room.currentPhase === 'NIGHT' && !me.roleActionDone) {
                      if (me.role === 'WEREWOLF' && player.role !== 'WEREWOLF') {
                        actionBtn = (
                          <button 
                            onClick={() => handleNightAction(player.playerId)}
                            className="w-full mt-3 bg-red-950/40 text-red-400 border border-red-800 text-xs py-1.5 hover:bg-red-800 hover:text-white cursor-pointer uppercase transition-colors"
                          >
                            CẮN
                          </button>
                        );
                      } else if (me.role === 'BODYGUARD') {
                        actionBtn = (
                          <button 
                            onClick={() => handleNightAction(player.playerId)}
                            className="w-full mt-3 bg-blue-950/40 text-blue-400 border border-blue-800 text-xs py-1.5 hover:bg-blue-800 hover:text-white cursor-pointer uppercase transition-colors"
                          >
                            BẢO VỆ
                          </button>
                        );
                      } else if (me.role === 'SEER') {
                        actionBtn = (
                          <button 
                            onClick={() => handleNightAction(player.playerId)}
                            className="w-full mt-3 bg-indigo-950/40 text-indigo-400 border border-indigo-800 text-xs py-1.5 hover:bg-indigo-800 hover:text-white cursor-pointer uppercase transition-colors"
                          >
                            SOI
                          </button>
                        );
                      }
                    } else if (room.currentPhase === 'VOTING' && !me.hasVoted) {
                      actionBtn = (
                        <button 
                          onClick={() => handleCastVote(player.playerId)}
                          className="w-full mt-3 bg-zinc-900 text-primary border border-secondary text-xs py-1.5 hover:bg-secondary hover:text-white cursor-pointer uppercase transition-colors"
                        >
                          BỎ PHIẾU
                        </button>
                      );
                    }
                  }

                  // Determine display role (if public, show role)
                  const showActualRole = room.status === 'FINISHED' || !isAlive || (player.role !== 'NONE' && player.role !== undefined);

                  return (
                    <div 
                      key={player.playerId} 
                      className={`border p-4 bg-surface-container relative flex flex-col justify-between rounded transition-all ${
                        !isAlive 
                          ? 'opacity-40 border-zinc-800 bg-zinc-950' 
                          : isPlayerSelf 
                            ? 'border-primary' 
                            : 'border-outline-variant hover:border-secondary'
                      }`}
                    >
                      {/* Dead/Alive marker */}
                      <div className="absolute top-2 right-2 text-xs">
                        {isAlive ? '🟢' : '💀'}
                      </div>

                      <div className="text-center">
                        <div className="w-12 h-12 bg-black/40 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-2 text-lg">
                          {!isAlive 
                            ? '👻' 
                            : showActualRole 
                              ? player.role === 'WEREWOLF' 
                                ? '🐺' 
                                : player.role === 'SEER' 
                                  ? '🔮' 
                                  : player.role === 'BODYGUARD' 
                                    ? '🛡️' 
                                    : '👨' 
                              : player.role === 'WEREWOLF'
                                ? '🐺'
                                : '👤'
                          }
                        </div>
                        
                        <div className="text-sm font-semibold font-serif-gothic uppercase tracking-wide truncate" title={player.username}>
                          {player.username} {isPlayerSelf && '(TÔI)'}
                        </div>

                        {showActualRole && (
                          <div className={`text-[10px] font-mono-gothic mt-1 font-bold ${
                            player.role === 'WEREWOLF' ? 'text-red-500 blood-glow' : 'text-green-400'
                          }`}>
                            {player.role}
                          </div>
                        )}
                        
                        {/* Vote markers */}
                        {room.currentPhase === 'VOTING' && player.hasVoted && (
                          <span className="inline-block mt-1 text-[10px] font-mono-gothic bg-red-950/40 text-red-400 border border-red-900 px-1 rounded">
                            ĐÃ VOTE
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
                    className="bg-secondary text-white font-serif-gothic text-base py-3 px-8 border-2 border-secondary hover:bg-primary-container transition-colors blood-glow-box uppercase tracking-widest cursor-pointer"
                  >
                    QUAY VỀ SẢNH CHỜ
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Side Panel (Chat & Logs) */}
      <aside className="bg-surface-container-lowest border-t-2 md:border-t-0 md:border-l-2 border-outline-variant w-full md:w-[400px] flex flex-col h-[40%] md:h-full py-4 shrink-0 z-40 relative">
        
        {/* Tabs switcher */}
        <div className="flex border-b border-outline-variant px-4">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 font-serif-gothic uppercase tracking-wider text-xs border-b-2 cursor-pointer transition-all ${
              activeTab === 'chat' 
                ? 'border-secondary text-primary font-semibold' 
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            TRÒ CHUYỆN
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-2 font-serif-gothic uppercase tracking-wider text-xs border-b-2 cursor-pointer transition-all ${
              activeTab === 'logs' 
                ? 'border-secondary text-primary font-semibold' 
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            NHẬT KÝ
          </button>
        </div>

        {/* Tab Content: Chat */}
        {activeTab === 'chat' && (
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Messages box */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3 font-serif-gothic text-sm">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-on-surface-variant/40 italic py-8">
                  Không có tin nhắn nào. Nghi thức đang diễn ra trong tĩnh lặng.
                </div>
              ) : (
                messages.map((msg, index) => {
                  let bubbleBg = 'bg-surface-container';
                  let textColor = 'text-on-background';
                  let roleTag = '';

                  if (msg.isWolfChat) {
                    bubbleBg = 'bg-red-950/20 border border-red-900/40';
                    textColor = 'text-red-300';
                    roleTag = '[SÓI] ';
                  } else if (msg.isDeadChat) {
                    bubbleBg = 'bg-zinc-900/60 border border-zinc-800';
                    textColor = 'text-zinc-400';
                    roleTag = '[HỒN MA] ';
                  }

                  return (
                    <div key={index} className={`p-2.5 rounded ${bubbleBg} max-w-[90%] ${msg.senderId === playerId ? 'ml-auto border-l-2 border-l-primary' : 'mr-auto border-l-2 border-l-secondary'}`}>
                      <div className="text-[10px] font-mono-gothic text-primary/60 flex justify-between items-center gap-4 mb-0.5">
                        <span className="font-bold">{roleTag}{msg.sender}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className={`break-words ${textColor}`}>{msg.text}</p>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Send Form */}
            {room.status !== 'FINISHED' && (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-outline-variant flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={
                    room.status === 'PLAYING' && 
                    ((room.currentPhase === 'NIGHT' && me.role !== 'WEREWOLF') || !me.isAlive) && 
                    me.isAlive // If I'm dead, I can chat in dead-chat. If night and not wolf, cannot chat.
                  }
                  placeholder={
                    !me.isAlive 
                      ? "Chat với linh hồn khác..." 
                      : room.currentPhase === 'NIGHT' && me.role !== 'WEREWOLF'
                        ? "Đêm tối tĩnh lặng..." 
                        : "Nhập tin nhắn..."
                  }
                  className="flex-grow font-serif-gothic text-sm p-2.5 border-2 border-secondary focus:ring-0 input-inset rounded"
                />
                <button 
                  type="submit"
                  className="bg-secondary text-white px-4 border border-secondary hover:bg-primary-container transition-colors cursor-pointer text-sm font-serif-gothic uppercase tracking-widest rounded"
                >
                  GỬI
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab Content: Logs */}
        {activeTab === 'logs' && (
          <div className="flex-grow p-4 overflow-y-auto space-y-3 font-mono-gothic text-xs text-on-surface-variant">
            {room.logs.length === 0 ? (
              <div className="text-center italic text-on-surface-variant/40 py-8">
                Chưa có nhật ký nghi lễ nào được ghi nhận.
              </div>
            ) : (
              room.logs.map((log, index) => (
                <div key={index} className="p-2 border border-outline-variant/30 bg-black/20 rounded">
                  <div className="flex justify-between text-[10px] text-primary/70 mb-1 border-b border-outline-variant/20 pb-0.5 font-bold">
                    <span>ĐÊM/NGÀY {log.turn} ({log.phase})</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="leading-relaxed">{log.action}</p>
                </div>
              ))
            )}
          </div>
        )}

      </aside>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
