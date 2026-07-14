'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const OPTION_THEMES = [
  { key: 'A', bg: 'bg-gradient-to-r from-red-950 via-red-900 to-red-950', hover: 'hover:from-red-900 hover:to-red-850', border: 'border-red-700/80', labelBg: 'bg-red-950 border border-red-600/60', shape: '▲' },
  { key: 'B', bg: 'bg-gradient-to-r from-red-900 via-[#24080a] to-red-950', hover: 'hover:from-red-850 hover:to-red-900', border: 'border-red-700/80', labelBg: 'bg-red-950 border border-red-600/60', shape: '◆' },
  { key: 'C', bg: 'bg-gradient-to-r from-[#24080a] via-red-950 to-red-900', hover: 'hover:from-red-900 hover:to-[#2b0a0d]', border: 'border-red-700/80', labelBg: 'bg-red-950 border border-red-600/60', shape: '●' },
  { key: 'D', bg: 'bg-gradient-to-r from-red-950 via-[#1c0709] to-red-900', hover: 'hover:from-[#2b0a0d] hover:to-red-900', border: 'border-red-700/80', labelBg: 'bg-red-950 border border-red-600/60', shape: '■' }
];

export default function HostBroadcastView({ room, timeLeft, onCloseHostView }) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [revealAnswer, setRevealAnswer] = useState(false);

  if (!room) return null;

  const players = room.players || [];
  const playingPlayers = players.filter(p => p.playerId !== room.hostId);
  const alivePlayers = playingPlayers.filter(p => p.isAlive);
  
  const nightQuestions = room.nightQuestions || [];
  const quizStats = room.quizStats || [];
  
  const currentQuestion = nightQuestions[selectedQuestionIndex] || nightQuestions[0];
  const currentStats = quizStats[selectedQuestionIndex] || { totalAnswers: 0, counts: { A: 0, B: 0, C: 0, D: 0 } };

  const isNight = room.currentPhase === 'NIGHT';
  const isDayOrVote = room.currentPhase === 'DAY' || room.currentPhase === 'VOTING';
  const phaseLogo = isNight ? '/images/night-logo.png' : isDayOrVote ? '/images/day-logo.png' : '/images/werewolf-logo-small.png';
  const phaseBgImage = isNight ? '/images/night.png' : isDayOrVote ? '/images/day.png' : null;

  return (
    <div 
      className="fixed inset-0 z-50 text-white flex flex-col font-body-gothic overflow-hidden select-none animate-fade-in bg-cover bg-center bg-no-repeat transition-all duration-700"
      style={{ backgroundImage: "url('/images/sidebar_texture1.png')" }}
    >
      {/* Dynamic Day/Night ambient background overlay */}
      {phaseBgImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay transition-opacity duration-1000 pointer-events-none"
          style={{ backgroundImage: `url('${phaseBgImage}')` }}
        />
      )}

      {/* Dark overlay & Red Glow effects for atmosphere */}
      <div className="absolute inset-0 bg-black/60 backdrop-brightness-75 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-950/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="shrink-0 bg-[#120709]/95 border-b border-red-900/60 px-6 py-4 flex items-center justify-between shadow-2xl relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-950 border border-red-700/60 flex items-center justify-center p-1.5 shadow-md">
              <Image src="/images/werewolf-logo-small.png" alt="" width={28} height={28} />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-wider text-[#e9c349] uppercase blood-glow">
                HOST VIEW - SÂN CHƠI MA SÓI
              </h1>
              <p className="text-xs text-red-300/80">
                Mã phòng: <span className="font-mono font-bold text-white text-sm bg-red-950/90 px-2 py-0.5 rounded border border-red-700/50">{room.roomId}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Phase & Live Timer Badge */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 bg-red-950/80 border border-red-800/60 px-4 py-1.5 rounded-full shadow-md">
            <Image src={phaseLogo} alt="" width={24} height={24} className="shrink-0" />
            <span className="text-sm font-semibold text-red-200/80">Giai đoạn:</span>
            <span className="font-bold text-[#e9c349] uppercase text-sm">
              {room.status === 'LOBBY' ? 'SẢNH CHỜ' : room.status === 'FINISHED' ? 'KẾT THÚC' : room.currentPhase === 'NIGHT' ? 'BAN ĐÊM' : room.currentPhase === 'DAY' ? 'BAN NGÀY' : 'BIỂU QUYẾT'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-red-950/90 border border-red-700/60 px-5 py-2 rounded-full shadow-lg">
            <span className="text-xs uppercase tracking-widest text-red-200 font-bold">Thời gian</span>
            <span className={`text-2xl font-black font-mono ${timeLeft <= 10 ? 'text-red-500 animate-ping' : 'text-[#e9c349]'}`}>
              {timeLeft}s
            </span>
          </div>

          <button
            onClick={onCloseHostView}
            className="bg-red-950/90 hover:bg-red-900 border border-red-700/60 text-red-100 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider blood-glow-box"
          >
            <span>✕ THOÁT MÀN HÌNH HOST</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-grow grid grid-cols-12 gap-6 p-6 relative z-10 overflow-hidden">
        
        {/* Left Side: Survival Stats (People alive, roles hidden) */}
        <section className="col-span-4 bg-[#14080b]/90 border border-red-900/50 rounded-2xl p-5 flex flex-col backdrop-blur-md shadow-xl overflow-hidden">
          <div className="shrink-0 flex items-center justify-between border-b border-red-900/50 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Image src="/images/wait-for-players.png" alt="" width={22} height={22} />
              <h2 className="font-bold text-lg text-red-100">THỐNG KÊ SINH TỒN</h2>
            </div>
            <div className="bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded-full text-xs font-bold text-emerald-400">
              {alivePlayers.length} / {playingPlayers.length} CÒN SỐNG
            </div>
          </div>

          <p className="text-xs text-red-300/70 mb-3 italic">
            *Vai trò của người chơi còn sống được giữ bí mật hoàn toàn.
          </p>

          {/* Player Cards List */}
          <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {players.map((p) => {
              const isHostPlayer = p.playerId === room.hostId || p.role === 'HOST';
              const isAlive = p.isAlive;
              return (
                <div
                  key={p.playerId}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isHostPlayer
                      ? 'bg-amber-950/30 border-amber-700/50 text-amber-100'
                      : isAlive
                        ? 'bg-red-950/40 border-red-800/40 text-red-100'
                        : 'bg-black/40 border-red-950/80 text-red-400/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isHostPlayer 
                        ? 'bg-amber-900/60 text-[#e9c349] border border-amber-600/50' 
                        : isAlive 
                          ? 'bg-red-900/60 text-white border border-red-700/50' 
                          : 'bg-black text-red-600 border border-red-900/40'
                    }`}>
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-sm block">{p.username}</span>
                      <span className="text-[10px] uppercase tracking-wider text-red-300/80">
                        {isHostPlayer ? 'Chủ phòng' : 'Người chơi'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isHostPlayer ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-500/60 text-[11px] font-bold text-[#e9c349]">
                        👑 QUẢN TRÒ
                      </span>
                    ) : isAlive ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        CÒN SỐNG
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-red-950/90 border border-red-700/60 text-[11px] font-bold text-red-400">
                        ĐÃ CHẾT
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Side: Night Quiz Broadcast */}
        <section className="col-span-8 bg-[#14080b]/90 border border-red-900/50 rounded-2xl p-6 flex flex-col backdrop-blur-xl shadow-2xl relative overflow-hidden">
          
          {/* Header & Question Selectors */}
          <div className="shrink-0 flex items-center justify-between border-b border-red-900/50 pb-4 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#e9c349] block">
                CÂU HỎI TRẮC NGHIỆM KINH TẾ (ĐÊM {room.currentTurn || 1})
              </span>
              <h2 className="text-lg font-extrabold text-white">
                GIAO DIỆN HOST VIEW
              </h2>
            </div>

            {nightQuestions.length > 0 && (
              <div className="flex items-center gap-2 bg-red-950/60 p-1.5 rounded-xl border border-red-800/40">
                {nightQuestions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestionIndex(idx);
                      setRevealAnswer(false);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedQuestionIndex === idx
                        ? 'bg-[#e9c349] text-black font-extrabold shadow-md scale-105'
                        : 'text-red-200 hover:text-white hover:bg-red-900/40'
                    }`}
                  >
                    CÂU HỎI {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {currentQuestion ? (
            <div className="flex-grow flex flex-col justify-between">
              
              {/* Question Text Box */}
              <div className="bg-gradient-to-r from-red-950/90 via-[#1c090c] to-red-950/90 border-2 border-red-800/60 rounded-2xl p-6 shadow-2xl text-center relative overflow-hidden">
                <span className="absolute top-2 left-4 text-[10px] font-mono tracking-widest text-red-300/80 font-bold uppercase">
                  CÂU {selectedQuestionIndex + 1} / {nightQuestions.length}
                </span>
                <p className="text-xl md:text-2xl font-black text-[#e9c349] mt-2 leading-snug">
                  "{currentQuestion.question}"
                </p>

                <div className="mt-3 flex items-center justify-center gap-4 text-xs font-bold">
                  <span className="bg-red-950/80 border border-red-700/50 px-3 py-1 rounded-full text-red-200">
                    Lượt trả lời: <strong className="text-[#e9c349]">{currentStats.totalAnswers}</strong> người
                  </span>
                  <button
                    onClick={() => setRevealAnswer(!revealAnswer)}
                    className={`px-3.5 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                      revealAnswer
                        ? 'bg-emerald-700 text-white border-emerald-400 shadow-md'
                        : 'bg-red-900/80 hover:bg-red-800 text-[#e9c349] border-red-600/60'
                    }`}
                  >
                    {revealAnswer ? '✓ ĐÃ HIỆN ĐÁP ÁN ĐÚNG' : 'HIỆN ĐÁP ÁN ĐÚNG'}
                  </button>
                </div>
              </div>

              {/* Options Grid (Kahoot vibrant cards with live stats) */}
              <div className="grid grid-cols-2 gap-4 my-4">
                {currentQuestion.options.map((opt, i) => {
                  const theme = OPTION_THEMES[i % OPTION_THEMES.length];
                  const answerCount = currentStats.counts[theme.key] || 0;
                  const percent = currentStats.totalAnswers > 0
                    ? Math.round((answerCount / currentStats.totalAnswers) * 100)
                    : 0;
                  const isCorrect = revealAnswer && currentQuestion.correctAnswer === theme.key;

                  return (
                    <div
                      key={opt.key}
                      className={`relative p-5 rounded-2xl border-2 transition-all shadow-xl flex flex-col justify-between overflow-hidden ${
                        theme.bg
                      } ${theme.border} ${
                        isCorrect ? 'ring-4 ring-yellow-300 scale-[1.02]' : ''
                      }`}
                    >
                      {/* Bar graph representation */}
                      <div
                        className="absolute bottom-0 left-0 bg-black/35 transition-all duration-500 pointer-events-none"
                        style={{ height: `${percent}%`, width: '100%' }}
                      />

                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-xl ${theme.labelBg} flex items-center justify-center font-black text-lg text-white shadow-md border border-white/20`}>
                            {theme.shape}
                          </span>
                          <span className="font-extrabold text-lg text-white">
                            {theme.key}.
                          </span>
                        </div>

                        {/* Live Answer Count Badge */}
                        <div className="bg-black/50 border border-white/30 px-3 py-1 rounded-full text-xs font-black text-[#e9c349] backdrop-blur-md">
                          {answerCount} người ({percent}%)
                        </div>
                      </div>

                      <p className="font-bold text-base md:text-lg text-white mt-3 relative z-10 leading-snug">
                        {opt.text}
                      </p>

                      {isCorrect && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full border border-yellow-200 uppercase tracking-wider animate-bounce z-20">
                          ĐÁP ÁN ĐÚNG ✅
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-center p-8 text-red-200/90">
              <div>
                <Image src={phaseLogo} alt="" width={48} height={48} className="mx-auto mb-2 opacity-80" />
                <p className="font-bold text-lg text-[#e9c349]">
                  {isNight ? 'Chưa có câu hỏi trắc nghiệm nào cho đêm này.' : 'Đang trong thời gian thảo luận ban ngày.'}
                </p>
                <p className="text-xs text-red-300/80 mt-1">
                  {isNight ? 'Trò chơi sẽ mở câu hỏi khi đêm chính thức bắt đầu.' : 'Host có thể theo dõi diễn biến trò chơi qua bảng quản trị.'}
                </p>
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}
