export interface PortalStudentRow {
  masv: string;
  fullname: string;
  className: string;
  gpa: number;
  note: string;
}

export interface PortalClassSummary {
  className: string;
  count: number;
}

export const PORTAL_CLASS_SUMMARIES: PortalClassSummary[] = [
  {
    "className": "ANHTTT",
    "count": 54
  },
  {
    "className": "CNTT1",
    "count": 46
  },
  {
    "className": "CNTT2",
    "count": 46
  },
  {
    "className": "TT",
    "count": 45
  },
  {
    "className": "CNTT3",
    "count": 22
  },
  {
    "className": "TLPK2",
    "count": 18
  },
  {
    "className": "TLPK1",
    "count": 17
  },
  {
    "className": "BĐATTT",
    "count": 16
  },
  {
    "className": "PTDL",
    "count": 16
  },
  {
    "className": "TTNT",
    "count": 15
  },
  {
    "className": "CNTT",
    "count": 13
  },
  {
    "className": "TLPK",
    "count": 13
  },
  {
    "className": "ĐTH",
    "count": 13
  },
  {
    "className": "TLHQ",
    "count": 11
  },
  {
    "className": "TBBKNL",
    "count": 10
  },
  {
    "className": "MMT & TTDL",
    "count": 9
  },
  {
    "className": "KTPM",
    "count": 8
  },
  {
    "className": "HTTT",
    "count": 8
  },
  {
    "className": "NL",
    "count": 8
  },
  {
    "className": "TKCTTL",
    "count": 7
  },
  {
    "className": "ĐKTH",
    "count": 6
  },
  {
    "className": "TTKCTTL",
    "count": 1
  }
];

