'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const ROLES_INFO = [
  {
    id: 'WEREWOLF',
    numeral: 'I',
    title: 'MA SÓI',
    subtitle: 'Kẻ săn đêm',
    faction: 'Phe Hắc Ám',
    tagline: 'Hung thần bóng đêm, kẻ thao túng sự nghi ngờ.',
    description:
      'Thế lực hắc ám ẩn mình trong lòng ngôi làng. Ban ngày hóa thân thành dân thường, ban đêm xé toạc sự yên bình bằng nanh vuốt đẫm máu.',
    ability:
      'Ban đêm: Thức giấc cùng đồng bọn, bàn bạc qua kênh chat riêng và thống nhất chọn một nạn nhân để tàn sát trước khi bình minh ló dạng.',
    winCondition:
      'Tiêu diệt dân làng cho tới khi số Sói bằng hoặc vượt số Dân Làng còn sống.',
    strategy:
      'Hòa mình vào đám đông, bắt chước lập luận hợp lý, và khéo léo hướng mũi nghi ngờ sang những người chơi lương thiện nhất.',
    portrait: '/images/cards/wolf.png',
    portraitLabel: 'MA SÓI',
    accentColor: '#8b0000',
    accentGlow: 'rgba(139,0,0,0.6)',
  },
  {
    id: 'SEER',
    numeral: 'II',
    title: 'TIÊN TRI',
    subtitle: 'Người soi mệnh',
    faction: 'Phe Dân Làng',
    tagline: 'Nhãn quan tâm linh soi tỏ mọi gian dối.',
    description:
      'Người dẫn lối ánh sáng của ngôi làng. Được ban phép năng thấu thị, có thể giải mã danh tính thực sự ẩn sau mỗi bộ mặt người.',
    ability:
      'Ban đêm: Chọn một người chơi bất kỳ để dùng nhãn quan tâm linh — nhận mặc khải về việc họ là Dân Làng lương thiện hay Ma Sói giả dạng.',
    winCondition: 'Phe Dân Làng chiến thắng khi tiêu diệt hoàn toàn phe Ma Sói.',
    strategy:
      'Giữ kín thân phận Tiên Tri, dẫn dắt bỏ phiếu bằng thông tin đã soi được. Lộ bài quá sớm đồng nghĩa với cái chết.',
    portrait: '/images/cards/prophet.png',
    portraitLabel: 'TIÊN TRI',
    accentColor: '#c0bdb8',
    accentGlow: 'rgba(192,189,184,0.5)',
  },
  {
    id: 'BODYGUARD',
    numeral: 'III',
    title: 'BẢO VỆ',
    subtitle: 'Người canh giữ',
    faction: 'Phe Dân Làng',
    tagline: 'Lá chắn thầm lặng trước nanh vuốt sói dữ.',
    description:
      'Kẻ gác đêm quả cảm, âm thầm đứng giữa bóng tối và ánh sáng. Không phép thuật, không tiên tri — chỉ có ý chí và thân xác làm khiên đỡ.',
    ability:
      'Ban đêm: Chọn một người để bảo vệ (kể cả bản thân). Nếu Sói tấn công đúng mục tiêu đó, họ sẽ sống sót lành lặn qua đêm.',
    winCondition: 'Phe Dân Làng chiến thắng khi tiêu diệt hoàn toàn phe Ma Sói.',
    strategy:
      'Phán đoán ai sẽ bị nhắm tới — thường là Tiên Tri hoặc người lên tiếng mạnh nhất ban ngày — và bảo vệ họ đúng thời điểm.',
    portrait: '/images/cards/guardian.png',
    portraitLabel: 'BẢO VỆ',
    accentColor: '#a8a5a0',
    accentGlow: 'rgba(168,165,160,0.5)',
  },
  {
    id: 'VILLAGER',
    numeral: 'IV',
    title: 'DÂN LÀNG',
    subtitle: 'Người dân',
    faction: 'Phe Dân Làng',
    tagline: 'Số đông đoàn kết, vũ khí của suy luận.',
    description:
      'Người dân thường thiện lương. Không phép thuật, không đặc quyền — chỉ có trực giác, quan sát và tiếng nói trong ánh mặt trời làm vũ khí duy nhất.',
    ability:
      'Ban đêm: Ngủ yên trong vô thức. Ban ngày: Thảo luận, chất vấn, truy tìm kẻ giả dối và đồng lòng đưa kẻ tình nghi lên giá treo cổ.',
    winCondition: 'Phe Dân Làng chiến thắng khi tiêu diệt hoàn toàn phe Ma Sói.',
    strategy:
      'Quan sát kỹ hành vi bỏ phiếu và lập luận. Kẻ nói nhiều nhưng nói vòng vo thường là Sói đang cố thoát thân.',
    portrait: '/images/cards/villager.png',
    portraitLabel: 'DÂN LÀNG',
    accentColor: '#888480',
    accentGlow: 'rgba(136,132,128,0.5)',
  },
];

