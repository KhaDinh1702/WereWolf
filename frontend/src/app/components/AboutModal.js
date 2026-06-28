'use client';

import React, { useState } from 'react';

const ROLES_INFO = [
  {
    id: 'WEREWOLF',
    numeral: 'I',
    title: 'Ma Sói',
    subtitle: 'Werewolf',
    faction: 'Phe Hắc Ám',
    epithet: 'Hung Thần Trong Bóng Tối',
    tagline: 'Kẻ giả dạng với nanh vuốt đẫm máu',
    lore: 'Trong buổi bình minh của nghi lễ, những sinh linh quỷ dữ đã len lỏi vào ngôi làng mang hình hài của người thường. Chúng đi lại giữa ban ngày với vẻ mặt hiền lành, nhưng khi màn đêm buông xuống, bản chất tàn bạo của chúng hiện nguyên hình. Ma Sói không chiến đấu một mình — chúng hội tụ trong bóng tối, thì thầm chiến thuật và chọn ra nạn nhân tiếp theo.',
    ability: 'Mỗi đêm, đồng bọn Ma Sói thức giấc để bàn luận và lựa chọn một người dân để ám sát. Chúng có thể liên lạc nội bộ qua kênh trò chuyện bí mật chỉ Sói mới thấy được.',
    winCondition: 'Ma Sói chiến thắng khi số lượng Sói sống sót bằng hoặc vượt số lượng Dân Làng còn lại.',
    strategy: 'Giả danh lương thiện. Tích cực buộc tội kẻ vô tội để gieo rắc nghi ngờ. Dập tắt Tiên Tri trước tiên.',
    imagePlaceholder: 'MA SÓI'
  },
  {
    id: 'SEER',
    numeral: 'II',
    title: 'Tiên Tri',
    subtitle: 'The Seer',
    faction: 'Phe Ánh Sáng',
    epithet: 'Người Nhìn Thấy Linh Hồn',
    tagline: 'Nhãn quan vượt khỏi bức màn dối trá',
    lore: 'Được ban phước bởi những thế lực huyền bí, Tiên Tri sở hữu con mắt thứ ba có thể xuyên thấu lớp ngụy trang của bất kỳ sinh linh nào. Trong đêm sâu thẳm, Tiên Tri một mình thức giấc để nhìn vào tâm can người khác — nhìn thấy kẻ thú dữ đang ẩn náu hay người lương thiện trong trắng. Nhưng tri thức ấy cũng là gánh nặng, vì sói luôn nhắm đến kẻ soi thấy chúng trước.',
    ability: 'Mỗi đêm, Tiên Tri chọn một người để soi danh tính thật. Hệ thống sẽ tiết lộ người đó là MA SÓI hay DÂN THƯỜNG cho Tiên Tri biết.',
    winCondition: 'Tiên Tri thắng cùng phe Dân Làng khi tiêu diệt toàn bộ Ma Sói.',
    strategy: 'Che giấu thân phận. Dùng thông tin bạn có để dẫn dắt lá phiếu mà không lộ bài quá sớm.',
    imagePlaceholder: 'TIÊN TRI'
  },
  {
    id: 'BODYGUARD',
    numeral: 'III',
    title: 'Bảo Vệ',
    subtitle: 'The Bodyguard',
    faction: 'Phe Ánh Sáng',
    epithet: 'Lá Chắn Không Tên Của Đêm Tối',
    tagline: 'Xả thân trong bóng tối để giữ ngọn lửa sáng',
    lore: 'Không phải anh hùng, không phải thầy phù thủy — Bảo Vệ chỉ là một người bình thường với trái tim quả cảm. Họ không có khả năng nhìn xuyên qua lớp mặt nạ của kẻ thù, nhưng họ biết rằng ai đó trong làng cần được che chở. Đêm đêm, Bảo Vệ đứng gác trước cánh cửa của một người — sẵn sàng chặn đứng móng vuốt của Sói dữ bằng chính thân xác mình.',
    ability: 'Mỗi đêm, Bảo Vệ chọn một người (kể cả chính mình) để bảo vệ. Nếu người đó bị Ma Sói tấn công, họ sẽ sống sót.',
    winCondition: 'Bảo Vệ thắng cùng phe Dân Làng khi tiêu diệt toàn bộ Ma Sói.',
    strategy: 'Cố đoán xem ai đang bị đe dọa nhất — thường là người lên tiếng mạnh nhất hoặc Tiên Tri.',
    imagePlaceholder: 'BẢO VỆ'
  },
  {
    id: 'VILLAGER',
    numeral: 'IV',
    title: 'Dân Làng',
    subtitle: 'The Villager',
    faction: 'Phe Ánh Sáng',
    epithet: 'Tiếng Nói Của Số Đông',
    tagline: 'Sức mạnh nằm ở sự đoàn kết và lý luận',
    lore: 'Không có phép thuật, không có thị giác bí ẩn — Dân Làng chỉ có nhau. Họ thức dậy mỗi sáng trong nỗi lo sợ ai sẽ là nạn nhân tiếp theo, nhưng cũng mang theo hi vọng rằng nếu đủ người đoàn kết, ánh sáng lý trí sẽ vạch mặt bóng tối. Vũ khí duy nhất của họ là lời nói, quan sát, và lá phiếu. Đủ rồi để thay đổi số phận.',
    ability: 'Ban ngày: Tham gia thảo luận công khai và bỏ phiếu treo cổ người bị nghi ngờ là Ma Sói. Ban đêm: Không có hành động đặc biệt.',
    winCondition: 'Dân Làng thắng khi tiêu diệt toàn bộ Ma Sói trước khi bị áp đảo.',
    strategy: 'Chú ý đến mâu thuẫn trong lời nói. Kẻ Sói thường không nhất quán hoặc tránh né lập luận thẳng thắn.',
    imagePlaceholder: 'DÂN LÀNG'
  }
];

