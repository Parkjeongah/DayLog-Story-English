import { Episode } from '../types';

export const INITIAL_EPISODES: Episode[] = [
  {
    id: 'ep-commute-coffee',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 10),
    rawContent: '오늘 아침 9호선 급행 탔는데 사람이 너무 많아서 숨도 못 쉴 지경이었음. 손에 든 아이스 라떼 쏟을 뻔했는데 옆자리 승객이 가방으로 가려주고 물티슈 건네줘서 극적으로 살았음. 진짜 세상은 아직 따뜻하다 느낀 출근길.',
    mood: 'funny',
    category: 'commute',
    englishStyle: 'vivid',
    title: 'The Great Morning Subway Coffee Rescue',
    koreanTitle: '만원 지하철 속 아찔했던 모닝 라떼 구출 작전',
    summary: '지하철 급행 출근길에 커피를 쏟을 뻔했으나, 친절한 시민의 도움으로 무사히 출근한 훈훈한 아침 썰',
    paragraphs: [
      {
        en: "I hopped onto the Line 9 express train this morning, and it was packed like sardines. You literally couldn't even draw a breath.",
        ko: "오늘 아침 9호선 급행에 올라탔는데, 말 그대로 콩나물시루처럼 빽빽했어요. 숨조차 제대로 쉴 수 없을 정도였죠.",
      },
      {
        en: "The train lurched abruptly, and my iced latte nearly slipped right out of my hand. My heart completely skipped a beat!",
        ko: "열차가 급정거하면서 덜컹거렸고, 손에 쥐고 있던 아이스 라떼를 거의 놓칠 뻔했어요. 심장이 덜컥 내려앉았답니다!",
      },
      {
        en: "Right then, a kind stranger beside me shielded my cup with their backpack and handed me some wet wipes with a warm smile.",
        ko: "바로 그 순간, 옆에 계시던 친절한 분이 자신의 백팩으로 제 컵을 감싸 보호해주며 따뜻한 미소와 함께 물티슈를 건네주셨어요.",
      },
      {
        en: "It was such a close call, but that small act of kindness truly made my whole day.",
        ko: "정말 아슬아슬한 위기였지만, 그 작은 친절 덕분에 하루 종일 기분이 훈훈해졌습니다.",
      },
    ],
    keyExpressions: [
      {
        id: 'expr-packed-sardines',
        phrase: 'packed like sardines',
        meaning: '사람들로 꽉 찬, 콩나물시루 같은',
        usageExample: 'The commuter train was packed like sardines during rush hour.',
        nuanceExplanation: '대중교통이나 좁은 공간에 사람들이 옴짝달싹 못하게 빽빽할 때 원어민들이 가장 많이 쓰는 생생한 비유 표현입니다.',
        category: 'idiom',
        isSaved: true,
      },
      {
        id: 'expr-close-call',
        phrase: 'a close call',
        meaning: '아슬아슬한 위기 모면, 십년감수한 일',
        usageExample: 'Phew, that was a close call! I almost missed the deadline.',
        nuanceExplanation: '사고나 큰 실수를 간발의 차이로 모면했을 때 "휴, 큰일 날 뻔했다"라는 뉘앙스로 씁니다.',
        category: 'colloquial',
        isSaved: true,
      },
      {
        id: 'expr-heart-skipped-beat',
        phrase: 'heart skipped a beat',
        meaning: '심장이 철렁 내려앉다, 깜짝 놀라다',
        usageExample: 'When I saw the boss call my name, my heart skipped a beat.',
        nuanceExplanation: '놀라거나 긴장해서 가슴이 쿵쾅거리는 생리적 반응을 묘사하는 감성적인 표현입니다.',
        category: 'idiom',
      },
      {
        id: 'expr-made-my-day',
        phrase: 'made my day',
        meaning: '하루 전체를 행복하게 만들다, 큰 힘이 되다',
        usageExample: 'Your compliment totally made my day!',
        nuanceExplanation: '사소한 친절이나 기분 좋은 일 덕분에 그날 하루 전체가 특별해졌을 때 감사함을 담아 표현합니다.',
        category: 'colloquial',
      },
    ],
    nuanceUpgrades: [
      {
        awkwardOrKonglish: 'Subway had too many people, so I cannot breathe.',
        naturalNative: 'The train was packed like sardines; you could barely draw a breath.',
        whyBetter: '"Too many people" 대신 "packed like sardines"를 쓰면 만원 열차의 답답함이 머릿속에 시각적으로 그려집니다.',
      },
      {
        awkwardOrKonglish: 'I almost dropped coffee so I was very surprised.',
        naturalNative: 'My iced latte nearly slipped, and my heart completely skipped a beat.',
        whyBetter: '"Very surprised"는 다소 건조하지만, "my heart skipped a beat"는 가슴이 덜컥 내려앉는 현장감을 살려줍니다.',
      },
      {
        awkwardOrKonglish: 'A kind person gave me tissue, so world is warm.',
        naturalNative: 'A kind stranger handed me some wet wipes, restoring my faith in humanity.',
        whyBetter: '"Kind stranger"와 "wet wipes(물티슈)" 같은 구체적인 명사를 쓰고, "warm world"를 세련된 관용구로 발전시킬 수 있습니다.',
      },
    ],
    shadowingSentences: [
      {
        id: 'sh-1',
        en: 'The train lurched abruptly, and my iced latte nearly slipped right out of my hand.',
        ko: '열차가 갑자기 덜컹거렸고, 아이스 라떼가 손에서 미끄러질 뻔했습니다.',
        focusPoint: 'lurched abruptly에서 r 발음과 t 연음, nearly slipped의 강세를 살려 읽어보세요.',
        bestScore: 92,
      },
      {
        id: 'sh-2',
        en: 'A kind stranger beside me shielded my cup and handed me some wet wipes with a warm smile.',
        ko: '옆에 있던 친절한 분이 컵을 막아주고 따뜻한 미소로 물티슈를 건네주셨습니다.',
        focusPoint: 'shielded my cup과 handed me의 자연스러운 동사 연결에 주목하세요.',
      },
      {
        id: 'sh-3',
        en: 'It was such a close call, but that small act of kindness truly made my whole day.',
        ko: '아슬아슬한 순간이었지만, 그 작은 친절이 제 하루를 정말 행복하게 해줬어요.',
        focusPoint: 'such a close call을 한 단어처럼 부드럽게 이어서 발음하세요.',
      },
    ],
    quizQuestions: [
      {
        id: 'q-1',
        question: '사람이 가득 차서 움직이기 힘든 만원 지하철을 묘사할 때 가장 어울리는 표현은?',
        options: ['packed like sardines', 'running out of steam', 'under the weather', 'in the driver seat'],
        answerIndex: 0,
        explanation: '"packed like sardines"는 통조림 속 정어리처럼 빈틈없이 들어찬 모습을 뜻하는 유명한 관용구입니다.',
      },
      {
        id: 'q-2',
        question: '아슬아슬하게 커피를 쏟지 않고 위기를 모면했을 때 영어로 외칠 수 있는 감탄사는?',
        options: ['Break a leg!', 'That was a close call!', 'No offense taken!', 'Cut corners!'],
        answerIndex: 1,
        explanation: '"That was a close call!"은 십년감수했거나 위험을 간발의 차로 피했을 때 쓰는 단골 표현입니다.',
      },
    ],
    isFavorite: true,
  },
  {
    id: 'ep-work-coding',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // yesterday
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString().slice(0, 10),
    rawContent: '어제부터 계속 발생하던 비동기 상태 불일치 버그 때문에 3시간 동안 모니터만 노려봤다. 팀원들이랑 머리 싸매도 안 풀리더니, 퇴근 직전에 커피 한 잔 마시고 코드 다시 보니까 세미콜론과 조건문 하나가 잘못되어 있었음. 수정하고 테스트 통과하는 순간 온몸에 도파민 폭발!',
    mood: 'proud',
    category: 'work',
    englishStyle: 'casual',
    title: 'Cracking the Midnight Bug',
    koreanTitle: '3시간의 사투 끝에 찾아낸 기적의 한 줄',
    summary: '오랜 시간 애를 먹이던 비동기 버그를 퇴근 직전 드라마틱하게 해결하며 성취감을 만끽한 하루',
    paragraphs: [
      {
        en: "I had been staring blankly at my monitor for three straight hours, completely stumped by a stubborn async state bug.",
        ko: "고질적인 비동기 상태 버그 때문에 멘붕이 와서 장장 3시간 동안 모니터만 멍하니 바라보고 있었어요.",
      },
      {
        en: "My colleagues and I put our heads together, but we kept hitting a brick wall over and over again.",
        ko: "동료들과 머리를 맞대고 의논했지만, 계속해서 막다른 벽에 부딪히는 기분이었죠.",
      },
      {
        en: "Just before giving up and calling it a day, I grabbed a fresh cup of espresso and took one last glance at the logic.",
        ko: "그냥 포기하고 퇴근하려던 찰나, 에스프레소 한 잔을 뽑아 들고 마지막으로 로직을 쓱 훑어보았습니다.",
      },
      {
        en: "Suddenly, boom! The typo jumped right out at me. Fixing that single line felt like an instant dopamine rush!",
        ko: "그런데 웬걸, 오타 하나가 눈에 확 띄는 게 아니겠어요! 그 단 한 줄을 고치고 통과하는 순간 도파민이 폭발했습니다!",
      },
    ],
    keyExpressions: [
      {
        id: 'expr-hit-brick-wall',
        phrase: 'hit a brick wall',
        meaning: '진행이 막히다, 난관에 부딪히다',
        usageExample: 'We were making great progress until we hit a brick wall with the database architecture.',
        nuanceExplanation: '노력해도 더 이상 진척이 없고 꽉 막힌 상태를 벽에 부딪힌 그림으로 표현합니다.',
        category: 'idiom',
      },
      {
        id: 'expr-call-it-a-day',
        phrase: 'call it a day',
        meaning: '오늘은 이만 마치다, 하루 일과를 끝내다',
        usageExample: "It's already past 8 PM. Let's call it a day and pick it up tomorrow.",
        nuanceExplanation: '퇴근할 때나 작업을 그만두고 마무리할 때 가장 많이 쓰는 자연스러운 일상 회화 표현입니다.',
        category: 'colloquial',
        isSaved: true,
      },
      {
        id: 'expr-put-heads-together',
        phrase: 'put our heads together',
        meaning: '머리를 맞대고 상의하다',
        usageExample: 'If we put our heads together, we can solve this problem in no time.',
        nuanceExplanation: '혼자 해결하기 어려운 문제를 여러 사람이 모여 함께 고민할 때 씁니다.',
        category: 'idiom',
      },
    ],
    nuanceUpgrades: [
      {
        awkwardOrKonglish: 'I looked at monitor 3 hours because bug was difficult.',
        naturalNative: 'I was staring blankly at my screen for three straight hours, stumped by a bug.',
        whyBetter: '"Staring blankly"와 "stumped(도무지 갈피를 못 잡는)"를 활용하면 진 빠지는 답답함이 훨씬 잘 전달됩니다.',
      },
      {
        awkwardOrKonglish: 'Before going home, I fixed it and dopamine was boom.',
        naturalNative: 'Just before calling it a day, I resolved it, giving me an instant dopamine rush.',
        whyBetter: '"Call it a day"와 "dopamine rush"는 네이티브들이 자주 쓰는 감칠맛 나는 일상 표현입니다.',
      },
    ],
    shadowingSentences: [
      {
        id: 'sh-work-1',
        en: 'My colleagues and I put our heads together, but we kept hitting a brick wall.',
        ko: '동료들과 머리를 맞댔지만 계속해서 벽에 부딪혔습니다.',
        focusPoint: 'put our heads together의 부드러운 연음과 hitting a brick wall의 리듬을 살려보세요.',
      },
      {
        id: 'sh-work-2',
        en: 'Fixing that single line of code felt like an instant dopamine rush!',
        ko: '그 코드 한 줄을 수정한 순간은 짜릿한 도파민 폭발 그 자체였습니다!',
        focusPoint: 'single line of code와 instant dopamine rush에 또렷한 악센트를 주세요.',
      },
    ],
    quizQuestions: [
      {
        id: 'q-work-1',
        question: '"오늘은 이만 퇴근하자/마무리하자"라고 동료에게 말할 때 가장 자연스러운 표현은?',
        options: ["Let's call it a day.", "Let's make it a day.", "Let's finish the sun.", "Let's drop the curtain."],
        answerIndex: 0,
        explanation: '"Let\'s call it a day"는 미국/영국 직장인들이 퇴근할 때 매일같이 쓰는 관용구입니다.',
      },
    ],
  },
  {
    id: 'ep-cozy-bakery',
    createdAt: new Date().toISOString(), // today
    date: new Date().toISOString().slice(0, 10),
    rawContent: '주말 오후에 조용한 골목 산책하다가 고소한 버터 향기에 이끌려 우연히 작은 동네 빵집에 들어갔음. 방금 갓 구워져 나온 따끈따끈한 크루아상에 바닐라 라떼를 곁들였는데, 한 입 베어 물자마자 바삭한 소리와 함께 이번 주 쌓였던 스트레스가 눈 녹듯 사라졌다.',
    mood: 'peaceful',
    category: 'cafe',
    englishStyle: 'casual',
    title: 'A Warm Afternoon at a Hidden Bakery',
    koreanTitle: '골목길 버터 향기 가득한 인생 빵집 탐방',
    summary: '산책 중 우연히 발견한 아담한 베이커리에서 갓 구운 크루아상과 커피로 주말의 여유를 만끽한 힐링 에피소드',
    paragraphs: [
      {
        en: "While strolling through a quiet alley this afternoon, an irresistible aroma of fresh butter lured me into a quaint neighborhood bakery.",
        ko: "오늘 오후 한적한 골목길을 거닐던 중, 고소한 버터 향기에 홀린 듯 이끌려 아담한 동네 빵집으로 발걸음을 옮겼어요.",
      },
      {
        en: "I ordered a piping hot, freshly-baked croissant paired with a creamy vanilla latte.",
        ko: "방금 오븐에서 나와 김이 모락모락 나는 갓 구운 크루아상과 부드러운 바닐라 라떼를 주문했습니다.",
      },
      {
        en: "The first crispy bite absolutely hit the spot, instantly melting away all the pent-up tension from a hectic workweek.",
        ko: "바삭한 첫 입은 그야말로 완벽하게 취향을 저격했고, 바빴던 한 주 동안 쌓였던 모든 긴장이 사르르 녹아내렸습니다.",
      },
    ],
    keyExpressions: [
      {
        id: 'expr-hit-the-spot',
        phrase: 'hit the spot',
        meaning: '딱 원하던 바로 그 맛이다, 흡족하다',
        usageExample: 'That cold glass of lemonade really hit the spot after the run.',
        nuanceExplanation: '배고프거나 피곤할 때 음식이나 음료가 갈증과 피로를 딱 알맞게 해소해줄 때 쓰는 최고의 찬사입니다.',
        category: 'colloquial',
        isSaved: true,
      },
      {
        id: 'expr-piping-hot',
        phrase: 'piping hot',
        meaning: '김이 모락모락 나는, 아주 뜨끈뜨끈한',
        usageExample: 'Be careful! The soup is piping hot.',
        nuanceExplanation: '음식이 갓 조리되어 펄펄 끓거나 따끈따끈한 상태를 묘사할 때 자주 씁니다.',
        category: 'colloquial',
      },
      {
        id: 'expr-melt-away',
        phrase: 'melt away',
        meaning: '사르르 녹아내리다, 말끔히 사라지다',
        usageExample: 'A warm bath will help your fatigue melt away.',
        nuanceExplanation: '스트레스, 걱정, 피로 등이 부드럽게 사라지는 느낌을 줄 때 씁니다.',
        category: 'phrasal_verb',
      },
    ],
    nuanceUpgrades: [
      {
        awkwardOrKonglish: 'I smelled butter and went into bakery.',
        naturalNative: 'An irresistible aroma of fresh butter lured me into a quaint bakery.',
        whyBetter: '"Smelled butter" 대신 "irresistible aroma"와 "lured me(매혹해 이끌다)"를 사용하면 문학적이고 감각적인 묘사가 됩니다.',
      },
      {
        awkwardOrKonglish: 'Croissant was very delicious and stress was zero.',
        naturalNative: 'The croissant absolutely hit the spot, melting away all my stress.',
        whyBetter: '"Hit the spot"은 원어민들이 맛있는 음식을 먹었을 때 가장 즐겨 쓰는 감탄 표현입니다.',
      },
    ],
    shadowingSentences: [
      {
        id: 'sh-bakery-1',
        en: 'The first crispy bite absolutely hit the spot, instantly melting away all my stress.',
        ko: '바삭한 첫 입은 제 취향을 완벽히 저격했고, 모든 스트레스를 사르르 녹여주었습니다.',
        focusPoint: 'hit the spot과 melting away의 자연스러운 강세 억양을 따라 해보세요.',
      },
    ],
    quizQuestions: [
      {
        id: 'q-bakery-1',
        question: '음식이나 음료가 너무 맛있어서 "와, 딱 원하던 바로 그 맛이야!"라고 할 때 쓰는 표현은?',
        options: ['It hit the spot!', 'It burned the bridge!', 'It spilt the tea!', 'It blew the whistle!'],
        answerIndex: 0,
        explanation: '"It hit the spot!"은 갈증이나 출출함을 완벽하게 채워줄 때 원어민들이 감탄사처럼 쓰는 표현입니다.',
      },
    ],
  },
];
