/**
 * Bộ câu hỏi trắc nghiệm Lợi ích kinh tế (8 câu hỏi)
 */
export const ECONOMIC_QUESTIONS = [
  {
    id: 1,
    question: 'Lợi ích kinh tế là gì?',
    options: [
      { key: 'A', text: 'Lợi ích về tinh thần của con người.' },
      { key: 'B', text: 'Lợi ích vật chất thu được khi thực hiện các hoạt động kinh tế.' },
      { key: 'C', text: 'Lợi ích về chính trị.' },
      { key: 'D', text: 'Lợi ích về văn hóa.' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 2,
    question: 'Lợi ích kinh tế được xem là gì đối với các hoạt động kinh tế?',
    options: [
      { key: 'A', text: 'Trở ngại của sản xuất.' },
      { key: 'B', text: 'Động lực của các hoạt động kinh tế.' },
      { key: 'C', text: 'Kết quả của hoạt động văn hóa.' },
      { key: 'D', text: 'Yếu tố không quan trọng.' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 3,
    question: 'Đối với chủ doanh nghiệp, lợi ích kinh tế thường biểu hiện trước hết ở:',
    options: [
      { key: 'A', text: 'Tiền lương.' },
      { key: 'B', text: 'Phúc lợi xã hội.' },
      { key: 'C', text: 'Lợi nhuận.' },
      { key: 'D', text: 'Danh tiếng.' }
    ],
    correctAnswer: 'C'
  },
  {
    id: 4,
    question: 'Đối với người lao động, lợi ích kinh tế chủ yếu biểu hiện ở:',
    options: [
      { key: 'A', text: 'Cổ tức.' },
      { key: 'B', text: 'Tiền lương, tiền công.' },
      { key: 'C', text: 'Lợi nhuận doanh nghiệp.' },
      { key: 'D', text: 'Thuế.' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 5,
    question: 'Quan hệ lợi ích kinh tế là mối quan hệ giữa:',
    options: [
      { key: 'A', text: 'Con người với thiên nhiên.' },
      { key: 'B', text: 'Các chủ thể kinh tế nhằm xác lập lợi ích kinh tế.' },
      { key: 'C', text: 'Nhà nước với văn hóa.' },
      { key: 'D', text: 'Chỉ giữa doanh nghiệp với khách hàng.' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 6,
    question: 'Ví dụ nào thể hiện mâu thuẫn trong quan hệ lợi ích kinh tế?',
    options: [
      { key: 'A', text: 'Doanh nghiệp mở rộng sản xuất.' },
      { key: 'B', text: 'Tiền lương tăng làm lợi nhuận doanh nghiệp giảm.' },
      { key: 'C', text: 'Người lao động được thưởng.' },
      { key: 'D', text: 'Thị trường mở rộng.' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 7,
    question: 'Trong cơ chế thị trường, các chủ thể quan hệ với nhau chủ yếu xuất phát từ:',
    options: [
      { key: 'A', text: 'Quan hệ huyết thống.' },
      { key: 'B', text: 'Quan hệ lợi ích.' },
      { key: 'C', text: 'Quan hệ tôn giáo.' },
      { key: 'D', text: 'Quan hệ địa lý.' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 8,
    question: 'Lợi ích kinh tế được thực hiện chủ yếu thông qua:',
    options: [
      { key: 'A', text: 'Nguyên tắc thị trường và chính sách của Nhà nước.' },
      { key: 'B', text: 'Được thực hiện thông qua cạnh tranh.' },
      { key: 'C', text: 'Được thực hiện thông qua Nhà nước.' },
      { key: 'D', text: 'Được thực hiện thông qua doanh nghiệp.' }
    ],
    correctAnswer: 'A'
  }
];

/**
 * Lấy 2 câu hỏi tương ứng cho lượt đêm (turn 1 -> Q1,Q2; turn 2 -> Q3,Q4; v.v.)
 */
export const getQuestionsForTurn = (turn) => {
  const startIndex = ((turn - 1) * 2) % ECONOMIC_QUESTIONS.length;
  const q1 = ECONOMIC_QUESTIONS[startIndex];
  const q2 = ECONOMIC_QUESTIONS[(startIndex + 1) % ECONOMIC_QUESTIONS.length];
  return [q1, q2];
};
