export const CONTENT_DESKS = [
  { value: "ke_toan", label: "Kế toán", hint: "Hạch toán, chứng từ, báo cáo và tình huống thực hành." },
  { value: "thue", label: "Thuế", hint: "Chính sách, kê khai, quyết toán và nghĩa vụ thuế." },
  { value: "tai_chinh", label: "Tài chính", hint: "Dòng tiền, chỉ số, quản trị và phân tích doanh nghiệp." },
  { value: "tin_hot", label: "Tin nóng", hint: "Diễn biến mới, thời điểm sự kiện và tác động tới độc giả." },
];

export function productionChecks(title: string, meta: string, content: string, hasSource: boolean) {
  return [
    { label: "Tiêu đề từ 15–100 ký tự", pass: title.trim().length >= 15 && title.trim().length <= 100 },
    { label: "Mô tả SEO từ 100–160 ký tự", pass: meta.trim().length >= 100 && meta.trim().length <= 160 },
    { label: "Nội dung tối thiểu 300 từ", pass: content.trim().split(/\s+/u).filter(Boolean).length >= 300 },
    { label: "Có đề mục rõ ràng", pass: /^##\s+\S/mu.test(content) },
    { label: "Có nguồn để đối chiếu", pass: hasSource },
    { label: "Không còn chỗ trống cần bổ sung", pass: !/\[(?:cần|bổ sung|chưa xác minh|TODO)[^\]]*\]/iu.test(content) },
  ];
}
