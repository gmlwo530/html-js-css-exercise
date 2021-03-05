(() => {
  // https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L14273
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g,
    reHasRegExpChar = RegExp(reRegExpChar.source);
  function escapeRegExp(string) {
    string = toString(string);
    return string && reHasRegExpChar.test(string)
      ? string.replace(reRegExpChar, "\\$&")
      : string;
  }

  /*
    유니코드 체계에서 한글 문자가 가지는 규칙에 대해 몇 가지 알고 있어야 한다.
    
    1. 각 자음의 시작 문자는 언제나 'ㅏ' 모음과 합쳐진(예. '가') 문자로 시작해서 '|' 모음과 'ㅎ' 받침으로 합쳐진(예. '깋') 글자로 끝난다.
    2. 모든 자음에 대해 첫 문자(예. '가')와 마지막 문자(예. '깋')의 코드번호 차이는 587로 동일하다.
    3. 자바스크립트에서 임의의 온전한 한 음절(초성과 모음을 갖춘 문자)의 코드는 다음과 같이 정해진다.
       `(자음번호 * 588 + 모음번호 * 28 + 종성번호) + 44032`
       이 공식에 대해서는 아래에서 더 자세하게 알아보자. 추가적으로 알아야 될 규칙이 있다.
    4. 'ㄱ'부터 'ㅅ' 전까지의 초성들은 초성 인덱스만큼 거리를 가지지 않는다. 더 자세히 설명하면, 초성 인덱스 순서는 다음과 같다.
       'ㄱ, ㄲ, ㄴ, ㄷ, ㄸ, ㄹ, ㅁ, ㅂ, ㅃ, ㅅ'. 근데 실제 유니코드의 한글 자음 파트에는 종성에만 사용할 수 있는(예. 'ㄱㅅ') 문자가 섞여있다.
       다음과 같이 말이다, 'ㄱ, ㄲ, ㄱㅅ, ㄴ, ㄴㅈ, ....'. 그래서 어쩔 수 없이 'ㄱ'부터 'ㅃ'까지는 (b) 코드 처럼 예외로 두고 'ㅅ'부터는 순서를 계산하면 된다.
  */

  /*
    `(자음번호 * 588 + 모음번호 * 28 + 종성번호) + 44032` 공식에 대한 이해

    - 44032는 '가'의 코드다. '가'는 유니코드 한글 체계의 첫 번째다.
    - 자음이 가질 수 있는 문자의 개수는 588개이므로 `자음번호 * 588`로 표현 가능하다.
    - 자음이 정해졌을 때 모음이 가질 수 있는 문자의 개수는 종성의 개수(없음도 포함이다) 28개이므로 `모음번호 * 28`로 표현 가능하다.
    - 종성이 없을 경우, 종성번호는 0이다.

    이 공식을 이용해서 초성과 중성이 같은 첫 번째 글자를 구할 수 있다.(예. '가'에서 '갛'의 28개 글자 중 '가')
    1. 음절의 문자 코드를 구한다.
    2. 44032를 뺀다.
    3. 28로 나누어 소숫점 아래는 버린다.
    4. 다시 28로 곱한다.
    5. 44032를 더한다.

    여기서 27만 더하면 마지막 글자도 구할 수 있다.(예. '가'에서 '갛'의 28개 글자 중 '갛')

    28 대신 588로 계산을 하면 초성이 같은 첫 번째글자와 마지막 글자를 구할 수 있다.
    1. 음절의 문자 코드를 구한다.
    2. 44032를 뺀다.
    3. 588로 나누어 소숫점 아래는 버린다.
    4. 다시 588로 곱한다.
    5. 44032를 더한다.
  */

  // 초성 또는 음절을 포함하거나 같은 음절 찾기
  function ch2pattern(ch) {
    const offset = 44032; // '가'의 코드

    if (/[가-힣]/.test(ch)) {
      const chCode = ch.charCodeAt(0) - offset;

      // 종성이 있으면 문자 그대로 찾는다.
      if (chCode % 28 > 0) {
        return ch;
      }

      const begin = Math.floor(chCode / 28) * 28 + offset;
      const end = begin + 27;

      return `[\\u${begin.toString(16)}-\\u${end.toString(16)}}]`;
    }

    if (/[ㄱ-ㅎ]/.test(ch)) {
      // (b)
      const con2syl = {
        ㄱ: "가".charCodeAt(0),
        ㄲ: "까".charCodeAt(0),
        ㄴ: "나".charCodeAt(0),
        ㄷ: "다".charCodeAt(0),
        ㄸ: "따".charCodeAt(0),
        ㄹ: "라".charCodeAt(0),
        ㅁ: "마".charCodeAt(0),
        ㅂ: "바".charCodeAt(0),
        ㅃ: "빠".charCodeAt(0),
        ㅅ: "사".charCodeAt(0),
      };
      const begin =
        con2syl[ch] || (ch.charCodeAt(0) - 12613) * 588 + con2syl["ㅅ"];
      const end = begin + 587;
      return `[${ch}\\u${begin.toString(16)}-\\u${end.toString(16)}}]`;
    }

    return escapeRegExp(ch);
  }

  function createFuzzyMatcher(input) {
    const pattern = input
      .split("")
      .map(ch2pattern)
      .map((pattern) => "(" + pattern + ")")
      .join(".*?");
    return new RegExp(pattern);
  }

  // console.log(createFuzzyMatcher("ㅋㅁㅅ").test("크리스마스"));
  // console.log(createFuzzyMatcher("ㅋㅁㅅ").test("크리스"));
  // console.log(createFuzzyMatcher("고라").test("골라"));
  // console.log(createFuzzyMatcher("고라").test("가라"));
  // console.log(createFuzzyMatcher("군ㄱㅁ").test("군고구마"));
  // console.log(createFuzzyMatcher("군ㄱㅁ").test("궁고구마"));

  const cityNames = [
    {
      순위: 1,
      행정구역: "서울특별시",
      지역: "수도권",
      행정구분: "광역단체",
      인구: 9741383,
      남자: 4757643,
      여자: 4984230,
      성비: "95.5 : 100",
    },
    {
      순위: 2,
      행정구역: "부산광역시",
      지역: "영남권",
      행정구분: "광역단체",
      인구: 3416918,
      남자: 1680933,
      여자: 1735985,
      성비: "96.8 : 100",
    },
  ];
  function emptyResult(result) {
    result.innerHTML = '<em class="no-result">검색 결과가 없습니다.</em>';
  }
  function setup() {
    const input = document.getElementById("text");
    const result = document.getElementById("result");
    input.addEventListener(
      "keyup",
      () => {
        let val = input.value;
        if (!val) {
          return emptyResult(result);
        }
        const regex = createFuzzyMatcher(val);
        const resultData = cityNames
          .filter((row) => {
            return regex.test(row["행정구역"]);
          })
          .map((row) => {
            let totalDistance = 0;

            const city = row["행정구역"].replace(regex, (match, ...groups) => {
              const letters = groups.slice(0, val.length);
              let lastIndex = 0;
              let highlighted = [];
              for (let i = 0, l = letters.length; i < l; i++) {
                const idx = match.indexOf(letters[i], lastIndex);
                highlighted.push(match.substring(lastIndex, idx));
                highlighted.push(`<mark>${letters[i]}</mark>`);
                if (lastIndex > 0) {
                  totalDistance += idx - lastIndex;
                }
                lastIndex = idx + 1;
              }
              return highlighted.join("");
            });

            return { city, totalDistance };
          });
        resultData.sort((a, b) => {
          return a.totalDistance - b.totalDistance;
        });
        result.innerHTML = resultData.map(({ city }) => city).join("\n");
      },
      false
    );
  }
  setup();
})();
