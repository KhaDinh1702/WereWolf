# 🌙 Danh Sách Các Vai Trò Trong Nghi Thức Ma Sói

Chào mừng ông chủ đến với tài liệu hướng dẫn các vai trò (Roles) trong trò chơi **Ma Sói - Nghi Thức Bóng Đêm**. Hệ thống game hiện tại hỗ trợ tối thiểu **4 người chơi** và sẽ tự động phân phối các vai trò dựa trên tổng số lượng người tham gia trong phòng.

---

## 🐺 1. MA SÓI
* **Biểu tượng:** 🐺
* **Phe chiến thắng:** Phe Ma Sói (Tiêu diệt dân làng cho tới khi số lượng Sói bằng hoặc lớn hơn số lượng người dân còn sống).
* **Mô tả:** Là thế lực tà ác ẩn mình trong bóng đêm. Vào ban ngày, Sói phải ngụy trang như một người dân bình thường để tránh bị treo cổ.
* **Cơ chế hoạt động:**
  - **Ban đêm (NIGHT):** Sói sẽ thức giấc cùng đồng bọn (nếu phòng đông người) và cùng thống nhất chọn ra 1 nạn nhân để cắn sát hại. 
  - **Quyền năng:** Sói có thể thảo luận riêng tư với nhau trong kênh trò chuyện nội bộ ban đêm để lên chiến thuật.
  - Nếu có nhiều Sói chọn các mục tiêu khác nhau, hệ thống sẽ tính theo số đông (majority vote). Nếu số phiếu cắn bằng nhau, một mục tiêu ngẫu nhiên trong nhóm bị cắn sẽ chết.

---

## 🔮 2. TIÊN TRI
* **Biểu tượng:** 🔮
* **Phe chiến thắng:** Phe Dân Làng (Tiêu diệt toàn bộ Ma Sói).
* **Mô tả:** Người sở hữu nhãn quan tâm linh vượt trội, có khả năng soi thấu linh hồn ẩn giấu bên trong mỗi người chơi.
* **Cơ chế hoạt động:**
  - **Ban đêm (NIGHT):** Tiên Tri thức giấc và chọn 1 người chơi để soi danh tính thực sự.
  - **Quyền năng:** Hệ thống sẽ ngay lập tức tiết lộ vai trò thực sự của người được soi cho Tiên Tri biết (Sói, Dân, hoặc Bảo Vệ).
  - **Chiến thuật:** Tiên Tri cần khôn khéo tiết lộ thông tin mình biết vào ban ngày mà không để lộ thân phận quá sớm, tránh bị Sói nhắm đến vào đêm tiếp theo.

---

## 🛡️ 3. BẢO VỆ
* **Biểu tượng:** 🛡️
* **Phe chiến thắng:** Phe Dân Làng (Tiêu diệt toàn bộ Ma Sói).
* **Mô tả:** Kẻ canh phòng thầm lặng trong đêm tối, sẵn sàng xả thân để bảo vệ một mục tiêu khỏi móng vuốt của Ma Sói.
* **Cơ chế hoạt động:**
  - **Ban đêm (NIGHT):** Bảo Vệ thức giấc và chọn bảo vệ 1 người chơi (có thể tự chọn bảo vệ chính mình).
  - **Quyền năng:** Nếu người được Bảo Vệ chọn cũng chính là mục tiêu bị Ma Sói cắn trong đêm đó, nạn nhân sẽ **sống sót** và không ai bị chết vào sáng hôm sau.
  - **Chiến thuật:** Cần đoán xem ai là người có khả năng bị Sói nhắm đến nhiều nhất (thường là Tiên Tri hoặc người đang dẫn dắt dư luận ban ngày) để bảo vệ kịp thời.

---

## 👨 4. DÂN LÀNG
* **Biểu tượng:** 👨
* **Phe chiến thắng:** Phe Dân Làng (Tiêu diệt toàn bộ Ma Sói).
* **Mô tả:** Những người dân lương thiện nhưng không có năng lực đặc biệt ban đêm. Sức mạnh lớn nhất của Dân Làng là sự đoàn kết và suy luận logic vào ban ngày.
* **Cơ chế hoạt động:**
  - **Ban đêm (NIGHT):** Ngủ say suốt đêm và không thực hiện hành động nào.
  - **Ban ngày (DAY/VOTING):** Cùng mọi người thảo luận qua kênh chat công khai, tìm ra những điểm nghi vấn của những người chơi khác và bỏ phiếu treo cổ kẻ tình nghi là Ma Sói.

---

## ⚖️ Luật Phân Bổ Vai Trò Tự Động (Role Auto-Distribution)
Hệ thống sẽ tự động điều chỉnh số lượng vai trò dựa trên tổng số người chơi (`N`) khi Host bấm **Bắt đầu nghi thức**:

| Số lượng người chơi | Ma Sói (🐺) | Tiên Tri (🔮) | Bảo Vệ (🛡️) | Dân Làng (👨) |
| :---: | :---: | :---: | :---: | :---: |
| **4 - 5 người** | 1 | 1 | 1 | `N - 3` |
| **6 - 8 người** | 2 | 1 | 1 | `N - 4` |
| **9+ người** | 3 | 1 | 1 | `N - 5` |

---

## 🔄 Quy Trình Vòng Lặp Trò Chơi (Game Flow Summary)
1. **Pha Ban Đêm (NIGHT):** 
   - Tất cả người chơi nhắm mắt. Sói chọn nạn nhân, Tiên Tri soi vai trò, Bảo Vệ chọn người bảo vệ.
2. **Pha Ban Ngày (DAY):** 
   - Mọi người thức giấc. Hệ thống công bố nạn nhân bị chết trong đêm (nếu có). Mọi người cùng thảo luận tìm manh mối.
3. **Pha Bỏ Phiếu (VOTING):** 
   - Mọi người tiến hành bỏ phiếu chọn người treo cổ. Người nhận số phiếu cao nhất (phải có đa số phiếu rõ ràng và không bị hòa) sẽ bị loại khỏi cuộc chơi.
4. **Kiểm tra thắng thua (Victory Check):** 
   - Trò chơi tiếp tục lặp lại các pha trên cho đến khi một phe đạt điều kiện chiến thắng.