// Decorative rune strip (vertical text)
const RUNE_TEXT = 'NGHI · LỄ · BÓNG · ĐÊM · MA · SÓI · NGHI · LỄ · BÓNG · ĐÊM · MA · SÓI';

export default function AboutModal({ isOpen, onClose }) {
  const [activeId, setActiveId] = useState('WEREWOLF');

  if (!isOpen) return null;

  const role = ROLES_INFO.find(r => r.id === activeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* --- Codex Container --- */}
      <div
        className="relative z-10 flex flex-col overflow-hidden"
        style={{
          width: '880px',
          height: '580px',
          background: '#0a0505',
          border: '2px solid #7a1a1a',
          boxShadow: '0 0 0 1px #3a0a0a, 0 0 60px rgba(120,20,20,0.4), inset 0 0 80px rgba(0,0,0,0.8)',
          fontFamily: "'Cinzel', 'Garamond', Georgia, serif",
        }}
      >
        {/* ========== TOP HEADER BAR ========== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            borderBottom: '1px solid #7a1a1a',
            background: 'linear-gradient(90deg, #1a0505 0%, #0f0202 50%, #1a0505 100%)',
            padding: '6px 16px',
          }}
        >
          <span style={{ color: '#c8a06a', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Nghi Lễ Ma Sói · Codex Vai Trò
          </span>
          {/* Role selector tabs in center */}
          <div style={{ display: 'flex', gap: '2px' }}>
            {ROLES_INFO.map(r => (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                style={{
                  padding: '3px 14px',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s',
                  background: activeId === r.id ? '#7a1a1a' : 'transparent',
                  color: activeId === r.id ? '#f5dcd0' : '#7a5050',
                  borderBottom: activeId === r.id ? '2px solid #c8a06a' : '2px solid transparent',
                  fontFamily: 'inherit',
                }}
              >
                {r.numeral}. {r.title}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#c8a06a', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' }}>
              {role.faction}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: '1px solid #7a1a1a', color: '#7a5050',
                width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#c83030'; e.currentTarget.style.borderColor = '#c83030'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7a5050'; e.currentTarget.style.borderColor = '#7a1a1a'; }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ========== MAIN BODY ========== */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* --- LEFT RUNE STRIP --- */}
          <div style={{
            width: '22px', flexShrink: 0,
            borderRight: '1px solid #7a1a1a',
            background: 'linear-gradient(180deg, #1a0505 0%, #0a0202 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <div style={{
              writingMode: 'vertical-rl', textOrientation: 'mixed',
              color: '#5a1a1a', fontSize: '8px', letterSpacing: '4px',
              whiteSpace: 'nowrap', userSelect: 'none',
            }}>
              {RUNE_TEXT}
            </div>
          </div>

          {/* --- IMAGE PANEL (Left ~45%) --- */}
          <div style={{ width: '380px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            {/* Character portrait placeholder */}
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(160deg, #1a0a08 0%, #0d0505 60%, #080202 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {/* Vignette overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
                pointerEvents: 'none', zIndex: 2,
              }} />

              {/* Atmospheric glow */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px',
                background: 'linear-gradient(0deg, rgba(80,10,10,0.6) 0%, transparent 100%)',
                pointerEvents: 'none', zIndex: 1,
              }} />

              {/* Placeholder art frame */}
              <div style={{
                position: 'relative', zIndex: 3,
                width: '240px', height: '340px',
                border: '1px solid #5a1a1a',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(10,2,2,0.6)',
              }}>
                {/* Corner decorations */}
                {[['top-0 left-0', 'top', 'left'], ['top-0 right-0', 'top', 'right'], ['bottom-0 left-0', 'bottom', 'left'], ['bottom-0 right-0', 'bottom', 'right']].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    ...(i < 2 ? { top: '-4px' } : { bottom: '-4px' }),
                    ...(i % 2 === 0 ? { left: '-4px' } : { right: '-4px' }),
                    width: '14px', height: '14px',
                    borderTop: i < 2 ? '2px solid #c8a06a' : 'none',
                    borderBottom: i >= 2 ? '2px solid #c8a06a' : 'none',
                    borderLeft: i % 2 === 0 ? '2px solid #c8a06a' : 'none',
                    borderRight: i % 2 !== 0 ? '2px solid #c8a06a' : 'none',
                  }} />
                ))}

                <span style={{
                  color: '#3a1515', fontSize: '11px', letterSpacing: '6px',
                  textTransform: 'uppercase', textAlign: 'center', lineHeight: '2.2',
                  fontFamily: 'inherit',
                }}>
                  {role.imagePlaceholder}
                  <br />
                  <span style={{ fontSize: '8px', letterSpacing: '4px', color: '#2a0f0f' }}>
                    PORTRAIT PLACEHOLDER
                  </span>
                </span>
              </div>

              {/* Bottom name on image */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4,
                padding: '12px 16px',
                borderTop: '1px solid #5a1a1a',
                background: 'linear-gradient(0deg, rgba(5,0,0,0.95) 0%, transparent 100%)',
              }}>
                <div style={{ color: '#c8a06a', fontSize: '9px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '2px' }}>
                  {role.epithet}
                </div>
                <div style={{
                  color: '#e8c8b8', fontSize: '22px', fontWeight: '700',
                  letterSpacing: '2px', textTransform: 'uppercase',
                  textShadow: '0 0 20px rgba(180,60,60,0.5)',
                }}>
                  {role.title}
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT RUNE STRIP (middle divider) --- */}
          <div style={{
            width: '22px', flexShrink: 0,
            borderLeft: '1px solid #7a1a1a', borderRight: '1px solid #7a1a1a',
            background: 'linear-gradient(180deg, #1a0505 0%, #0a0202 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <div style={{
              writingMode: 'vertical-rl', textOrientation: 'mixed',
              color: '#5a1a1a', fontSize: '8px', letterSpacing: '4px',
              whiteSpace: 'nowrap', userSelect: 'none',
            }}>
              {RUNE_TEXT}
            </div>
          </div>

          {/* --- INFO PANEL (Right ~55%) --- */}
          <div style={{
            flex: 1, overflow: 'hidden auto', padding: '20px 20px 16px',
            background: 'linear-gradient(180deg, #080202 0%, #0a0303 100%)',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>

            {/* Title block */}
            <div style={{ borderBottom: '1px solid #5a1a1a', paddingBottom: '10px' }}>
              <div style={{
                color: '#c83030', fontSize: '26px', fontWeight: '900',
                letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1.1,
                textShadow: '0 0 30px rgba(200,48,48,0.4)',
                fontStyle: 'italic',
              }}>
                {role.title}
              </div>
              <div style={{ color: '#c8a06a', fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', marginTop: '4px' }}>
                — {role.subtitle} —
              </div>
              <div style={{ color: '#8a6060', fontSize: '11px', letterSpacing: '1px', marginTop: '6px', fontStyle: 'italic' }}>
                {role.tagline}
              </div>
            </div>

            {/* NĂNG LỰC section */}
            <div>
              <div style={{
                color: '#9a3030', fontSize: '9px', letterSpacing: '4px', textTransform: 'uppercase',
                marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #7a1a1a, transparent)' }} />
                NĂNG LỰC
                <span style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, #7a1a1a, transparent)' }} />
              </div>
              <p style={{
                color: '#c8b4a8', fontSize: '11.5px', lineHeight: '1.75', margin: 0,
                fontStyle: 'italic', fontFamily: "'Georgia', serif",
              }}>
                {role.ability}
              </p>
            </div>

            {/* ĐIỀU KIỆN THẮNG section */}
            <div>
              <div style={{
                color: '#9a3030', fontSize: '9px', letterSpacing: '4px', textTransform: 'uppercase',
                marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #7a1a1a, transparent)' }} />
                ĐIỀU KIỆN THẮNG
                <span style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, #7a1a1a, transparent)' }} />
              </div>
              <p style={{
                color: '#c8b4a8', fontSize: '11.5px', lineHeight: '1.75', margin: 0,
                fontStyle: 'italic', fontFamily: "'Georgia', serif",
              }}>
                {role.winCondition}
              </p>
            </div>

            {/* TRUYỀN THUYẾT section */}
            <div>
              <div style={{
                color: '#9a3030', fontSize: '9px', letterSpacing: '4px', textTransform: 'uppercase',
                marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #7a1a1a, transparent)' }} />
                TRUYỀN THUYẾT
                <span style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, #7a1a1a, transparent)' }} />
              </div>
              <p style={{
                color: '#a09090', fontSize: '11px', lineHeight: '1.8', margin: 0,
                fontStyle: 'italic', fontFamily: "'Georgia', serif",
              }}>
                {role.lore}
              </p>
            </div>

            {/* CHIẾN THUẬT section */}
            <div style={{
              marginTop: 'auto', paddingTop: '10px',
              borderTop: '1px solid #3a1010',
            }}>
              <div style={{ color: '#7a5030', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '4px' }}>
                Chiến Thuật
              </div>
              <p style={{
                color: '#7a6060', fontSize: '11px', lineHeight: '1.6', margin: 0,
                fontFamily: "'Georgia', serif",
              }}>
                {role.strategy}
              </p>
            </div>

          </div>

          {/* --- RIGHT RUNE STRIP --- */}
          <div style={{
            width: '22px', flexShrink: 0,
            borderLeft: '1px solid #7a1a1a',
            background: 'linear-gradient(180deg, #1a0505 0%, #0a0202 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <div style={{
              writingMode: 'vertical-rl', textOrientation: 'mixed',
              color: '#5a1a1a', fontSize: '8px', letterSpacing: '4px',
              whiteSpace: 'nowrap', userSelect: 'none', transform: 'rotate(180deg)',
            }}>
              {RUNE_TEXT}
            </div>
          </div>

        </div>

        {/* ========== BOTTOM FOOTER BAR ========== */}
        <div style={{
          borderTop: '1px solid #7a1a1a',
          background: 'linear-gradient(90deg, #1a0505 0%, #0f0202 50%, #1a0505 100%)',
          padding: '5px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#5a3030', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase' }}>
            {role.epithet} · {role.faction}
          </span>
          <span style={{ color: '#5a3030', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Ma Sói — Nghi Thức Bóng Đêm · {role.numeral.padStart(2, '0')}
          </span>
        </div>

      </div>
    </div>
  );
}
