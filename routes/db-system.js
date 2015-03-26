var
  dbSystem,

  mongoose = require('mongoose'),
  Schema = mongoose.Schema,

  db,

  dataSchema = {},
  dataModel = {};

mongoose.connect('mongodb://108.61.183.23/sangja');

db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function (callback) {
});

dataSchema.Union = {
  category_id: Schema.Types.ObjectId, // 카테고리 키
  user_id: Schema.Types.ObjectId,     // 유저 키
  parent: Schema.Types.ObjectId,      // 복제된 문서라면 부모 키를 가짐
  profile_img: String,                // 프로필 (웹주소)
  thumbnail: Buffer,                  // 썸네일 (Canvas 추출 데이터)
  author: String,                     // 작성자 이름
  password: String,                   // 비밀번호
  title: String,                      // 제목
  description: String,                // 설명
  regdate: Date,                      // 최초 등록일
  lastedit: Date,                     // 최종 수정일
  content: String,                    // 컨텐츠 (JSON)
  canBeShared: Boolean,               // 클론이 가능한지
  isReleased: Boolean,                // 발행되어 있는 상태인지
  view: Number,                       // 노출된 수
  clone: Number,                      // 카피된 수
  play: Number,                       // 플레이된 수
  like: Number                        // 추천 수
};

dataSchema.Category = {
  name: String  // 카테고리 이름
};

dataSchema.UnionComment = {
  user_id: Schema.Types.ObjectId,   // 유저 키
  union_id: Schema.Types.ObjectId,  // 연결된 유니온 키
  author: String,                   // 작성자 이름
  password: String,                 // 비밀번호
  profile_img: String,              // 프로필 이미지 (웹주소)
  content: String,                  // 내용
  regdate: Date,                    // 등록일
  ip: String,                       // ip
  like: Number                      // 추천 수
};

dataSchema.Rank = {
  union_id: Schema.Types.ObjectId,  // 유니온 키
  user_id: Schema.Types.ObjectId,   // 유저 키
  regdate: Date,                    // 첫 추천 일자
  lastedit: Date,                   // 추천 변경일자
  point: Number,                    // 추천 점수 (0~5)
  ip: String                        // ip
};

// 스키마, 모델로 변환
for ( var i in dataSchema ) {
  dataSchema[i] = new Schema(dataSchema[i]);
  dataModel[i] = mongoose.model(i, dataSchema[i]);
}

module.exports = dbSystem = function () {
  this.db = db;
  this.model = dataModel;

  return this;
};