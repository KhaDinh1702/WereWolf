'use client';

import React, { useState } from 'react';

const ROLES_INFO = [
  {
    id: 'WEREWOLF',
    numeral: 'I',
    title: 'MA SÓI',
    vietnameseTitle: 'Ma Sói (Werewolf)',
    tagline: 'Hung thần bóng đêm, kẻ thao túng sự nghi ngờ.',
    description: 'Thế lực hắc ám chính ẩn mình trong ngôi làng. Nhiệm vụ của bạn là ẩn nấp khéo léo vào ban ngày và tàn sát dân thường khi màn đêm buông xuống.',
    ability: 'Ban đêm: Thức giấc cùng đồng bọn để chọn nạn nhân cắn chết. Có thể trao đổi chiến thuật qua kênh chat ban đêm dành riêng cho Sói.',
    winCondition: 'Tiêu diệt dân làng cho tới khi số lượng Sói bằng hoặc lớn hơn số lượng Dân Làng còn sống.',
    strategy: 'Hãy giả vờ làm một Dân Làng nhiệt huyết, hùa theo các lập luận hợp lý và hướng sự nghi ngờ sang những người chơi khác.',
    placeholderImage: 'Ma Sói Illustration'
  },
  {
    id: 'SEER',
    numeral: 'II',
    title: 'TIÊN TRI',
    vietnameseTitle: 'Tiên Tri (Seer)',
    tagline: 'Nhãn quan tâm linh soi tỏ mọi sự gian dối.',
    description: 'Người dẫn lối ánh sáng của phe Dân Làng. Sở hữu khả năng nhìn thấu linh hồn để giải mã danh tính thực sự của bất kỳ người chơi nào.',
    ability: 'Ban đêm: Chọn một người chơi bất kỳ để soi rõ họ là người dân lương thiện hay là Ma Sói giả dạng.',
    winCondition: 'Phe Dân Làng chiến thắng khi tiêu diệt hoàn toàn phe Ma Sói.',
    strategy: 'Đừng vội công khai danh phận Tiên Tri quá sớm. Hãy khéo léo dẫn dắt bỏ phiếu dựa trên thông tin bạn soi được để bảo toàn tính mạng trước nanh vuốt Sói.',
    placeholderImage: 'Tiên Tri Illustration'
  },
  {
    id: 'BODYGUARD',
    numeral: 'III',
    title: 'BẢO VỆ',
    vietnameseTitle: 'Bảo Vệ (Bodyguard)',
    tagline: 'Lá chắn thầm lặng trước vuốt sắc sói dữ.',
    description: 'Kẻ gác đêm quả cảm của ngôi làng, âm thầm bảo vệ những mục tiêu quan trọng trước nguy cơ bị ám sát.',
    ability: 'Ban đêm: Chọn một người chơi để bảo vệ (có thể tự bảo vệ chính mình). Nếu mục tiêu được chọn bị Sói cắn trong đêm, họ sẽ sống sót lành lặn.',
    winCondition: 'Phe Dân Làng chiến thắng khi tiêu diệt hoàn toàn phe Ma Sói.',
    strategy: 'Cố gắng phán đoán xem ai sẽ là nạn nhân tiếp theo của Sói (thường là Tiên Tri hoặc người tích cực lập luận ban ngày) để bảo vệ họ đúng lúc.',
    placeholderImage: 'Bảo Vệ Illustration'
  },
  {
    id: 'VILLAGER',
    numeral: 'IV',
    title: 'DÂN LÀNG',
    vietnameseTitle: 'Dân Làng (Villager)',
    tagline: 'Số đông đoàn kết, sức mạnh của sự suy luận.',
    description: 'Người dân thường thiện lương. Dù không có phép thuật đặc biệt trong đêm, tiếng nói và lá phiếu bỏ ban ngày của bạn chính là vũ khí quyết định số phận ngôi làng.',
    ability: 'Ban đêm: Ngủ say bình yên. Ban ngày: Thảo luận, chất vấn những kẻ nghi ngờ và đồng lòng bỏ phiếu treo cổ Sói ẩn mình.',
    winCondition: 'Phe Dân Làng chiến thắng khi tiêu diệt hoàn toàn phe Ma Sói.',
    strategy: 'Quan sát kỹ thái độ bỏ phiếu và lập luận của từng người. Tìm kiếm những kẽ hở trong lời khai của kẻ bị tình nghi để tìm ra Sói.',
    placeholderImage: 'Dân Làng Illustration'
  }
];