const OrnamentalDivider = ({ color = '#5a403c' }) => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
    <div
      className="w-1.5 h-1.5 rotate-45 border"
      style={{ borderColor: color, background: 'transparent' }}
    />
    <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
  </div>
);

const InfoSection = ({ label, content, accentColor }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-3">
      <span
        className="text-[9px] tracking-[0.25em] uppercase font-bold font-serif-gothic"
        style={{ color: accentColor }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${accentColor}60, transparent)` }} />
    </div>
    <p className="text-zinc-300 text-xs leading-relaxed font-body-gothic">{content}</p>
  </div>
);

export default function AboutModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('WEREWOLF');

  if (!isOpen) return null;

  const role = ROLES_INFO.find((r) => r.id === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[1100px] h-[680px] flex flex-col z-10 rounded-sm overflow-hidden"
        style={{
          background: '#0a0a0a',
          border: '1px solid #2a1a1a',
          boxShadow: `0 0 80px rgba(0,0,0,0.98), inset 0 0 120px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Top border accent */}
        <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${role.accentColor}, transparent)` }} />

        {/* Header */}
        <div
          className="px-6 py-3 flex justify-between items-center"
          style={{ borderBottom: '1px solid #1a1010', background: 'rgba(0,0,0,0.6)' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-5 h-5 rotate-45 border flex items-center justify-center"
              style={{ borderColor: role.accentColor }}
            >
              <div className="w-1.5 h-1.5 rotate-45" style={{ background: role.accentColor }} />
            </div>
            <div>
              <h2
                className="text-sm uppercase tracking-[0.3em] font-bold font-serif-gothic"
                style={{ color: role.accentColor, textShadow: `0 0 20px ${role.accentGlow}` }}
              >
                Nghi Thức Vai Trò
              </h2>
              <p className="text-[9px] text-zinc-600 tracking-widest font-mono-gothic uppercase mt-0.5">
                Sổ tay của ngôi làng dưới trăng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-200 transition-colors text-lg font-light w-7 h-7 flex items-center justify-center"
            style={{ fontFamily: 'sans-serif' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left nav tabs */}
          <div
            className="w-[160px] flex flex-col py-6 overflow-y-auto flex-shrink-0"
            style={{ borderRight: '1px solid #1a1010', background: 'rgba(0,0,0,0.4)' }}
          >
            {ROLES_INFO.map((r, i) => {
              const isActive = activeTab === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveTab(r.id)}
                  className="w-full text-left px-5 py-3.5 transition-all relative group"
                  style={{
                    borderLeft: isActive ? `2px solid ${r.accentColor}` : '2px solid transparent',
                    background: isActive ? `${r.accentColor}15` : 'transparent',
                  }}
                >
                  <span
                    className="block text-[9px] font-mono-gothic tracking-widest mb-0.5"
                    style={{ color: isActive ? r.accentColor : '#3a3a3a' }}
                  >
                    {r.numeral.padStart(2, '0')}
                  </span>
                  <span
                    className="block text-xs uppercase tracking-wider font-bold font-serif-gothic transition-colors"
                    style={{ color: isActive ? '#e5e2e1' : '#5a5a5a' }}
                  >
                    {r.title}
                  </span>
                  <span
                    className="block text-[9px] tracking-wide font-mono-gothic transition-colors mt-0.5"
                    style={{ color: isActive ? r.accentColor : '#3a3a3a' }}
                  >
                    {r.subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content: image left + text right */}
          <div className="flex flex-1 overflow-hidden">

            {/* Portrait column */}
            <div
              className="w-[320px] flex-shrink-0 relative overflow-hidden"
              style={{ borderRight: '1px solid #1a1010' }}
            >
              {/* Character portrait image */}
              <Image
                key={role.id}
                src={role.portrait}
                alt={role.title}
                fill
                sizes="320px"
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
              />

              {/* Gradient overlays — keeps text readable, no layout break */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, transparent 60%, #0a0a0a 100%)`,
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, #0a0a0a 0%, transparent 40%)`,
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)`,
                }}
              />

              {/* Corner ornaments */}
              <div className="absolute top-3 left-3 w-5 h-5 z-10" style={{ borderTop: `1px solid ${role.accentColor}90`, borderLeft: `1px solid ${role.accentColor}90` }} />
              <div className="absolute top-3 right-3 w-5 h-5 z-10" style={{ borderTop: `1px solid ${role.accentColor}90`, borderRight: `1px solid ${role.accentColor}90` }} />
              <div className="absolute bottom-3 left-3 w-5 h-5 z-10" style={{ borderBottom: `1px solid ${role.accentColor}90`, borderLeft: `1px solid ${role.accentColor}90` }} />
              <div className="absolute bottom-3 right-3 w-5 h-5 z-10" style={{ borderBottom: `1px solid ${role.accentColor}90`, borderRight: `1px solid ${role.accentColor}90` }} />

              {/* Bottom name badge */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-10 flex flex-col items-center">
                <p
                  className="text-[9px] tracking-[0.3em] uppercase font-mono-gothic mb-0.5"
                  style={{ color: `${role.accentColor}cc` }}
                >
                  {role.faction}
                </p>
                <p
                  className="text-base font-serif-gothic font-black uppercase tracking-widest"
                  style={{
                    color: '#e5e2e1',
                    textShadow: `0 2px 12px rgba(0,0,0,1), 0 0 30px ${role.accentGlow}`,
                  }}
                >
                  {role.title}
                </p>
                <div
                  className="mt-1 h-px w-16"
                  style={{ background: `linear-gradient(to right, transparent, ${role.accentColor}, transparent)` }}
                />
              </div>
            </div>

            {/* Text info column */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
              
              {/* Title block */}
              <div>
                <h3
                  className="text-2xl font-serif-gothic font-black uppercase tracking-widest leading-none"
                  style={{
                    color: '#e5e2e1',
                    textShadow: `0 0 30px ${role.accentGlow}`,
                  }}
                >
                  {role.title}
                </h3>
                <p
                  className="text-xs font-mono-gothic tracking-widest mt-1"
                  style={{ color: role.accentColor }}
                >
                  — {role.subtitle} · {role.faction} —
                </p>
                <p className="text-zinc-400 text-xs italic font-body-gothic mt-2 leading-relaxed">
                  &ldquo;{role.tagline}&rdquo;
                </p>
              </div>

              <OrnamentalDivider color={role.accentColor} />

              <InfoSection
                label="Mô Tả"
                content={role.description}
                accentColor={role.accentColor}
              />

              <OrnamentalDivider color={role.accentColor} />

              <InfoSection
                label="Năng Lực Đặc Biệt"
                content={role.ability}
                accentColor={role.accentColor}
              />

              <OrnamentalDivider color={role.accentColor} />

              <InfoSection
                label="Điều Kiện Chiến Thắng"
                content={role.winCondition}
                accentColor={role.accentColor}
              />

              <OrnamentalDivider color={role.accentColor} />

              <InfoSection
                label="Chiến Thuật"
                content={role.strategy}
                accentColor={role.accentColor}
              />

              {/* Bottom faction badge */}
              <div className="pt-2">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5"
                  style={{
                    border: `1px solid ${role.accentColor}40`,
                    background: `${role.accentColor}10`,
                  }}
                >
                  <span
                    className="text-[9px] uppercase tracking-[0.25em] font-mono-gothic font-bold"
                    style={{ color: role.accentColor }}
                  >
                    {role.faction}
                  </span>
                  <div className="w-1 h-1 rotate-45" style={{ background: role.accentColor }} />
                  <span className="text-[9px] uppercase tracking-[0.25em] font-mono-gothic text-zinc-600">
                    {role.subtitle}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom border accent */}
        <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${role.accentColor}60, transparent)` }} />
      </div>
    </div>
  );
}