export const PORTAL_STUDENTS: PortalStudentRow[] = [
  {
    "masv": "SV001",
    "fullname": "Nguyen Van An",
    "className": "ANHTTT",
    "gpa": 8.8,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV002",
    "fullname": "Patrick O'Brien",
    "className": "ANHTTT",
    "gpa": 9.1,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV003",
    "fullname": "Marco D'Angelo",
    "className": "BĐATTT",
    "gpa": 8.4,
    "note": "Bảo đảm an toàn dữ liệu"
  },
  {
    "masv": "SV004",
    "fullname": "Tran Thi Binh",
    "className": "CNTT1",
    "gpa": 7.9,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV005",
    "fullname": "Le Minh Khanh",
    "className": "KTPM",
    "gpa": 9.4,
    "note": "Kiến trúc phần mềm"
  },
  {
    "masv": "SV006",
    "fullname": "Ngô T. Cường",
    "className": "ANHTTT",
    "gpa": 8.7,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV007",
    "fullname": "Vũ X. Tâm",
    "className": "ANHTTT",
    "gpa": 9.5,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV008",
    "fullname": "Lý H. Nam",
    "className": "ANHTTT",
    "gpa": 7.4,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV009",
    "fullname": "Hoàng Q. Việt",
    "className": "ANHTTT",
    "gpa": 8.2,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV010",
    "fullname": "Bùi H. Hương",
    "className": "ANHTTT",
    "gpa": 9.0,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV011",
    "fullname": "Phan K. Long",
    "className": "ANHTTT",
    "gpa": 6.9,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV012",
    "fullname": "Đỗ G. Thắng",
    "className": "ANHTTT",
    "gpa": 7.7,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV013",
    "fullname": "Dương H. Đạt",
    "className": "ANHTTT",
    "gpa": 8.5,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV014",
    "fullname": "Đặng T. Trang",
    "className": "ANHTTT",
    "gpa": 9.3,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV015",
    "fullname": "Phan G. Tuấn",
    "className": "ANHTTT",
    "gpa": 7.2,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV016",
    "fullname": "Lê G. Bảo",
    "className": "ANHTTT",
    "gpa": 8.0,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV017",
    "fullname": "Bùi H. Nam",
    "className": "ANHTTT",
    "gpa": 8.8,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV018",
    "fullname": "Phạm Q. Thịnh",
    "className": "ANHTTT",
    "gpa": 9.6,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV019",
    "fullname": "Vũ M. Linh",
    "className": "ANHTTT",
    "gpa": 7.5,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV020",
    "fullname": "Đinh K. Bảo",
    "className": "ANHTTT",
    "gpa": 8.3,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV021",
    "fullname": "Bùi T. Kiên",
    "className": "ANHTTT",
    "gpa": 9.1,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV022",
    "fullname": "Dương H. Đạt",
    "className": "ANHTTT",
    "gpa": 7.0,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV023",
    "fullname": "Lê T. Phương",
    "className": "ANHTTT",
    "gpa": 7.8,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV024",
    "fullname": "Bùi H. Long",
    "className": "ANHTTT",
    "gpa": 8.6,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV025",
    "fullname": "Trần T. Linh",
    "className": "ANHTTT",
    "gpa": 9.4,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV026",
    "fullname": "Võ N. Hải",
    "className": "ANHTTT",
    "gpa": 7.3,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV027",
    "fullname": "Lê H. Hương",
    "className": "ANHTTT",
    "gpa": 8.1,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV028",
    "fullname": "Bùi H. Kiên",
    "className": "ANHTTT",
    "gpa": 8.9,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV029",
    "fullname": "Lý V. Bảo",
    "className": "ANHTTT",
    "gpa": 6.8,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV030",
    "fullname": "Lê K. Tuấn",
    "className": "ANHTTT",
    "gpa": 7.6,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV031",
    "fullname": "Ngô T. Huy",
    "className": "ANHTTT",
    "gpa": 8.4,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV032",
    "fullname": "Nguyễn Q. Cường",
    "className": "ANHTTT",
    "gpa": 9.2,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV033",
    "fullname": "Đỗ H. Long",
    "className": "ANHTTT",
    "gpa": 7.1,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV034",
    "fullname": "Trương G. Cường",
    "className": "ANHTTT",
    "gpa": 7.9,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV035",
    "fullname": "Đặng T. Tuấn",
    "className": "ANHTTT",
    "gpa": 8.7,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV036",
    "fullname": "Đinh T. Thắng",
    "className": "ANHTTT",
    "gpa": 9.5,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV037",
    "fullname": "Phạm T. Trung",
    "className": "ANHTTT",
    "gpa": 7.4,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV038",
    "fullname": "Trương Đ. Trang",
    "className": "ANHTTT",
    "gpa": 8.2,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV039",
    "fullname": "Võ T. Nam",
    "className": "ANHTTT",
    "gpa": 9.0,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV040",
    "fullname": "Ngô T. Bảo",
    "className": "ANHTTT",
    "gpa": 6.9,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV041",
    "fullname": "Đinh Đ. Kiên",
    "className": "ANHTTT",
    "gpa": 7.7,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV042",
    "fullname": "Dương Q. Bảo",
    "className": "ANHTTT",
    "gpa": 8.5,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV043",
    "fullname": "Trương T. Tú",
    "className": "ANHTTT",
    "gpa": 9.3,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV044",
    "fullname": "Võ T. Phúc",
    "className": "ANHTTT",
    "gpa": 7.2,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV045",
    "fullname": "Đinh T. Dũng",
    "className": "ANHTTT",
    "gpa": 8.0,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV046",
    "fullname": "Lê N. Đạt",
    "className": "ANHTTT",
    "gpa": 8.8,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV047",
    "fullname": "Lý Đ. Thắng",
    "className": "ANHTTT",
    "gpa": 9.6,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV048",
    "fullname": "Nguyễn M. Huy",
    "className": "ANHTTT",
    "gpa": 7.5,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV049",
    "fullname": "Lý T. Trang",
    "className": "ANHTTT",
    "gpa": 8.3,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV050",
    "fullname": "Nguyễn X. Tú",
    "className": "ANHTTT",
    "gpa": 9.1,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV051",
    "fullname": "Đỗ Đ. Phúc",
    "className": "ANHTTT",
    "gpa": 7.0,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV052",
    "fullname": "Lý T. Tú",
    "className": "ANHTTT",
    "gpa": 7.8,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV053",
    "fullname": "Võ T. Tâm",
    "className": "ANHTTT",
    "gpa": 8.6,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV054",
    "fullname": "Dương T. Kiên",
    "className": "ANHTTT",
    "gpa": 9.4,
    "note": "Bảo mật ứng dụng Web"
  },
  {
    "masv": "SV055",
    "fullname": "Võ N. Quân",
    "className": "ANHTTT",
    "gpa": 7.3,
    "note": "Phân tích mã độc"
  },
  {
    "masv": "SV056",
    "fullname": "Phan Đ. Hà",
    "className": "ANHTTT",
    "gpa": 8.1,
    "note": "Mật mã học ứng dụng"
  },
  {
    "masv": "SV057",
    "fullname": "Lê V. Khoa",
    "className": "ANHTTT",
    "gpa": 8.9,
    "note": "An toàn hệ thống mạng"
  },
  {
    "masv": "SV058",
    "fullname": "Bùi T. Nam",
    "className": "CNTT2",
    "gpa": 6.8,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV059",
    "fullname": "Lê T. Huy",
    "className": "CNTT2",
    "gpa": 7.6,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV060",
    "fullname": "Đỗ Q. Cường",
    "className": "CNTT2",
    "gpa": 8.4,
    "note": "Cơ sở dữ liệu phân tán"
  },
  {
    "masv": "SV061",
    "fullname": "Dương Q. Tuấn",
    "className": "CNTT2",
    "gpa": 9.2,
    "note": "Lập trình hệ thống"
  },
  {
    "masv": "SV062",
    "fullname": "Võ T. Phúc",
    "className": "CNTT2",
    "gpa": 7.1,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV063",
    "fullname": "Phan T. Đạt",
    "className": "CNTT2",
    "gpa": 7.9,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV064",
    "fullname": "Phạm T. Việt",
    "className": "CNTT2",
    "gpa": 8.7,
    "note": "Cơ sở dữ liệu phân tán"
  },
  {
    "masv": "SV065",
    "fullname": "Dương Đ. Nam",
    "className": "CNTT2",
    "gpa": 9.5,
    "note": "Lập trình hệ thống"
  },
  {
    "masv": "SV066",
    "fullname": "Phạm H. Phúc",
    "className": "CNTT2",
    "gpa": 7.4,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV067",
    "fullname": "Võ K. Dũng",
    "className": "CNTT2",
    "gpa": 8.2,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV068",
    "fullname": "Đinh X. Quân",
    "className": "CNTT2",
    "gpa": 9.0,
    "note": "Cơ sở dữ liệu phân tán"
  },
  {
    "masv": "SV069",
    "fullname": "Phạm X. Hà",
    "className": "CNTT2",
    "gpa": 6.9,
    "note": "Lập trình hệ thống"
  },
  {
    "masv": "SV070",
    "fullname": "Trương M. Đạt",
    "className": "CNTT2",
    "gpa": 7.7,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV071",
    "fullname": "Hoàng H. Hương",
    "className": "CNTT2",
    "gpa": 8.5,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV072",
    "fullname": "Ngô G. Long",
    "className": "CNTT2",
    "gpa": 9.3,
    "note": "Cơ sở dữ liệu phân tán"
  },
  {
    "masv": "SV073",
    "fullname": "Trần T. Phương",
    "className": "CNTT2",
    "gpa": 7.2,
    "note": "Lập trình hệ thống"
  },
  {
    "masv": "SV074",
    "fullname": "Đỗ H. Long",
    "className": "CNTT2",
    "gpa": 8.0,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV075",
    "fullname": "Trần Q. Hương",
    "className": "CNTT2",
    "gpa": 8.8,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV076",
    "fullname": "Bùi T. Kiên",
    "className": "CNTT2",
    "gpa": 9.6,
    "note": "Cơ sở dữ liệu phân tán"
  },
  {
    "masv": "SV077",
    "fullname": "Nguyễn T. Bảo",
    "className": "CNTT2",
    "gpa": 7.5,
    "note": "Lập trình hệ thống"
  },
  {
    "masv": "SV078",
    "fullname": "Lê H. Tuấn",
    "className": "CNTT2",
    "gpa": 8.3,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV079",
    "fullname": "Ngô M. Thịnh",
    "className": "CNTT2",
    "gpa": 9.1,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV080",
    "fullname": "Phạm Đ. Cường",
    "className": "CNTT2",
    "gpa": 7.0,
    "note": "Cơ sở dữ liệu phân tán"
  },
  {
    "masv": "SV081",
    "fullname": "Đỗ V. Bảo",
    "className": "CNTT2",
    "gpa": 7.8,
    "note": "Lập trình hệ thống"
  },
  {
    "masv": "SV082",
    "fullname": "Lê T. Kiên",
    "className": "CNTT2",
    "gpa": 8.6,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV083",
    "fullname": "Đặng H. Khoa",
    "className": "CNTT2",
    "gpa": 9.4,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV084",
    "fullname": "Trần T. Hà",
    "className": "CNTT2",
    "gpa": 7.3,
    "note": "Cơ sở dữ liệu phân tán"
  },
  {
    "masv": "SV085",
    "fullname": "Vũ V. Long",
    "className": "CNTT2",
    "gpa": 8.1,
    "note": "Lập trình hệ thống"
  },
  {
    "masv": "SV086",
    "fullname": "Đinh T. Phúc",
    "className": "CNTT2",
    "gpa": 8.9,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV087",
    "fullname": "Trần T. Dũng",
    "className": "CNTT2",
    "gpa": 6.8,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV088",
    "fullname": "Phan Đ. Hương",
    "className": "CNTT2",
    "gpa": 7.6,
    "note": "Cơ sở dữ liệu phân tán"
  },
  {
    "masv": "SV089",
    "fullname": "Lê Q. Thắng",
    "className": "CNTT2",
    "gpa": 8.4,
    "note": "Lập trình hệ thống"
  },
  {
    "masv": "SV090",
    "fullname": "Đặng K. Tâm",
    "className": "CNTT2",
    "gpa": 9.2,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV091",
    "fullname": "Lê X. Nam",
    "className": "CNTT2",
    "gpa": 7.1,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV092",
    "fullname": "Vũ N. Thịnh",
    "className": "CNTT2",
    "gpa": 7.9,
    "note": "Cơ sở dữ liệu phân tán"
  },
  {
    "masv": "SV093",
    "fullname": "Dương M. Thắng",
    "className": "CNTT2",
    "gpa": 8.7,
    "note": "Lập trình hệ thống"
  },
  {
    "masv": "SV094",
    "fullname": "Hoàng M. Trung",
    "className": "CNTT2",
    "gpa": 9.5,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV095",
    "fullname": "Phan V. Thắng",
    "className": "CNTT2",
    "gpa": 7.4,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV096",
    "fullname": "Lê G. Tuấn",
    "className": "CNTT2",
    "gpa": 8.2,
    "note": "Cơ sở dữ liệu phân tán"
  },
  {
    "masv": "SV097",
    "fullname": "Ngô X. Phương",
    "className": "CNTT2",
    "gpa": 9.0,
    "note": "Lập trình hệ thống"
  },
  {
    "masv": "SV098",
    "fullname": "Lê M. Long",
    "className": "CNTT2",
    "gpa": 6.9,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV099",
    "fullname": "Đặng M. Phúc",
    "className": "CNTT2",
    "gpa": 7.7,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV100",
    "fullname": "Nguyễn T. Nam",
    "className": "CNTT2",
    "gpa": 8.5,
    "note": "Cơ sở dữ liệu phân tán"
  },
  {
    "masv": "SV101",
    "fullname": "Hoàng T. Phương",
    "className": "CNTT2",
    "gpa": 9.3,
    "note": "Lập trình hệ thống"
  },
  {
    "masv": "SV102",
    "fullname": "Trương H. Tuấn",
    "className": "CNTT2",
    "gpa": 7.2,
    "note": "Kỹ thuật lập trình C++"
  },
  {
    "masv": "SV103",
    "fullname": "Phạm Đ. Việt",
    "className": "CNTT2",
    "gpa": 8.0,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV104",
    "fullname": "Bùi G. Cường",
    "className": "CNTT1",
    "gpa": 8.8,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV105",
    "fullname": "Đinh T. Quân",
    "className": "CNTT1",
    "gpa": 9.6,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV106",
    "fullname": "Võ X. Linh",
    "className": "CNTT1",
    "gpa": 7.5,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV107",
    "fullname": "Trương Q. Tuấn",
    "className": "CNTT1",
    "gpa": 8.3,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV108",
    "fullname": "Võ T. Linh",
    "className": "CNTT1",
    "gpa": 9.1,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV109",
    "fullname": "Dương G. Trung",
    "className": "CNTT1",
    "gpa": 7.0,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV110",
    "fullname": "Võ G. Tâm",
    "className": "CNTT1",
    "gpa": 7.8,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV111",
    "fullname": "Trương Đ. Long",
    "className": "CNTT1",
    "gpa": 8.6,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV112",
    "fullname": "Hoàng H. Hương",
    "className": "CNTT1",
    "gpa": 9.4,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV113",
    "fullname": "Dương V. Hải",
    "className": "CNTT1",
    "gpa": 7.3,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV114",
    "fullname": "Phạm T. Quân",
    "className": "CNTT1",
    "gpa": 8.1,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV115",
    "fullname": "Võ T. Nam",
    "className": "CNTT1",
    "gpa": 8.9,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV116",
    "fullname": "Đinh Đ. Long",
    "className": "CNTT1",
    "gpa": 6.8,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV117",
    "fullname": "Hoàng K. Hà",
    "className": "CNTT1",
    "gpa": 7.6,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV118",
    "fullname": "Đinh M. Long",
    "className": "CNTT1",
    "gpa": 8.4,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV119",
    "fullname": "Phạm X. Kiên",
    "className": "CNTT1",
    "gpa": 9.2,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV120",
    "fullname": "Dương T. Trung",
    "className": "CNTT1",
    "gpa": 7.1,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV121",
    "fullname": "Lê Đ. Cường",
    "className": "CNTT1",
    "gpa": 7.9,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV122",
    "fullname": "Bùi Đ. Tuấn",
    "className": "CNTT1",
    "gpa": 8.7,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV123",
    "fullname": "Trương K. Việt",
    "className": "CNTT1",
    "gpa": 9.5,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV124",
    "fullname": "Vũ G. Tú",
    "className": "CNTT1",
    "gpa": 7.4,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV125",
    "fullname": "Lý N. Thịnh",
    "className": "CNTT1",
    "gpa": 8.2,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV126",
    "fullname": "Đặng Đ. Nam",
    "className": "CNTT1",
    "gpa": 9.0,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV127",
    "fullname": "Ngô V. Huy",
    "className": "CNTT1",
    "gpa": 6.9,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV128",
    "fullname": "Vũ T. Hà",
    "className": "CNTT1",
    "gpa": 7.7,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV129",
    "fullname": "Đặng T. Quân",
    "className": "CNTT1",
    "gpa": 8.5,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV130",
    "fullname": "Nguyễn H. Hương",
    "className": "CNTT1",
    "gpa": 9.3,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV131",
    "fullname": "Đỗ Đ. Long",
    "className": "CNTT1",
    "gpa": 7.2,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV132",
    "fullname": "Nguyễn M. Tâm",
    "className": "CNTT1",
    "gpa": 8.0,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV133",
    "fullname": "Vũ T. Quân",
    "className": "CNTT1",
    "gpa": 8.8,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV134",
    "fullname": "Lý H. Phương",
    "className": "CNTT1",
    "gpa": 9.6,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV135",
    "fullname": "Vũ Q. Đạt",
    "className": "CNTT1",
    "gpa": 7.5,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV136",
    "fullname": "Phan M. Phương",
    "className": "CNTT1",
    "gpa": 8.3,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV137",
    "fullname": "Trần V. Đạt",
    "className": "CNTT1",
    "gpa": 9.1,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV138",
    "fullname": "Bùi T. Phúc",
    "className": "CNTT1",
    "gpa": 7.0,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV139",
    "fullname": "Đinh X. Thắng",
    "className": "CNTT1",
    "gpa": 7.8,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV140",
    "fullname": "Vũ M. Bảo",
    "className": "CNTT1",
    "gpa": 8.6,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV141",
    "fullname": "Nguyễn H. Hà",
    "className": "CNTT1",
    "gpa": 9.4,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV142",
    "fullname": "Hoàng G. Khoa",
    "className": "CNTT1",
    "gpa": 7.3,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV143",
    "fullname": "Lý H. Phương",
    "className": "CNTT1",
    "gpa": 8.1,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV144",
    "fullname": "Lê N. Long",
    "className": "CNTT1",
    "gpa": 8.9,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV145",
    "fullname": "Ngô Đ. Hương",
    "className": "CNTT1",
    "gpa": 6.8,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV146",
    "fullname": "Trương T. Tú",
    "className": "CNTT1",
    "gpa": 7.6,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV147",
    "fullname": "Ngô T. Hà",
    "className": "CNTT1",
    "gpa": 8.4,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV148",
    "fullname": "Trương T. Tú",
    "className": "CNTT1",
    "gpa": 9.2,
    "note": "Hệ điều hành Linux"
  },
  {
    "masv": "SV149",
    "fullname": "Hoàng Đ. Huy",
    "className": "TT",
    "gpa": 7.1,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV150",
    "fullname": "Ngô V. Hải",
    "className": "TT",
    "gpa": 7.9,
    "note": "Thông tin vô tuyến"
  },
  {
    "masv": "SV151",
    "fullname": "Trần V. Thịnh",
    "className": "TT",
    "gpa": 8.7,
    "note": "Mạng viễn thông"
  },
  {
    "masv": "SV152",
    "fullname": "Đỗ H. Linh",
    "className": "TT",
    "gpa": 9.5,
    "note": "Kỹ thuật Thông tin liên lạc"
  },
  {
    "masv": "SV153",
    "fullname": "Lê T. Bảo",
    "className": "TT",
    "gpa": 7.4,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV154",
    "fullname": "Võ T. Nam",
    "className": "TT",
    "gpa": 8.2,
    "note": "Thông tin vô tuyến"
  },
  {
    "masv": "SV155",
    "fullname": "Lê M. Huy",
    "className": "TT",
    "gpa": 9.0,
    "note": "Mạng viễn thông"
  },
  {
    "masv": "SV156",
    "fullname": "Võ T. Linh",
    "className": "TT",
    "gpa": 6.9,
    "note": "Kỹ thuật Thông tin liên lạc"
  },
  {
    "masv": "SV157",
    "fullname": "Đinh X. Long",
    "className": "TT",
    "gpa": 7.7,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV158",
    "fullname": "Hoàng Đ. Hương",
    "className": "TT",
    "gpa": 8.5,
    "note": "Thông tin vô tuyến"
  },
  {
    "masv": "SV159",
    "fullname": "Dương H. Dũng",
    "className": "TT",
    "gpa": 9.3,
    "note": "Mạng viễn thông"
  },
  {
    "masv": "SV160",
    "fullname": "Lê V. Tâm",
    "className": "TT",
    "gpa": 7.2,
    "note": "Kỹ thuật Thông tin liên lạc"
  },
  {
    "masv": "SV161",
    "fullname": "Lý T. Kiên",
    "className": "TT",
    "gpa": 8.0,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV162",
    "fullname": "Lê Q. Phương",
    "className": "TT",
    "gpa": 8.8,
    "note": "Thông tin vô tuyến"
  },
  {
    "masv": "SV163",
    "fullname": "Đặng Đ. Hải",
    "className": "TT",
    "gpa": 9.6,
    "note": "Mạng viễn thông"
  },
  {
    "masv": "SV164",
    "fullname": "Trương Đ. Thịnh",
    "className": "TT",
    "gpa": 7.5,
    "note": "Kỹ thuật Thông tin liên lạc"
  },
  {
    "masv": "SV165",
    "fullname": "Võ T. Dũng",
    "className": "TT",
    "gpa": 8.3,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV166",
    "fullname": "Dương H. Khoa",
    "className": "TT",
    "gpa": 9.1,
    "note": "Thông tin vô tuyến"
  },
  {
    "masv": "SV167",
    "fullname": "Trần Đ. Kiên",
    "className": "TT",
    "gpa": 7.0,
    "note": "Mạng viễn thông"
  },
  {
    "masv": "SV168",
    "fullname": "Đỗ M. Đạt",
    "className": "TT",
    "gpa": 7.8,
    "note": "Kỹ thuật Thông tin liên lạc"
  },
  {
    "masv": "SV169",
    "fullname": "Lê K. Phúc",
    "className": "TT",
    "gpa": 8.6,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV170",
    "fullname": "Đỗ T. Tuấn",
    "className": "TT",
    "gpa": 9.4,
    "note": "Thông tin vô tuyến"
  },
  {
    "masv": "SV171",
    "fullname": "Lê N. Trang",
    "className": "TT",
    "gpa": 7.3,
    "note": "Mạng viễn thông"
  },
  {
    "masv": "SV172",
    "fullname": "Đỗ Đ. Nam",
    "className": "TT",
    "gpa": 8.1,
    "note": "Kỹ thuật Thông tin liên lạc"
  },
  {
    "masv": "SV173",
    "fullname": "Nguyễn M. Tâm",
    "className": "TT",
    "gpa": 8.9,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV174",
    "fullname": "Lê K. Tú",
    "className": "TT",
    "gpa": 6.8,
    "note": "Thông tin vô tuyến"
  },
  {
    "masv": "SV175",
    "fullname": "Lý T. Tâm",
    "className": "TT",
    "gpa": 7.6,
    "note": "Mạng viễn thông"
  },
  {
    "masv": "SV176",
    "fullname": "Phạm T. Dũng",
    "className": "TT",
    "gpa": 8.4,
    "note": "Kỹ thuật Thông tin liên lạc"
  },
  {
    "masv": "SV177",
    "fullname": "Dương T. Quân",
    "className": "TT",
    "gpa": 9.2,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV178",
    "fullname": "Trần T. Linh",
    "className": "TT",
    "gpa": 7.1,
    "note": "Thông tin vô tuyến"
  },
  {
    "masv": "SV179",
    "fullname": "Ngô T. Khoa",
    "className": "TT",
    "gpa": 7.9,
    "note": "Mạng viễn thông"
  },
  {
    "masv": "SV180",
    "fullname": "Trương X. Hà",
    "className": "TT",
    "gpa": 8.7,
    "note": "Kỹ thuật Thông tin liên lạc"
  },
  {
    "masv": "SV181",
    "fullname": "Hoàng Đ. Đạt",
    "className": "TT",
    "gpa": 9.5,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV182",
    "fullname": "Dương V. Phúc",
    "className": "TT",
    "gpa": 7.4,
    "note": "Thông tin vô tuyến"
  },
  {
    "masv": "SV183",
    "fullname": "Võ M. Long",
    "className": "TT",
    "gpa": 8.2,
    "note": "Mạng viễn thông"
  },
  {
    "masv": "SV184",
    "fullname": "Phan X. Việt",
    "className": "TT",
    "gpa": 9.0,
    "note": "Kỹ thuật Thông tin liên lạc"
  },
  {
    "masv": "SV185",
    "fullname": "Nguyễn X. Thắng",
    "className": "TT",
    "gpa": 6.9,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV186",
    "fullname": "Bùi Q. Thịnh",
    "className": "TT",
    "gpa": 7.7,
    "note": "Thông tin vô tuyến"
  },
  {
    "masv": "SV187",
    "fullname": "Trương M. Thắng",
    "className": "TT",
    "gpa": 8.5,
    "note": "Mạng viễn thông"
  },
  {
    "masv": "SV188",
    "fullname": "Đặng T. Việt",
    "className": "TT",
    "gpa": 9.3,
    "note": "Kỹ thuật Thông tin liên lạc"
  },
  {
    "masv": "SV189",
    "fullname": "Phan T. Cường",
    "className": "TT",
    "gpa": 7.2,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV190",
    "fullname": "Hoàng N. Việt",
    "className": "TT",
    "gpa": 8.0,
    "note": "Thông tin vô tuyến"
  },
  {
    "masv": "SV191",
    "fullname": "Trương N. Thắng",
    "className": "TT",
    "gpa": 8.8,
    "note": "Mạng viễn thông"
  },
  {
    "masv": "SV192",
    "fullname": "Phạm K. Tuấn",
    "className": "TT",
    "gpa": 9.6,
    "note": "Kỹ thuật Thông tin liên lạc"
  },
  {
    "masv": "SV193",
    "fullname": "Đỗ K. Linh",
    "className": "TT",
    "gpa": 7.5,
    "note": "Xử lý tín hiệu số"
  },
  {
    "masv": "SV194",
    "fullname": "Nguyễn T. Tuấn",
    "className": "CNTT3",
    "gpa": 8.3,
    "note": "Phát triển ứng dụng Web"
  },
  {
    "masv": "SV195",
    "fullname": "Vũ Q. Phương",
    "className": "CNTT3",
    "gpa": 9.1,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV196",
    "fullname": "Phan V. Kiên",
    "className": "CNTT3",
    "gpa": 7.0,
    "note": "Hệ điều hành"
  },
  {
    "masv": "SV197",
    "fullname": "Võ G. Tâm",
    "className": "CNTT3",
    "gpa": 7.8,
    "note": "Kiến trúc máy tính"
  },
  {
    "masv": "SV198",
    "fullname": "Dương T. Cường",
    "className": "CNTT3",
    "gpa": 8.6,
    "note": "Phát triển ứng dụng Web"
  },
  {
    "masv": "SV199",
    "fullname": "Trần T. Phúc",
    "className": "CNTT3",
    "gpa": 9.4,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV200",
    "fullname": "Ngô T. Cường",
    "className": "CNTT3",
    "gpa": 7.3,
    "note": "Hệ điều hành"
  },
  {
    "masv": "SV201",
    "fullname": "Phạm Đ. Thịnh",
    "className": "CNTT3",
    "gpa": 8.1,
    "note": "Kiến trúc máy tính"
  },
  {
    "masv": "SV202",
    "fullname": "Dương T. Nam",
    "className": "CNTT3",
    "gpa": 8.9,
    "note": "Phát triển ứng dụng Web"
  },
  {
    "masv": "SV203",
    "fullname": "Phan T. Long",
    "className": "CNTT3",
    "gpa": 6.8,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV204",
    "fullname": "Đỗ Q. Thắng",
    "className": "CNTT3",
    "gpa": 7.6,
    "note": "Hệ điều hành"
  },
  {
    "masv": "SV205",
    "fullname": "Dương T. Tú",
    "className": "CNTT3",
    "gpa": 8.4,
    "note": "Kiến trúc máy tính"
  },
  {
    "masv": "SV206",
    "fullname": "Vũ Đ. Phương",
    "className": "CNTT3",
    "gpa": 9.2,
    "note": "Phát triển ứng dụng Web"
  },
  {
    "masv": "SV207",
    "fullname": "Ngô G. Đạt",
    "className": "CNTT3",
    "gpa": 7.1,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV208",
    "fullname": "Lê G. Tâm",
    "className": "CNTT3",
    "gpa": 7.9,
    "note": "Hệ điều hành"
  },
  {
    "masv": "SV209",
    "fullname": "Ngô Đ. Đạt",
    "className": "CNTT3",
    "gpa": 8.7,
    "note": "Kiến trúc máy tính"
  },
  {
    "masv": "SV210",
    "fullname": "Trần T. Tâm",
    "className": "CNTT3",
    "gpa": 9.5,
    "note": "Phát triển ứng dụng Web"
  },
  {
    "masv": "SV211",
    "fullname": "Bùi H. Kiên",
    "className": "CNTT3",
    "gpa": 7.4,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV212",
    "fullname": "Phan G. Bảo",
    "className": "CNTT3",
    "gpa": 8.2,
    "note": "Hệ điều hành"
  },
  {
    "masv": "SV213",
    "fullname": "Hoàng X. Linh",
    "className": "CNTT3",
    "gpa": 9.0,
    "note": "Kiến trúc máy tính"
  },
  {
    "masv": "SV214",
    "fullname": "Trương H. Trung",
    "className": "CNTT3",
    "gpa": 6.9,
    "note": "Phát triển ứng dụng Web"
  },
  {
    "masv": "SV215",
    "fullname": "Phạm K. Linh",
    "className": "CNTT3",
    "gpa": 7.7,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV216",
    "fullname": "Lý M. Trung",
    "className": "TLPK2",
    "gpa": 8.5,
    "note": "Hệ thống dẫn đường"
  },
  {
    "masv": "SV217",
    "fullname": "Lê T. Linh",
    "className": "TLPK2",
    "gpa": 9.3,
    "note": "Kỹ thuật điều khiển số"
  },
  {
    "masv": "SV218",
    "fullname": "Đặng T. Dũng",
    "className": "TLPK2",
    "gpa": 7.2,
    "note": "Mô phỏng bay"
  },
  {
    "masv": "SV219",
    "fullname": "Nguyễn M. Tâm",
    "className": "TLPK2",
    "gpa": 8.0,
    "note": "Cảm biến quán tính"
  },
  {
    "masv": "SV220",
    "fullname": "Võ K. Tuấn",
    "className": "TLPK2",
    "gpa": 8.8,
    "note": "Hệ thống dẫn đường"
  },
  {
    "masv": "SV221",
    "fullname": "Nguyễn V. Bảo",
    "className": "TLPK2",
    "gpa": 9.6,
    "note": "Kỹ thuật điều khiển số"
  },
  {
    "masv": "SV222",
    "fullname": "Vũ T. Hải",
    "className": "TLPK2",
    "gpa": 7.5,
    "note": "Mô phỏng bay"
  },
  {
    "masv": "SV223",
    "fullname": "Đỗ H. Bảo",
    "className": "TLPK2",
    "gpa": 8.3,
    "note": "Cảm biến quán tính"
  },
  {
    "masv": "SV224",
    "fullname": "Phạm M. Thắng",
    "className": "TLPK2",
    "gpa": 9.1,
    "note": "Hệ thống dẫn đường"
  },
  {
    "masv": "SV225",
    "fullname": "Đỗ T. Thịnh",
    "className": "TLPK2",
    "gpa": 7.0,
    "note": "Kỹ thuật điều khiển số"
  },
  {
    "masv": "SV226",
    "fullname": "Đinh K. Linh",
    "className": "TLPK2",
    "gpa": 7.8,
    "note": "Mô phỏng bay"
  },
  {
    "masv": "SV227",
    "fullname": "Ngô X. Đạt",
    "className": "TLPK2",
    "gpa": 8.6,
    "note": "Cảm biến quán tính"
  },
  {
    "masv": "SV228",
    "fullname": "Trương T. Cường",
    "className": "TLPK2",
    "gpa": 9.4,
    "note": "Hệ thống dẫn đường"
  },
  {
    "masv": "SV229",
    "fullname": "Bùi V. Long",
    "className": "TLPK2",
    "gpa": 7.3,
    "note": "Kỹ thuật điều khiển số"
  },
  {
    "masv": "SV230",
    "fullname": "Phan K. Hà",
    "className": "TLPK2",
    "gpa": 8.1,
    "note": "Mô phỏng bay"
  },
  {
    "masv": "SV231",
    "fullname": "Phạm T. Dũng",
    "className": "TLPK2",
    "gpa": 8.9,
    "note": "Cảm biến quán tính"
  },
  {
    "masv": "SV232",
    "fullname": "Bùi T. Bảo",
    "className": "TLPK2",
    "gpa": 6.8,
    "note": "Hệ thống dẫn đường"
  },
  {
    "masv": "SV233",
    "fullname": "Đinh M. Đạt",
    "className": "TLPK2",
    "gpa": 7.6,
    "note": "Kỹ thuật điều khiển số"
  },
  {
    "masv": "SV234",
    "fullname": "Dương K. Phương",
    "className": "TLPK1",
    "gpa": 8.4,
    "note": "Kỹ thuật tên lửa phòng không"
  },
  {
    "masv": "SV235",
    "fullname": "Trần T. Hải",
    "className": "TLPK1",
    "gpa": 9.2,
    "note": "Xử lý tín hiệu radar"
  },
  {
    "masv": "SV236",
    "fullname": "Đặng H. Huy",
    "className": "TLPK1",
    "gpa": 7.1,
    "note": "Điều khiển tự động"
  },
  {
    "masv": "SV237",
    "fullname": "Nguyễn N. Thắng",
    "className": "TLPK1",
    "gpa": 7.9,
    "note": "Khí động lực học"
  },
  {
    "masv": "SV238",
    "fullname": "Võ M. Trung",
    "className": "TLPK1",
    "gpa": 8.7,
    "note": "Kỹ thuật tên lửa phòng không"
  },
  {
    "masv": "SV239",
    "fullname": "Lý V. Kiên",
    "className": "TLPK1",
    "gpa": 9.5,
    "note": "Xử lý tín hiệu radar"
  },
  {
    "masv": "SV240",
    "fullname": "Vũ T. Long",
    "className": "TLPK1",
    "gpa": 7.4,
    "note": "Điều khiển tự động"
  },
  {
    "masv": "SV241",
    "fullname": "Đỗ T. Trang",
    "className": "TLPK1",
    "gpa": 8.2,
    "note": "Khí động lực học"
  },
  {
    "masv": "SV242",
    "fullname": "Lê H. Tú",
    "className": "TLPK1",
    "gpa": 9.0,
    "note": "Kỹ thuật tên lửa phòng không"
  },
  {
    "masv": "SV243",
    "fullname": "Bùi Q. Tâm",
    "className": "TLPK1",
    "gpa": 6.9,
    "note": "Xử lý tín hiệu radar"
  },
  {
    "masv": "SV244",
    "fullname": "Trương T. Tú",
    "className": "TLPK1",
    "gpa": 7.7,
    "note": "Điều khiển tự động"
  },
  {
    "masv": "SV245",
    "fullname": "Đặng H. Hương",
    "className": "TLPK1",
    "gpa": 8.5,
    "note": "Khí động lực học"
  },
  {
    "masv": "SV246",
    "fullname": "Trương T. Thắng",
    "className": "TLPK1",
    "gpa": 9.3,
    "note": "Kỹ thuật tên lửa phòng không"
  },
  {
    "masv": "SV247",
    "fullname": "Lê M. Huy",
    "className": "TLPK1",
    "gpa": 7.2,
    "note": "Xử lý tín hiệu radar"
  },
  {
    "masv": "SV248",
    "fullname": "Phan K. Dũng",
    "className": "TLPK1",
    "gpa": 8.0,
    "note": "Điều khiển tự động"
  },
  {
    "masv": "SV249",
    "fullname": "Hoàng G. Khoa",
    "className": "TLPK1",
    "gpa": 8.8,
    "note": "Khí động lực học"
  },
  {
    "masv": "SV250",
    "fullname": "Bùi N. Hương",
    "className": "TLPK1",
    "gpa": 9.6,
    "note": "Kỹ thuật tên lửa phòng không"
  },
  {
    "masv": "SV251",
    "fullname": "Phan T. Thịnh",
    "className": "PTDL",
    "gpa": 7.5,
    "note": "Học thống kê"
  },
  {
    "masv": "SV252",
    "fullname": "Vũ M. Hà",
    "className": "PTDL",
    "gpa": 8.3,
    "note": "Khai phá dữ liệu"
  },
  {
    "masv": "SV253",
    "fullname": "Dương T. Tuấn",
    "className": "PTDL",
    "gpa": 9.1,
    "note": "Xác suất thống kê nâng cao"
  },
  {
    "masv": "SV254",
    "fullname": "Lê G. Tâm",
    "className": "PTDL",
    "gpa": 7.0,
    "note": "Kho dữ liệu & BI"
  },
  {
    "masv": "SV255",
    "fullname": "Lý T. Nam",
    "className": "PTDL",
    "gpa": 7.8,
    "note": "Học thống kê"
  },
  {
    "masv": "SV256",
    "fullname": "Hoàng N. Bảo",
    "className": "PTDL",
    "gpa": 8.6,
    "note": "Khai phá dữ liệu"
  },
  {
    "masv": "SV257",
    "fullname": "Ngô Q. Thắng",
    "className": "PTDL",
    "gpa": 9.4,
    "note": "Xác suất thống kê nâng cao"
  },
  {
    "masv": "SV258",
    "fullname": "Lê T. Tâm",
    "className": "PTDL",
    "gpa": 7.3,
    "note": "Kho dữ liệu & BI"
  },
  {
    "masv": "SV259",
    "fullname": "Đỗ X. Cường",
    "className": "PTDL",
    "gpa": 8.1,
    "note": "Học thống kê"
  },
  {
    "masv": "SV260",
    "fullname": "Đinh H. Quân",
    "className": "PTDL",
    "gpa": 8.9,
    "note": "Khai phá dữ liệu"
  },
  {
    "masv": "SV261",
    "fullname": "Bùi H. Cường",
    "className": "PTDL",
    "gpa": 6.8,
    "note": "Xác suất thống kê nâng cao"
  },
  {
    "masv": "SV262",
    "fullname": "Đinh H. Thịnh",
    "className": "PTDL",
    "gpa": 7.6,
    "note": "Kho dữ liệu & BI"
  },
  {
    "masv": "SV263",
    "fullname": "Vũ V. Hương",
    "className": "PTDL",
    "gpa": 8.4,
    "note": "Học thống kê"
  },
  {
    "masv": "SV264",
    "fullname": "Phan N. Khoa",
    "className": "PTDL",
    "gpa": 9.2,
    "note": "Khai phá dữ liệu"
  },
  {
    "masv": "SV265",
    "fullname": "Phạm T. Phúc",
    "className": "PTDL",
    "gpa": 7.1,
    "note": "Xác suất thống kê nâng cao"
  },
  {
    "masv": "SV266",
    "fullname": "Dương H. Trung",
    "className": "PTDL",
    "gpa": 7.9,
    "note": "Kho dữ liệu & BI"
  },
  {
    "masv": "SV267",
    "fullname": "Lê M. Bảo",
    "className": "BĐATTT",
    "gpa": 8.7,
    "note": "Quản trị rủi ro"
  },
  {
    "masv": "SV268",
    "fullname": "Võ X. Tuấn",
    "className": "BĐATTT",
    "gpa": 9.5,
    "note": "Bảo đảm An toàn Thông tin"
  },
  {
    "masv": "SV269",
    "fullname": "Phan N. Phương",
    "className": "BĐATTT",
    "gpa": 7.4,
    "note": "Giám sát mạng SOC"
  },
  {
    "masv": "SV270",
    "fullname": "Đặng H. Dũng",
    "className": "BĐATTT",
    "gpa": 8.2,
    "note": "An ninh hạ tầng số"
  },
  {
    "masv": "SV271",
    "fullname": "Phan M. Thịnh",
    "className": "BĐATTT",
    "gpa": 9.0,
    "note": "Quản trị rủi ro"
  },
  {
    "masv": "SV272",
    "fullname": "Hoàng T. Linh",
    "className": "BĐATTT",
    "gpa": 6.9,
    "note": "Bảo đảm An toàn Thông tin"
  },
  {
    "masv": "SV273",
    "fullname": "Đỗ G. Bảo",
    "className": "BĐATTT",
    "gpa": 7.7,
    "note": "Giám sát mạng SOC"
  },
  {
    "masv": "SV274",
    "fullname": "Phạm T. Linh",
    "className": "BĐATTT",
    "gpa": 8.5,
    "note": "An ninh hạ tầng số"
  },
  {
    "masv": "SV275",
    "fullname": "Bùi Đ. Khoa",
    "className": "BĐATTT",
    "gpa": 9.3,
    "note": "Quản trị rủi ro"
  },
  {
    "masv": "SV276",
    "fullname": "Phan H. Hà",
    "className": "BĐATTT",
    "gpa": 7.2,
    "note": "Bảo đảm An toàn Thông tin"
  },
  {
    "masv": "SV277",
    "fullname": "Bùi T. Tú",
    "className": "BĐATTT",
    "gpa": 8.0,
    "note": "Giám sát mạng SOC"
  },
  {
    "masv": "SV278",
    "fullname": "Phan H. Linh",
    "className": "BĐATTT",
    "gpa": 8.8,
    "note": "An ninh hạ tầng số"
  },
  {
    "masv": "SV279",
    "fullname": "Lê X. Dũng",
    "className": "BĐATTT",
    "gpa": 9.6,
    "note": "Quản trị rủi ro"
  },
  {
    "masv": "SV280",
    "fullname": "Bùi T. Phương",
    "className": "BĐATTT",
    "gpa": 7.5,
    "note": "Bảo đảm An toàn Thông tin"
  },
  {
    "masv": "SV281",
    "fullname": "Đinh H. Dũng",
    "className": "BĐATTT",
    "gpa": 8.3,
    "note": "Giám sát mạng SOC"
  },
  {
    "masv": "SV282",
    "fullname": "Đỗ T. Việt",
    "className": "TTNT",
    "gpa": 9.1,
    "note": "Thị giác máy tính"
  },
  {
    "masv": "SV283",
    "fullname": "Phan T. Nam",
    "className": "TTNT",
    "gpa": 7.0,
    "note": "Xử lý ngôn ngữ tự nhiên"
  },
  {
    "masv": "SV284",
    "fullname": "Bùi T. Việt",
    "className": "TTNT",
    "gpa": 7.8,
    "note": "Trí tuệ nhân tạo"
  },
  {
    "masv": "SV285",
    "fullname": "Phan V. Kiên",
    "className": "TTNT",
    "gpa": 8.6,
    "note": "Học sâu (Deep Learning)"
  },
  {
    "masv": "SV286",
    "fullname": "Phạm G. Đạt",
    "className": "TTNT",
    "gpa": 9.4,
    "note": "Thị giác máy tính"
  },
  {
    "masv": "SV287",
    "fullname": "Trương T. Kiên",
    "className": "TTNT",
    "gpa": 7.3,
    "note": "Xử lý ngôn ngữ tự nhiên"
  },
  {
    "masv": "SV288",
    "fullname": "Phạm H. Khoa",
    "className": "TTNT",
    "gpa": 8.1,
    "note": "Trí tuệ nhân tạo"
  },
  {
    "masv": "SV289",
    "fullname": "Lý T. Phương",
    "className": "TTNT",
    "gpa": 8.9,
    "note": "Học sâu (Deep Learning)"
  },
  {
    "masv": "SV290",
    "fullname": "Lê T. Hải",
    "className": "TTNT",
    "gpa": 6.8,
    "note": "Thị giác máy tính"
  },
  {
    "masv": "SV291",
    "fullname": "Ngô V. Trang",
    "className": "TTNT",
    "gpa": 7.6,
    "note": "Xử lý ngôn ngữ tự nhiên"
  },
  {
    "masv": "SV292",
    "fullname": "Phan T. Khoa",
    "className": "TTNT",
    "gpa": 8.4,
    "note": "Trí tuệ nhân tạo"
  },
  {
    "masv": "SV293",
    "fullname": "Phạm Đ. Thịnh",
    "className": "TTNT",
    "gpa": 9.2,
    "note": "Học sâu (Deep Learning)"
  },
  {
    "masv": "SV294",
    "fullname": "Lý M. Hải",
    "className": "TTNT",
    "gpa": 7.1,
    "note": "Thị giác máy tính"
  },
  {
    "masv": "SV295",
    "fullname": "Phạm K. Quân",
    "className": "TTNT",
    "gpa": 7.9,
    "note": "Xử lý ngôn ngữ tự nhiên"
  },
  {
    "masv": "SV296",
    "fullname": "Đỗ T. Cường",
    "className": "TTNT",
    "gpa": 8.7,
    "note": "Trí tuệ nhân tạo"
  },
  {
    "masv": "SV297",
    "fullname": "Hoàng T. Khoa",
    "className": "CNTT",
    "gpa": 9.5,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV298",
    "fullname": "Đỗ T. Thắng",
    "className": "CNTT",
    "gpa": 7.4,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV299",
    "fullname": "Đinh H. Trung",
    "className": "CNTT",
    "gpa": 8.2,
    "note": "Toán rời rạc"
  },
  {
    "masv": "SV300",
    "fullname": "Bùi M. Hương",
    "className": "CNTT",
    "gpa": 9.0,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV301",
    "fullname": "Đinh T. Long",
    "className": "CNTT",
    "gpa": 6.9,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV302",
    "fullname": "Phạm T. Hương",
    "className": "CNTT",
    "gpa": 7.7,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV303",
    "fullname": "Lý T. Khoa",
    "className": "CNTT",
    "gpa": 8.5,
    "note": "Toán rời rạc"
  },
  {
    "masv": "SV304",
    "fullname": "Trần Đ. Hương",
    "className": "CNTT",
    "gpa": 9.3,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV305",
    "fullname": "Đặng G. Đạt",
    "className": "CNTT",
    "gpa": 7.2,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV306",
    "fullname": "Phạm H. Phương",
    "className": "CNTT",
    "gpa": 8.0,
    "note": "Cấu trúc dữ liệu & Giải thuật"
  },
  {
    "masv": "SV307",
    "fullname": "Đỗ X. Tú",
    "className": "CNTT",
    "gpa": 8.8,
    "note": "Toán rời rạc"
  },
  {
    "masv": "SV308",
    "fullname": "Lý Q. Long",
    "className": "CNTT",
    "gpa": 9.6,
    "note": "Mạng máy tính"
  },
  {
    "masv": "SV309",
    "fullname": "Bùi V. Thắng",
    "className": "CNTT",
    "gpa": 7.5,
    "note": "Cơ sở dữ liệu"
  },
  {
    "masv": "SV310",
    "fullname": "Đinh T. Khoa",
    "className": "TLPK",
    "gpa": 8.3,
    "note": "Kỹ thuật vi xử lý"
  },
  {
    "masv": "SV311",
    "fullname": "Võ T. Kiên",
    "className": "TLPK",
    "gpa": 9.1,
    "note": "Radar & Dẫn đường"
  },
  {
    "masv": "SV312",
    "fullname": "Dương H. Huy",
    "className": "TLPK",
    "gpa": 7.0,
    "note": "Cơ sở kỹ thuật tên lửa"
  },
  {
    "masv": "SV313",
    "fullname": "Lê V. Cường",
    "className": "TLPK",
    "gpa": 7.8,
    "note": "Điều khiển tuyến tính"
  },
  {
    "masv": "SV314",
    "fullname": "Đỗ T. Đạt",
    "className": "TLPK",
    "gpa": 8.6,
    "note": "Kỹ thuật vi xử lý"
  },
  {
    "masv": "SV315",
    "fullname": "Trương X. Hà",
    "className": "TLPK",
    "gpa": 9.4,
    "note": "Radar & Dẫn đường"
  },
  {
    "masv": "SV316",
    "fullname": "Đặng T. Khoa",
    "className": "TLPK",
    "gpa": 7.3,
    "note": "Cơ sở kỹ thuật tên lửa"
  },
  {
    "masv": "SV317",
    "fullname": "Phan Đ. Huy",
    "className": "TLPK",
    "gpa": 8.1,
    "note": "Điều khiển tuyến tính"
  },
  {
    "masv": "SV318",
    "fullname": "Vũ Đ. Hải",
    "className": "TLPK",
    "gpa": 8.9,
    "note": "Kỹ thuật vi xử lý"
  },
  {
    "masv": "SV319",
    "fullname": "Dương T. Trung",
    "className": "TLPK",
    "gpa": 6.8,
    "note": "Radar & Dẫn đường"
  },
  {
    "masv": "SV320",
    "fullname": "Vũ X. Cường",
    "className": "TLPK",
    "gpa": 7.6,
    "note": "Cơ sở kỹ thuật tên lửa"
  },
  {
    "masv": "SV321",
    "fullname": "Ngô X. Thịnh",
    "className": "TLPK",
    "gpa": 8.4,
    "note": "Điều khiển tuyến tính"
  },
  {
    "masv": "SV322",
    "fullname": "Trương M. Cường",
    "className": "TLPK",
    "gpa": 9.2,
    "note": "Kỹ thuật vi xử lý"
  },
  {
    "masv": "SV323",
    "fullname": "Bùi V. Huy",
    "className": "ĐTH",
    "gpa": 7.1,
    "note": "Điện tử tương tự"
  },
  {
    "masv": "SV324",
    "fullname": "Trương K. Cường",
    "className": "ĐTH",
    "gpa": 7.9,
    "note": "Kỹ thuật xung – số"
  },
  {
    "masv": "SV325",
    "fullname": "Phạm T. Trung",
    "className": "ĐTH",
    "gpa": 8.7,
    "note": "Vi điều khiển & FPGA"
  },
  {
    "masv": "SV326",
    "fullname": "Dương Đ. Tâm",
    "className": "ĐTH",
    "gpa": 9.5,
    "note": "Hệ thống nhúng"
  },
  {
    "masv": "SV327",
    "fullname": "Phạm M. Khoa",
    "className": "ĐTH",
    "gpa": 7.4,
    "note": "Điện tử tương tự"
  },
  {
    "masv": "SV328",
    "fullname": "Bùi V. Phúc",
    "className": "ĐTH",
    "gpa": 8.2,
    "note": "Kỹ thuật xung – số"
  },
  {
    "masv": "SV329",
    "fullname": "Hoàng T. Tuấn",
    "className": "ĐTH",
    "gpa": 9.0,
    "note": "Vi điều khiển & FPGA"
  },
  {
    "masv": "SV330",
    "fullname": "Dương X. Huy",
    "className": "ĐTH",
    "gpa": 6.9,
    "note": "Hệ thống nhúng"
  },
  {
    "masv": "SV331",
    "fullname": "Nguyễn T. Dũng",
    "className": "ĐTH",
    "gpa": 7.7,
    "note": "Điện tử tương tự"
  },
  {
    "masv": "SV332",
    "fullname": "Bùi H. Phúc",
    "className": "ĐTH",
    "gpa": 8.5,
    "note": "Kỹ thuật xung – số"
  },
  {
    "masv": "SV333",
    "fullname": "Nguyễn G. Kiên",
    "className": "ĐTH",
    "gpa": 9.3,
    "note": "Vi điều khiển & FPGA"
  },
  {
    "masv": "SV334",
    "fullname": "Lê T. Long",
    "className": "ĐTH",
    "gpa": 7.2,
    "note": "Hệ thống nhúng"
  },
  {
    "masv": "SV335",
    "fullname": "Phan N. Linh",
    "className": "ĐTH",
    "gpa": 8.0,
    "note": "Điện tử tương tự"
  },
  {
    "masv": "SV336",
    "fullname": "Lê H. Quân",
    "className": "TLHQ",
    "gpa": 8.8,
    "note": "Tác chiến biển"
  },
  {
    "masv": "SV337",
    "fullname": "Đỗ V. Hà",
    "className": "TLHQ",
    "gpa": 9.6,
    "note": "Hệ thống điều khiển hải quân"
  },
  {
    "masv": "SV338",
    "fullname": "Phạm T. Tú",
    "className": "TLHQ",
    "gpa": 7.5,
    "note": "Kỹ thuật dẫn động"
  },
  {
    "masv": "SV339",
    "fullname": "Ngô T. Hà",
    "className": "TLHQ",
    "gpa": 8.3,
    "note": "Cảm biến hàng hải"
  },
  {
    "masv": "SV340",
    "fullname": "Đinh N. Dũng",
    "className": "TLHQ",
    "gpa": 9.1,
    "note": "Tác chiến biển"
  },
  {
    "masv": "SV341",
    "fullname": "Phạm M. Bảo",
    "className": "TLHQ",
    "gpa": 7.0,
    "note": "Hệ thống điều khiển hải quân"
  },
  {
    "masv": "SV342",
    "fullname": "Phan T. Dũng",
    "className": "TLHQ",
    "gpa": 7.8,
    "note": "Kỹ thuật dẫn động"
  },
  {
    "masv": "SV343",
    "fullname": "Phạm X. Trung",
    "className": "TLHQ",
    "gpa": 8.6,
    "note": "Cảm biến hàng hải"
  },
  {
    "masv": "SV344",
    "fullname": "Phan Q. Linh",
    "className": "TLHQ",
    "gpa": 9.4,
    "note": "Tác chiến biển"
  },
  {
    "masv": "SV345",
    "fullname": "Hoàng M. Bảo",
    "className": "TLHQ",
    "gpa": 7.3,
    "note": "Hệ thống điều khiển hải quân"
  },
  {
    "masv": "SV346",
    "fullname": "Đặng K. Hà",
    "className": "TLHQ",
    "gpa": 8.1,
    "note": "Kỹ thuật dẫn động"
  },
  {
    "masv": "SV347",
    "fullname": "Đinh K. Quân",
    "className": "TBBKNL",
    "gpa": 8.9,
    "note": "Hệ thống thủy khí"
  },
  {
    "masv": "SV348",
    "fullname": "Võ T. Trang",
    "className": "TBBKNL",
    "gpa": 6.8,
    "note": "Cơ kỹ thuật ứng dụng"
  },
  {
    "masv": "SV349",
    "fullname": "Phan X. Tú",
    "className": "TBBKNL",
    "gpa": 7.6,
    "note": "Vật liệu kỹ thuật"
  },
  {
    "masv": "SV350",
    "fullname": "Đặng Q. Hà",
    "className": "TBBKNL",
    "gpa": 8.4,
    "note": "Thiết kế cơ khí CAD/CAM"
  },
  {
    "masv": "SV351",
    "fullname": "Đỗ K. Khoa",
    "className": "TBBKNL",
    "gpa": 9.2,
    "note": "Hệ thống thủy khí"
  },
  {
    "masv": "SV352",
    "fullname": "Phạm K. Hương",
    "className": "TBBKNL",
    "gpa": 7.1,
    "note": "Cơ kỹ thuật ứng dụng"
  },
  {
    "masv": "SV353",
    "fullname": "Bùi H. Hải",
    "className": "TBBKNL",
    "gpa": 7.9,
    "note": "Vật liệu kỹ thuật"
  },
  {
    "masv": "SV354",
    "fullname": "Nguyễn T. Việt",
    "className": "TBBKNL",
    "gpa": 8.7,
    "note": "Thiết kế cơ khí CAD/CAM"
  },
  {
    "masv": "SV355",
    "fullname": "Bùi Q. Cường",
    "className": "TBBKNL",
    "gpa": 9.5,
    "note": "Hệ thống thủy khí"
  },
  {
    "masv": "SV356",
    "fullname": "Nguyễn T. Thịnh",
    "className": "TBBKNL",
    "gpa": 7.4,
    "note": "Cơ kỹ thuật ứng dụng"
  },
  {
    "masv": "SV357",
    "fullname": "Đặng X. Kiên",
    "className": "MMT & TTDL",
    "gpa": 8.2,
    "note": "Định tuyến & Chuyển mạch"
  },
  {
    "masv": "SV358",
    "fullname": "Lý T. Quân",
    "className": "MMT & TTDL",
    "gpa": 9.0,
    "note": "Mạng không dây thế hệ mới"
  },
  {
    "masv": "SV359",
    "fullname": "Vũ N. Kiên",
    "className": "MMT & TTDL",
    "gpa": 6.9,
    "note": "Kỹ thuật truyền dẫn"
  },
  {
    "masv": "SV360",
    "fullname": "Đỗ M. Tuấn",
    "className": "MMT & TTDL",
    "gpa": 7.7,
    "note": "Truyền thông dữ liệu"
  },
  {
    "masv": "SV361",
    "fullname": "Đinh T. Trang",
    "className": "MMT & TTDL",
    "gpa": 8.5,
    "note": "Định tuyến & Chuyển mạch"
  },
  {
    "masv": "SV362",
    "fullname": "Đỗ N. Tú",
    "className": "MMT & TTDL",
    "gpa": 9.3,
    "note": "Mạng không dây thế hệ mới"
  },
  {
    "masv": "SV363",
    "fullname": "Trương H. Bảo",
    "className": "MMT & TTDL",
    "gpa": 7.2,
    "note": "Kỹ thuật truyền dẫn"
  },
  {
    "masv": "SV364",
    "fullname": "Đỗ Đ. Kiên",
    "className": "MMT & TTDL",
    "gpa": 8.0,
    "note": "Truyền thông dữ liệu"
  },
  {
    "masv": "SV365",
    "fullname": "Dương G. Phúc",
    "className": "MMT & TTDL",
    "gpa": 8.8,
    "note": "Định tuyến & Chuyển mạch"
  },
  {
    "masv": "SV366",
    "fullname": "Vũ G. Tú",
    "className": "HTTT",
    "gpa": 9.6,
    "note": "Tích hợp hệ thống"
  },
  {
    "masv": "SV367",
    "fullname": "Lý T. Huy",
    "className": "HTTT",
    "gpa": 7.5,
    "note": "Thương mại điện tử"
  },
  {
    "masv": "SV368",
    "fullname": "Vũ H. Kiên",
    "className": "HTTT",
    "gpa": 8.3,
    "note": "Hệ thống thông tin quản lý"
  },
  {
    "masv": "SV369",
    "fullname": "Dương Q. Huy",
    "className": "HTTT",
    "gpa": 9.1,
    "note": "Quản trị CSDL Oracle"
  },
  {
    "masv": "SV370",
    "fullname": "Đinh T. Thắng",
    "className": "HTTT",
    "gpa": 7.0,
    "note": "Tích hợp hệ thống"
  },
  {
    "masv": "SV371",
    "fullname": "Võ T. Long",
    "className": "HTTT",
    "gpa": 7.8,
    "note": "Thương mại điện tử"
  },
  {
    "masv": "SV372",
    "fullname": "Đinh Q. Trang",
    "className": "HTTT",
    "gpa": 8.6,
    "note": "Hệ thống thông tin quản lý"
  },
  {
    "masv": "SV373",
    "fullname": "Vũ T. Trung",
    "className": "HTTT",
    "gpa": 9.4,
    "note": "Quản trị CSDL Oracle"
  },
  {
    "masv": "SV374",
    "fullname": "Ngô K. Hà",
    "className": "NL",
    "gpa": 7.3,
    "note": "Hệ thống điện động lực"
  },
  {
    "masv": "SV375",
    "fullname": "Hoàng V. Long",
    "className": "NL",
    "gpa": 8.1,
    "note": "Tự động hóa lưới điện"
  },
  {
    "masv": "SV376",
    "fullname": "Đỗ G. Phúc",
    "className": "NL",
    "gpa": 8.9,
    "note": "Năng lượng tái tạo"
  },
  {
    "masv": "SV377",
    "fullname": "Nguyễn T. Tú",
    "className": "NL",
    "gpa": 6.8,
    "note": "Kỹ thuật nhiệt động lực"
  },
  {
    "masv": "SV378",
    "fullname": "Đặng V. Phúc",
    "className": "NL",
    "gpa": 7.6,
    "note": "Hệ thống điện động lực"
  },
  {
    "masv": "SV379",
    "fullname": "Phan V. Hải",
    "className": "NL",
    "gpa": 8.4,
    "note": "Tự động hóa lưới điện"
  },
  {
    "masv": "SV380",
    "fullname": "Vũ T. Phúc",
    "className": "NL",
    "gpa": 9.2,
    "note": "Năng lượng tái tạo"
  },
  {
    "masv": "SV381",
    "fullname": "Nguyễn T. Kiên",
    "className": "NL",
    "gpa": 7.1,
    "note": "Kỹ thuật nhiệt động lực"
  },
  {
    "masv": "SV382",
    "fullname": "Hoàng Q. Khoa",
    "className": "KTPM",
    "gpa": 7.9,
    "note": "Phân tích thiết kế HTTT"
  },
  {
    "masv": "SV383",
    "fullname": "Trương Đ. Thắng",
    "className": "KTPM",
    "gpa": 8.7,
    "note": "DevOps căn bản"
  },
  {
    "masv": "SV384",
    "fullname": "Trần K. Trung",
    "className": "KTPM",
    "gpa": 9.5,
    "note": "Kiến trúc phần mềm"
  },
  {
    "masv": "SV385",
    "fullname": "Đỗ H. Hà",
    "className": "KTPM",
    "gpa": 7.4,
    "note": "Kiểm thử phần mềm tự động"
  },
  {
    "masv": "SV386",
    "fullname": "Nguyễn T. Dũng",
    "className": "KTPM",
    "gpa": 8.2,
    "note": "Phân tích thiết kế HTTT"
  },
  {
    "masv": "SV387",
    "fullname": "Võ M. Phương",
    "className": "KTPM",
    "gpa": 9.0,
    "note": "DevOps căn bản"
  },
  {
    "masv": "SV388",
    "fullname": "Đinh M. Tuấn",
    "className": "KTPM",
    "gpa": 6.9,
    "note": "Kiến trúc phần mềm"
  },
  {
    "masv": "SV389",
    "fullname": "Vũ T. Huy",
    "className": "TKCTTL",
    "gpa": 7.7,
    "note": "Độ bền vật liệu"
  },
  {
    "masv": "SV390",
    "fullname": "Phan X. Nam",
    "className": "TKCTTL",
    "gpa": 8.5,
    "note": "Mô phỏng phần tử hữu hạn"
  },
  {
    "masv": "SV391",
    "fullname": "Vũ N. Thịnh",
    "className": "TKCTTL",
    "gpa": 9.3,
    "note": "Công nghệ chế tạo"
  },
  {
    "masv": "SV392",
    "fullname": "Ngô T. Linh",
    "className": "TKCTTL",
    "gpa": 7.2,
    "note": "Thiết kế cấu trúc thiết bị"
  },
  {
    "masv": "SV393",
    "fullname": "Nguyễn K. Huy",
    "className": "TKCTTL",
    "gpa": 8.0,
    "note": "Độ bền vật liệu"
  },
  {
    "masv": "SV394",
    "fullname": "Đỗ X. Thắng",
    "className": "TKCTTL",
    "gpa": 8.8,
    "note": "Mô phỏng phần tử hữu hạn"
  },
  {
    "masv": "SV395",
    "fullname": "Đinh N. Thịnh",
    "className": "TKCTTL",
    "gpa": 9.6,
    "note": "Công nghệ chế tạo"
  },
  {
    "masv": "SV396",
    "fullname": "Đặng N. Hà",
    "className": "ĐKTH",
    "gpa": 7.5,
    "note": "Điều khiển tích hợp"
  },
  {
    "masv": "SV397",
    "fullname": "Phan M. Đạt",
    "className": "ĐKTH",
    "gpa": 8.3,
    "note": "Tự động hóa công nghiệp"
  },
  {
    "masv": "SV398",
    "fullname": "Phạm G. Bảo",
    "className": "ĐKTH",
    "gpa": 9.1,
    "note": "Robot & Cơ điện tử"
  },
  {
    "masv": "SV399",
    "fullname": "Trương G. Long",
    "className": "ĐKTH",
    "gpa": 7.0,
    "note": "Mạng truyền thông CN"
  },
  {
    "masv": "SV400",
    "fullname": "Phạm X. Thịnh",
    "className": "ĐKTH",
    "gpa": 7.8,
    "note": "Điều khiển tích hợp"
  },
  {
    "masv": "SV401",
    "fullname": "Ngô H. Hải",
    "className": "ĐKTH",
    "gpa": 8.6,
    "note": "Tự động hóa công nghiệp"
  },
  {
    "masv": "SV402",
    "fullname": "Trương V. Bảo",
    "className": "TTKCTTL",
    "gpa": 9.4,
    "note": "Cơ điện tử nâng cao"
  }
];
