'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import AboutModal from './components/AboutModal';

export default function LobbyPage() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Initialize playerId from sessionStorage or generate one
  useEffect(() => {
    let id = sessionStorage.getItem('werewolf_player_id');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem('werewolf_player_id', id);
    }
    setPlayerId(id);

    const savedName = localStorage.getItem('werewolf_username');
    if (savedName) {
      setUsername(savedName);
    }
  }, []);

  const validateUsername = () => {
    if (!username.trim()) {
      setError('Hãy nhập danh tính của bạn trước khi tiến hành nghi thức.');
      return false;
    }
    if (username.length < 2 || username.length > 15) {
      setError('Danh xưng phải có độ dài từ 2 đến 15 ký tự.');
      return false;
    }
    localStorage.setItem('werewolf_username', username.trim());
    return true;
  };

  const handleCreateRoom = () => {
    if (!validateUsername()) return;
    if (!socket || !isConnected) {
      setError('Không thể kết nối đến server bóng đêm. Vui lòng thử lại.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    socket.emit('create_room', { username: username.trim(), playerId }, (response) => {
      setIsSubmitting(false);
      if (response.success) {
        router.push(`/room/${response.roomId}`);
      } else {
        setError(response.error || 'Lỗi không xác định khi tạo phòng.');
      }
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!validateUsername()) return;
    if (!roomId.trim()) {
      setError('Vui lòng nhập ID phòng để tham gia.');
      return;
    }
    if (!socket || !isConnected) {
      setError('Không thể kết nối đến server bóng đêm. Vui lòng thử lại.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    socket.emit('join_room', { 
      roomId: roomId.trim().toUpperCase(), 
      username: username.trim(), 
      playerId 
    }, (response) => {
      setIsSubmitting(false);
      if (response.success) {
        router.push(`/room/${response.roomId}`);
      } else {
        setError(response.error || 'Lỗi không xác định khi vào phòng.');
      }
    });
  };

  return (
    <div className="bg-background text-on-background h-screen flex flex-col md:flex-row font-body-gothic textured-bg overflow-hidden">
      
      {/* Main Canvas (Left Area) */}
      <main className="flex-grow flex flex-col relative overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-secondary demonic-bg justify-center p-8 z-10 h-1/2 md:h-full">
        <div 
          className="w-full max-w-[440px] aspect-[10/13] flex flex-col items-center justify-center relative overflow-hidden shadow-[5px_10px_35px_rgba(0,0,0,0.95)] border border-amber-950/20 rounded-[4px] mx-auto"
          style={{
            backgroundImage: "url('/images/book-cover.jpg')",
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Werewolf Art Portrait (Main featured element) */}
          <div className="relative w-[60%] h-[68%] border-4 border-amber-900/60 rounded-[50%] overflow-hidden shadow-[inset_0_4px_15px_rgba(0,0,0,0.9),0_0_20px_rgba(0,0,0,0.8)] my-auto -mt-2">
            <img 
              src="/images/werewolf-art.jpg" 
              alt="Werewolf Gothic Ritual Art" 
              className="w-full h-full object-cover"
            />
          </div>

          {!isConnected && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 border border-red-500/50 bg-red-950/90 text-red-400 text-[10px] font-mono-gothic flex items-center gap-1.5 animate-pulse rounded shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              MẤT KẾT NỐI SERVER
            </div>
          )}
        </div>
      </main>

      {/* SideNavBar Component (Right Side) */}
      <aside 
        className="border-t-2 md:border-t-0 md:border-l-2 border-outline-variant w-full md:w-[400px] flex flex-col h-1/2 md:h-full py-6 md:py-12 overflow-y-auto shrink-0 z-40 relative shadow-[inset_0_0_100px_rgba(0,0,0,0.95)]"
        style={{
          backgroundImage: "linear-gradient(rgba(10, 0, 0, 0.5), rgba(10, 0, 0, 0.7)), url('/images/sidebar_texture.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="px-6 md:px-8 space-y-8 flex-grow flex flex-col justify-center">
          
          {/* Player Identity Input */}
          <div className="space-y-3">
            <h2 className="font-serif-gothic text-base text-primary uppercase tracking-wider border-b border-outline-variant pb-2">
              Danh tính của bạn
            </h2>
            <input 
              type="text" 
              placeholder="NHẬP TÊN BẤT KỲ"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              className="w-full font-serif-gothic text-base p-3 border border-outline-variant/30 focus:border-primary/50 focus:ring-0 text-center uppercase tracking-widest bg-black/50 text-primary transition-all placeholder-outline-variant/40 rounded-sm"
            />
          </div>

          {/* Create Room */}
          <div className="space-y-2">
            <button 
              onClick={handleCreateRoom}
              disabled={isSubmitting}
              className="group w-full bg-transparent text-zinc-400 hover:text-[#e9c349] font-serif-gothic text-lg py-2.5 tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Tạo Phòng Chơi
              <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-primary text-xs -translate-x-2 group-hover:translate-x-0">
                ▶
              </span>
            </button>
          </div>

          {/* Join Room */}
          <div className="space-y-3">
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <input 
                className="w-full font-serif-gothic text-base p-3 border border-outline-variant/30 focus:border-primary/50 focus:ring-0 text-center uppercase tracking-widest bg-black/50 text-primary transition-all placeholder-outline-variant/40 rounded-sm" 
                placeholder="NHẬP ID PHÒNG" 
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={isSubmitting}
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className="group w-full bg-transparent text-zinc-400 hover:text-[#e9c349] font-serif-gothic text-lg py-2.5 tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Vào Phòng
                <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-primary text-xs -translate-x-2 group-hover:translate-x-0">
                  ▶
                </span>
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 border border-red-500/20 bg-red-950/20 text-red-200 text-xs font-mono-gothic text-center rounded-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer info button */}
        <div className="mt-auto pt-4 px-6 border-t border-outline-variant/20 mx-4">
          <button 
            onClick={() => setIsAboutOpen(true)}
            className="group w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-[#e9c349] py-2 transition-colors cursor-pointer text-xs font-serif-gothic tracking-widest uppercase"
          >
            ABOUT GAME
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-primary text-[10px] -translate-x-1.5 group-hover:translate-x-0">
              ▶
            </span>
          </button>
        </div>
      </aside>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