export default function AboutModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('WEREWOLF');

  if (!isOpen) return null;

  const currentRole = ROLES_INFO.find(r => r.id === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative bg-zinc-950 border border-outline-variant/30 w-full max-w-[850px] h-[580px] rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden z-10 font-serif-gothic">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-black/40">
          <div>
            <h2 className="text-primary text-xl uppercase tracking-widest font-bold blood-glow">Nghi Thức Vai Trò</h2>
            <p className="text-[10px] font-mono-gothic text-zinc-500 tracking-wider mt-0.5">TÌM HIỂU THÂN PHẬN & QUY LUẬT TRONG BÓNG ĐÊM</p>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-red-500 font-sans text-xl font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-grow flex flex-row overflow-hidden">
          
          {/* Left Navigation Tabs */}
          <div className="w-[180px] border-r border-outline-variant/20 bg-zinc-950/50 flex flex-col py-4 overflow-y-auto">
            {ROLES_INFO.map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveTab(role.id)}
                className={`w-full py-3 px-5 text-left border-l-2 text-sm transition-all tracking-wider uppercase ${
                  activeTab === role.id 
                    ? 'border-secondary text-[#e9c349] bg-red-950/10 font-bold' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {role.title}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="flex-grow flex flex-row p-6 gap-6 overflow-y-auto">
            
            {/* Info Column (Left 58%) */}
            <div className="w-[58%] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-secondary text-2xl font-bold tracking-wide uppercase">
                    {currentRole.vietnameseTitle}
                  </h3>
                  <p className="text-zinc-400 text-xs italic">
                    "{currentRole.tagline}"
                  </p>
                </div>

                <p className="text-zinc-300 text-xs leading-relaxed font-body-gothic font-sans">
                  {currentRole.description}
                </p>

                <div className="space-y-2 pt-2 text-xs font-body-gothic">
                  <div>
                    <span className="text-[#e9c349] font-bold block mb-0.5 uppercase tracking-wider font-serif-gothic">🛡️ Năng Lực Đặc Biệt:</span>
                    <span className="text-zinc-300 font-sans">{currentRole.ability}</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-bold block mb-0.5 uppercase tracking-wider font-serif-gothic">🎯 Điều Kiện Thắng:</span>
                    <span className="text-zinc-300 font-sans">{currentRole.winCondition}</span>
                  </div>
                  <div>
                    <span className="text-green-400 font-bold block mb-0.5 uppercase tracking-wider font-serif-gothic">🧠 Mẹo Chiến Thuật:</span>
                    <span className="text-zinc-400 font-sans italic">"{currentRole.strategy}"</span>
                  </div>
                </div>
              </div>

              {/* Character Illustration Box (Left bottom) */}
              <div className="border border-outline-variant/20 bg-black/60 aspect-[16/7] rounded-sm flex items-center justify-center p-2 relative overflow-hidden select-none">
                {/* Vintage dark corner ticks */}
                <div className="absolute top-1 left-1 border-t border-l border-zinc-800 w-2 h-2"></div>
                <div className="absolute top-1 right-1 border-t border-r border-zinc-800 w-2 h-2"></div>
                <div className="absolute bottom-1 left-1 border-b border-l border-zinc-800 w-2 h-2"></div>
                <div className="absolute bottom-1 right-1 border-b border-r border-zinc-800 w-2 h-2"></div>
                
                <span className="text-[10px] text-zinc-600 font-mono-gothic tracking-widest uppercase">
                  {currentRole.placeholderImage}
                </span>
              </div>
            </div>

            {/* Tarot Card Column (Right 42% - Styled using the User's card template, scaled to fit) */}
            <div className="w-[42%] flex items-center justify-center relative">
              {/* Scaled version of the tarot-frame (Scale factor 0.6) */}
              <div 
                className="relative bg-zinc-950 border border-amber-950/20 shadow-2xl drop-shadow-2xl flex flex-col rounded-sm"
                style={{
                  width: '260px',
                  height: '450px',
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA7bPFWrsCfXAEpIOdidEFVoMq0OCu_EFGJobJEl1FFX_AGx6DTIOc9TSD-B1GyEa7FZ42UVpzwoTirAmjQJjzNzw6u58LSrL7mGluwxW9h9RVTAAaDUQxmZrpL-RFa_Vs8qEpGkGLzgVc9u3y2A4bws_Cp8iuO5ZudMa2R38YUTrJyT0F5hypPcYXlMUgsB14igjX0NyLKO3YB2bl6L5Fj7C8Z-vcMEvtA8K7sOI3xvQ0VLAyU2VbTKhhSebcqolSFzux3ol5qiOo')`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              >
                {/* Top badge circle */}
                <div 
                  className="absolute left-50% transform -translate-x-[50%] flex justify-center items-center text-on-background font-bold text-center select-none"
                  style={{
                    top: '21px',
                    left: '50%',
                    width: '30px',
                    height: '30px',
                    fontSize: '0.9rem',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}
                >
                  {currentRole.numeral}
                </div>

                {/* Central Portrait Box */}
                <div 
                  className="absolute overflow-hidden flex justify-center items-center rounded-sm bg-black/35 select-none"
                  style={{
                    top: '78px',
                    bottom: '72px',
                    left: '18px',
                    right: '18px',
                  }}
                >
                  {/* Subtle Gothic Ring */}
                  <div className="absolute inset-2 border border-zinc-800/40 rounded-full animate-[spin_40s_linear_infinite]"></div>
                  
                  <span className="text-[9px] text-outline-variant/60 font-serif-gothic italic select-none font-bold tracking-widest">
                    CARD PORTRAIT
                  </span>
                </div>

                {/* Bottom Title Box */}
                <div 
                  className="absolute text-center text-on-background font-bold tracking-widest uppercase select-none"
                  style={{
                    bottom: '27px',
                    left: '0',
                    right: '0',
                    fontSize: '1.05rem',
                    padding: '0 24px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: '1px 1px 3px rgba(0,0,0,0.95)'
                  }}
                >
                  {currentRole.title}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
