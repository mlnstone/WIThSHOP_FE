// src/lib/nlp/categoryMatch.js
const CATEGORY_ALIASES = {
    "케이스": ["케이스", "케바", "키케이스", "키커버"],
    "블랙박스": ["블랙박스", "블박"],
    "무선충전 거치대": ["무선충전", "무선 충전", "거치대", "충전 거치대"],
    "차량 청소용품": ["청소", "세차", "먼지", "클리너", "타월"],
    "스마트키 액세서리": ["스마트키", "스마트 키", "키링", "키홀더"],
    "햇빛가리개": ["햇빛가리개", "썬바이저", "햇빛", "커튼"],
    "타이어 관련 용품": ["타이어", "휠", "펑크", "공기압"],
    "차량 수납용품": ["수납", "정리", "트렁크 정리함", "포켓"],
    "와이퍼": ["와이퍼", "발수", "유리 와이퍼"],
    "핸들커버": ["핸들커버", "핸들 커버"],
  };
  
  const norm = (s) =>
    s.toLowerCase().replace(/\s+/g, "").replace(/[^\p{L}\p{N}]/gu, "");
  
  export function matchCategoryIdByText(q, categories) {
    const nq = norm(q || "");
    let best = null;
  
    for (const c of categories || []) {
      const cname = c.categoryName;
      const aliases = CATEGORY_ALIASES[cname] ?? [cname];
      let score = 0;
  
      for (const a of aliases) {
        const na = norm(a);
        if (na && nq.includes(na)) score = Math.max(score, na.length); // 간단 가중치
      }
  
      const ncname = norm(cname);
      if (ncname && nq.includes(ncname)) score = Math.max(score, ncname.length + 1);
  
      if (score > 0 && (!best || score > best.score)) best = { id: c.categoryId, score };
    }
  
    return best?.id ?? null;
  }