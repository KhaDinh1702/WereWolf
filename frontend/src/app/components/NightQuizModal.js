'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const OPTION_STYLES = [
  { key: 'A', bg: 'bg-red-950/80 hover:bg-red-900/90', border: 'border-red-700/70', selectedBg: 'bg-red-900 ring-2 ring-[#e9c349]', shape: '▲' },
  { key: 'B', bg: 'bg-red-950/80 hover:bg-red-900/90', border: 'border-red-700/70', selectedBg: 'bg-red-900 ring-2 ring-[#e9c349]', shape: '◆' },
  { key: 'C', bg: 'bg-red-950/80 hover:bg-red-900/90', border: 'border-red-700/70', selectedBg: 'bg-red-900 ring-2 ring-[#e9c349]', shape: '●' },
  { key: 'D', bg: 'bg-red-950/80 hover:bg-red-900/90', border: 'border-red-700/70', selectedBg: 'bg-red-900 ring-2 ring-[#e9c349]', shape: '■' }
];

export default function NightQuizModal({ nightQuestions, quizAnswers, currentTurn, onAnswer }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!nightQuestions || nightQuestions.length === 0) return null;

  const currentQuestion = nightQuestions[activeTab] || nightQuestions[0];
  
  // Find current saved answer for this question
  const currentAnswerObj = (quizAnswers || []).find(
    a => a.questionId === currentQuestion.id && a.turn === currentTurn
  );
  const selectedKey = currentAnswerObj ? currentAnswerObj.selectedKey : null;

  return (
    <div className="mb-6 bg-[#14080b]/95 border-2 border-red-800/60 rounded-2xl p-5 shadow-2xl backdrop-blur-md animate-fade-in">
      {/* Quiz Modal Header */}
      <div className="flex items-center justify-between border-b border-red-900/50 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Image src="/images/rule-book.png" alt="" width={22} height={22} />
          <div>
            <h3 className="font-extrabold text-base text-[#e9c349] uppercase tracking-wide">
              CÂU HỎI KINH TẾ (2 CÂU/ĐÊM)
            </h3>
            <p className="text-[11px] text-red-300/80">
              Hãy chọn đáp án đúng để thực hiện nghĩa vụ nghi lễ đêm nay.
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-2">
          {nightQuestions.map((q, idx) => {
            const isAnswered = (quizAnswers || []).some(
              a => a.questionId === q.id && a.turn === currentTurn
            );
            return (
              <button
                key={q.id}
                onClick={() => setActiveTab(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === idx
                    ? 'bg-[#e9c349] text-slate-950 font-black shadow-md'
                    : 'bg-red-950/80 text-red-200 hover:text-white border border-red-700/50'
                }`}
              >
                <span>Câu {idx + 1}</span>
                {isAnswered && <span className="text-[10px] text-emerald-400 font-bold">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-red-950/60 border border-red-800/40 rounded-xl p-4 mb-4">
        <p className="text-sm md:text-base font-bold text-[#e9c349] leading-snug">
          Câu {activeTab + 1}: &ldquo;{currentQuestion.question}&rdquo;
        </p>
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentQuestion.options.map((opt, i) => {
          const style = OPTION_STYLES[i % OPTION_STYLES.length];
          const isSelected = selectedKey === opt.key;

          return (
            <button
              key={opt.key}
              onClick={() => onAnswer(currentQuestion.id, opt.key)}
              className={`p-3.5 rounded-xl border text-left font-bold transition-all cursor-pointer flex items-center gap-3 text-white shadow-md ${
                isSelected ? style.selectedBg : `${style.bg} ${style.border}`
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-black/30 border border-white/20 flex items-center justify-center font-black text-xs shrink-0">
                {style.shape}
              </span>
              <span className="text-sm font-semibold flex-grow">
                <strong className="text-[#e9c349] font-extrabold mr-1">{opt.key}.</strong>
                {opt.text}
              </span>
              {isSelected && <span className="text-xs text-yellow-300 font-extrabold shrink-0">✓ Đã chọn</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
