'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const OPTION_THEMES = [
  { key: 'A', bg: 'bg-red-950', hover: 'hover:bg-red-900', border: 'border-red-700/80', labelBg: 'bg-red-950 border border-red-600/60', shape: 'A' },
  { key: 'B', bg: 'bg-[#24080a]', hover: 'hover:bg-[#2b0a0d]', border: 'border-red-700/80', labelBg: 'bg-red-950 border border-red-600/60', shape: 'B' },
  { key: 'C', bg: 'bg-[#2b0a0d]', hover: 'hover:bg-[#340c10]', border: 'border-red-700/80', labelBg: 'bg-red-950 border border-red-600/60', shape: 'C' },
  { key: 'D', bg: 'bg-[#1c0709]', hover: 'hover:bg-[#24080a]', border: 'border-red-700/80', labelBg: 'bg-red-950 border border-red-600/60', shape: 'D' }
];

export default function HostBroadcastView({ room, timeLeft, onCloseHostView, onAdvancePhase }) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [wrongOptions, setWrongOptions] = useState({}); // { [qId]: ['A', 'C'] }
  const [correctAnswersFound, setCorrectAnswersFound] = useState({}); // { [qId]: true }
  const [leftTab, setLeftTab] = useState('survival'); // 'survival' | 'logs'

  if (!room) return null;

  const players = room.players || [];
  const playingPlayers = players.filter(p => p.playerId !== room.hostId);
  const alivePlayers = playingPlayers.filter(p => p.isAlive);
  const logs = room.logs || [];
  
  const nightQuestions = room.nightQuestions || [];
  const currentQuestion = nightQuestions[selectedQuestionIndex] || nightQuestions[0];

  const isNight = room.currentPhase === 'NIGHT';
  const isDayOrVote = room.currentPhase === 'DAY' || room.currentPhase === 'VOTING';
  const phaseLogo = isNight ? '/images/night-logo.png' : isDayOrVote ? '/images/day-logo.png' : '/images/werewolf-logo-small.png';
  const phaseBgImage = isNight ? '/images/night.png' : isDayOrVote ? '/images/day.png' : null;

  const handleOptionClick = (key) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;

    // If already answered correctly or option already locked, do nothing
    if (correctAnswersFound[qId] || (wrongOptions[qId] || []).includes(key)) return;

    if (key === currentQuestion.correctAnswer) {
      setCorrectAnswersFound(prev => ({ ...prev, [qId]: true }));
      // Auto switch to question 2 after short delay if available
      if (selectedQuestionIndex + 1 < nightQuestions.length) {
        setTimeout(() => {
          setSelectedQuestionIndex(prev => prev + 1);
        }, 1200);
      }
    } else {
      setWrongOptions(prev => ({
        ...prev,
        [qId]: [...(prev[qId] || []), key]
      }));
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 text-white flex flex-col font-body-gothic overflow-hidden select-none animate-fade-in bg-cover bg-center bg-no-repeat transition-all duration-700 bg-[#0f0506]"
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
      <header className="shrink-0 bg-[#120709] border-b border-red-900/60 px-6 py-4 flex items-center justify-between shadow-2xl relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-950 border border-red-700/60 flex items-center justify-center p-1.5 shadow-md">
              <Image src="/images/werewolf-logo-small.png" alt="" width={28} height={28} />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-wider text-[#e9c349] uppercase">
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
            <span className={`text-2xl font-black font-mono ${isNight ? 'text-[#e9c349]' : timeLeft <= 10 ? 'text-red-500 animate-ping' : 'text-[#e9c349]'}`}>
              {isNight ? '∞ (VÔ HẠN)' : `${timeLeft}s`}
            </span>
          </div>

          <button
            onClick={onCloseHostView}
            className="bg-red-950 hover:bg-red-900 border border-red-700/60 text-red-100 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
          >
            <span>THOÁT MÀN HÌNH HOST</span>
          </button>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-grow grid grid-cols-12 gap-6 p-6 relative z-10 overflow-hidden">
        
        {/* Left Side: Survival Roster / Logs Switcher */}
        <section className="col-span-4 bg-[#14080b] border border-red-900/50 rounded-2xl p-5 flex flex-col shadow-xl overflow-hidden">
          
          {/* Header Switcher */}
          <div className="shrink-0 flex items-center justify-between border-b border-red-900/50 pb-4 mb-4">
            <div className="flex items-center gap-2 bg-red-950 p-1 rounded-xl border border-red-900/60">
              <button
                onClick={() => setLeftTab('survival')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  leftTab === 'survival'
                    ? 'bg-red-900 text-white shadow-md'
                    : 'text-red-300/70 hover:text-white'
                }`}
              >
                SINH TỒN ({alivePlayers.length}/{playingPlayers.length})
              </button>
              <button
                onClick={() => setLeftTab('logs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  leftTab === 'logs'
                    ? 'bg-red-900 text-white shadow-md'
                    : 'text-red-300/70 hover:text-white'
                }`}
              >
                NHẬT KÝ ({logs.length})
              </button>
            </div>

            <span className="text-[10px] font-mono text-red-300/70 font-bold uppercase">
              {playingPlayers.length} NGƯỜI CHƠI
            </span>
          </div>

          {leftTab === 'survival' ? (
            <div className="flex-grow overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
              {playingPlayers.map((p) => (
                <div 
                  key={p.playerId}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    p.isAlive 
                      ? 'bg-red-950/60 border-red-900/40 text-white' 
                      : 'bg-zinc-950 border-zinc-800/60 text-zinc-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full font-serif-gothic flex items-center justify-center font-bold text-sm ${
                      p.isAlive ? 'bg-red-900/80 text-[#e9c349] border border-red-700' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight text-white">{p.username}</h4>
                      <p className="text-[10px] text-red-300/70">
                        {p.isAlive ? 'Còn sống' : 'Đã chết'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      p.role === 'WEREWOLF'
                        ? 'bg-red-950 text-red-400 border-red-800'
                        : p.role === 'SEER'
                          ? 'bg-purple-950 text-purple-300 border-purple-800'
                          : p.role === 'BODYGUARD'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {p.role === 'WEREWOLF' ? 'SÓI' : p.role === 'SEER' ? 'TIÊN TRI' : p.role === 'BODYGUARD' ? 'BẢO VỆ' : 'DÂN LÀNG'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-10 text-red-300/50 text-xs">
                  Chưa có nhật ký hoạt động nào.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="p-2.5 rounded-xl bg-red-950/40 border border-red-900/40 text-xs">
                    <div className="flex justify-between text-[10px] text-[#e9c349] mb-1 font-bold">
                      <span>VÒNG {log.turn} ({log.phase})</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-red-200/90 leading-snug">{log.action}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Right Side: Night Quiz Broadcast */}
        <section className="col-span-8 bg-[#14080b] border border-red-900/50 rounded-2xl p-6 flex flex-col shadow-2xl relative overflow-hidden">
          
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
                    onClick={() => setSelectedQuestionIndex(idx)}
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

          {currentQuestion && isNight ? (
            <div className="flex-grow flex flex-col justify-between">
              
              {/* Question Text Box */}
              <div className="bg-[#1c090c] border-2 border-red-800/60 rounded-2xl p-6 shadow-2xl text-center relative overflow-hidden">
                <span className="absolute top-2 left-4 text-[10px] font-mono tracking-widest text-red-300/80 font-bold uppercase">
                  CÂU {selectedQuestionIndex + 1} / {nightQuestions.length}
                </span>
                <p className="text-xl md:text-2xl font-black text-[#e9c349] mt-2 leading-snug">
                  "{currentQuestion.question}"
                </p>

                <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
                  {correctAnswersFound[currentQuestion.id] ? (
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                      <span className="text-emerald-400 font-extrabold text-sm animate-pulse">
                        CHÍNH XÁC! ĐÃ TÌM THẤY ĐÁP ÁN ĐÚNG!
                      </span>
                      {selectedQuestionIndex + 1 < nightQuestions.length && (
                        <button
                          onClick={() => setSelectedQuestionIndex(selectedQuestionIndex + 1)}
                          className="px-4 py-1.5 rounded-full bg-[#e9c349] text-black font-extrabold text-xs shadow-lg hover:scale-105 cursor-pointer transition-all border border-yellow-200"
                        >
                          SANG CÂU HỎI 2
                        </button>
                      )}
                    </div>
                  ) : (wrongOptions[currentQuestion.id] || []).length > 0 ? (
                    <span className="text-red-400 font-bold text-xs bg-red-950 border border-red-800/60 px-3 py-1 rounded-full">
                      Đáp án vừa chọn chưa đúng (Đã khóa). Hãy chọn lại!
                    </span>
                  ) : null}

                  {isNight && onAdvancePhase && (
                    nightQuestions.length > 0 && nightQuestions.every(q => correctAnswersFound[q.id]) ? (
                      <button
                        onClick={onAdvancePhase}
                        className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs border-2 border-yellow-200 shadow-2xl cursor-pointer transition-all flex items-center gap-2 uppercase tracking-wider hover:scale-105 animate-pulse"
                      >
                        <span>BẮT ĐẦU BAN NGÀY (ĐÃ HOÀN THÀNH 2/2 CÂU)</span>
                      </button>
                    ) : (
                      <div className="px-5 py-2 rounded-full bg-red-950 border border-red-800/80 text-red-300 font-bold text-xs uppercase tracking-wider shadow-md">
                        CẦN TRẢ LỜI ĐÚNG CẢ 2 CÂU ĐỂ MỞ BAN NGÀY (ĐÃ ĐÚNG: {nightQuestions.filter(q => correctAnswersFound[q.id]).length}/{nightQuestions.length})
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-4 my-4">
                {currentQuestion.options.map((opt, i) => {
                  const theme = OPTION_THEMES[i % OPTION_THEMES.length];
                  const qId = currentQuestion.id;
                  const isWrong = (wrongOptions[qId] || []).includes(theme.key);
                  const isCorrect = correctAnswersFound[qId] && currentQuestion.correctAnswer === theme.key;

                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleOptionClick(theme.key)}
                      className={`relative p-5 rounded-2xl border-2 transition-all duration-300 shadow-xl flex flex-col justify-between overflow-hidden ${
                        isWrong
                          ? 'bg-zinc-950 border-red-950 opacity-40 grayscale cursor-not-allowed'
                          : isCorrect
                            ? 'bg-emerald-900 border-emerald-400 ring-4 ring-yellow-400 scale-[1.02] shadow-2xl'
                            : `${theme.bg} ${theme.border} cursor-pointer hover:scale-[1.02] active:scale-[0.98]`
                      }`}
                    >
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-xl ${isCorrect ? 'bg-emerald-800 border-emerald-400' : theme.labelBg} flex items-center justify-center font-black text-lg text-white shadow-md border border-white/20`}>
                            {theme.shape}
                          </span>
                          <span className="font-extrabold text-lg text-white">
                            {theme.key}.
                          </span>
                        </div>
                      </div>

                      <p className={`font-bold text-base md:text-lg mt-3 relative z-10 leading-snug ${isWrong ? 'line-through text-zinc-500' : 'text-white'}`}>
                        {opt.text}
                      </p>

                      {isWrong && (
                        <div className="absolute top-3 right-3 bg-red-950 text-red-400 border border-red-800 font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider z-20 shadow-md">
                          CHƯA ĐÚNG
                        </div>
                      )}

                      {isCorrect && (
                        <div className="absolute top-3 right-3 bg-yellow-400 text-slate-950 border border-yellow-200 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider animate-bounce z-20 shadow-lg">
                          CHÍNH XÁC!
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
