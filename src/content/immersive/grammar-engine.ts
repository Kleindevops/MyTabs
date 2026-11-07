/**
 * 纯前端专业级英语语法分析与着色引擎 (Grammar Engine v2.1)
 * 具备高频副词/形容词库、精准形态学识别、并列/复合子句切分与递归主谓宾句法分析
 * 零外部依赖，毫秒级离线运行，安全无沙箱风险
 */

export type SyntaxRole =
  | 'subject' // 主语
  | 'predicate' // 谓语动词/动词短语
  | 'object' // 宾语
  | 'predicative' // 表语/主语补足语
  | 'modifier' // 修饰语 (定语/状语/介词短语)
  | 'conjunction' // 连词/从属引导词
  | 'punctuation' // 标点符号
  | 'unknown' // 未明确成分

export type PartOfSpeech =
  | 'noun' // 名词
  | 'verb' // 动词
  | 'adjective' // 形容词
  | 'adverb' // 副词
  | 'pronoun' // 代词
  | 'preposition' // 介词
  | 'conjunction' // 连词
  | 'determiner' // 冠词/限定词
  | 'numeral' // 数词
  | 'modal' // 情态动词
  | 'auxiliary' // 助动词
  | 'punctuation' // 标点
  | 'other' // 其他

export interface GrammarToken {
  text: string
  normalized: string
  pos: PartOfSpeech
  posLabel: string // 中文词性说明
  syntaxRole: SyntaxRole
  syntaxLabel: string // 中文成分说明
  tenseInfo?: string // 时态语态提示 (如 "一般过去时", "进行时", "完成时")
  isClauseLeader?: boolean // 是否为从句引导词
}

export interface AnalyzedSentence {
  original: string
  tokens: GrammarToken[]
}

// -------------------------------------------------------------
// 高频语法词库与词法模式
// -------------------------------------------------------------

// 主格代词 (主语主体)
const SUBJECT_PRONOUNS = new Set([
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'who', 'whoever'
])

// 宾格代词 (宾语主体)
const OBJECT_PRONOUNS = new Set([
  'me', 'him', 'her', 'us', 'them', 'whom', 'whomever'
])

// 物主限定词 (my, your...)
const POSSESSIVE_DETERMINERS = new Set([
  'my', 'your', 'his', 'her', 'its', 'our', 'their'
])

// 其他通用代词
const OTHER_PRONOUNS = new Set([
  'myself', 'yourself', 'yourselves', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
  'this', 'that', 'these', 'those', 'which', 'what',
  'everyone', 'everybody', 'someone', 'somebody', 'anyone', 'anybody', 'nobody',
  'everything', 'something', 'anything', 'nothing', 'one', 'none'
])

// 连接副词/前置状语词
const CONJUNCTIVE_ADVERBS = new Set([
  'thus', 'therefore', 'however', 'moreover', 'furthermore', 'nevertheless', 'nonetheless',
  'meanwhile', 'instead', 'otherwise', 'indeed', 'besides', 'finally', 'consequently',
  'suddenly', 'actually', 'obviously', 'fortunately', 'unfortunately', 'now', 'then',
  'today', 'yesterday', 'tomorrow', 'perhaps', 'probably', 'maybe'
])

// 高频副词表 (非 -ly 结尾的常用副词)
const COMMON_ADVERBS = new Set([
  'always', 'never', 'often', 'usually', 'sometimes', 'seldom', 'hardly', 'scarcely', 'barely', 'rarely',
  'already', 'still', 'yet', 'soon', 'just', 'almost', 'nearly', 'quite', 'rather', 'very', 'too',
  'really', 'certainly', 'definitely', 'probably', 'perhaps', 'maybe', 'indeed',
  'together', 'alone', 'apart', 'away', 'back', 'abroad', 'ahead',
  'again', 'ever', 'also', 'even', 'well', 'far', 'near', 'late', 'early'
])

// 高频形容词表
const COMMON_ADJECTIVES = new Set([
  'wise', 'free', 'alone', 'good', 'bad', 'great', 'small', 'little', 'big', 'large', 'huge',
  'new', 'old', 'young', 'long', 'short', 'high', 'low', 'deep', 'shallow',
  'true', 'false', 'clear', 'sure', 'certain', 'easy', 'hard', 'difficult', 'simple',
  'happy', 'sad', 'glad', 'sorry', 'fine', 'nice', 'rich', 'poor', 'hot', 'cold',
  'right', 'wrong', 'real', 'main', 'major', 'minor', 'ready', 'able', 'alive', 'asleep'
])

const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'as', 'into',
  'through', 'during', 'including', 'against', 'among', 'throughout', 'despite',
  'towards', 'upon', 'concerning', 'of', 'over', 'before', 'after', 'above',
  'below', 'under', 'between', 'without', 'behind', 'across', 'around', 'within',
  'like', 'near', 'since', 'until', 'except'
])

const CLAUSE_LEADERS = new Set([
  'that', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'because', 'although', 'though', 'since', 'if', 'unless', 'while', 'whereas',
  'whether', 'after', 'before', 'until', 'as'
])

const COORDINATING_CONJUNCTIONS = new Set([
  'and', 'but', 'or', 'nor', 'so', 'yet'
])

const DETERMINERS = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his',
  'her', 'its', 'our', 'their', 'some', 'any', 'every', 'each', 'all', 'both',
  'neither', 'either', 'no', 'another', 'such', 'much', 'many', 'few', 'little'
])

const MODAL_VERBS = new Set([
  'can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would', 'ought'
])

const BE_VERBS = new Set([
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
])

const AUXILIARY_VERBS = new Set([
  'have', 'has', 'had', 'do', 'does', 'did', 'having'
])

const LINKING_VERBS = new Set([
  'seem', 'seems', 'seemed', 'appear', 'appears', 'appeared',
  'look', 'looks', 'looked', 'feel', 'feels', 'felt',
  'sound', 'sounds', 'sounded', 'taste', 'tastes', 'tasted',
  'smell', 'smells', 'smelled', 'become', 'becomes', 'became',
  'remain', 'remains', 'remained', 'turn', 'turns', 'turned',
  'stay', 'stays', 'stayed', 'grow', 'grows', 'grew'
])

const IRREGULAR_VERBS = new Map<string, { base: string; tense: string }>([
  ['went', { base: 'go', tense: '一般过去时' }],
  ['gone', { base: 'go', tense: '完成时/分词' }],
  ['saw', { base: 'see', tense: '一般过去时' }],
  ['seen', { base: 'see', tense: '完成时/分词' }],
  ['came', { base: 'come', tense: '一般过去时' }],
  ['took', { base: 'take', tense: '一般过去时' }],
  ['taken', { base: 'take', tense: '完成时/分词' }],
  ['made', { base: 'make', tense: '过去时/分词' }],
  ['got', { base: 'get', tense: '一般过去时' }],
  ['gotten', { base: 'get', tense: '完成时/分词' }],
  ['knew', { base: 'know', tense: '一般过去时' }],
  ['known', { base: 'know', tense: '完成时/分词' }],
  ['thought', { base: 'think', tense: '过去时/分词' }],
  ['told', { base: 'tell', tense: '过去时/分词' }],
  ['found', { base: 'find', tense: '过去时/分词' }],
  ['gave', { base: 'give', tense: '一般过去时' }],
  ['given', { base: 'give', tense: '完成时/分词' }],
  ['wrote', { base: 'write', tense: '一般过去时' }],
  ['written', { base: 'write', tense: '完成时/分词' }],
  ['built', { base: 'build', tense: '过去时/分词' }],
  ['brought', { base: 'bring', tense: '过去时/分词' }],
  ['bought', { base: 'buy', tense: '过去时/分词' }],
  ['spoke', { base: 'speak', tense: '一般过去时' }],
  ['spoken', { base: 'speak', tense: '完成时/分词' }],
  ['chose', { base: 'choose', tense: '一般过去时' }],
  ['chosen', { base: 'choose', tense: '完成时/分词' }],
  ['drove', { base: 'drive', tense: '一般过去时' }],
  ['driven', { base: 'drive', tense: '完成时/分词' }],
  ['fell', { base: 'fall', tense: '一般过去时' }],
  ['fallen', { base: 'fall', tense: '完成时/分词' }],
  ['left', { base: 'leave', tense: '过去时/分词' }],
  ['kept', { base: 'keep', tense: '过去时/分词' }],
  ['held', { base: 'hold', tense: '过去时/分词' }],
  ['ran', { base: 'run', tense: '一般过去时' }],
  ['began', { base: 'begin', tense: '一般过去时' }],
  ['begun', { base: 'begin', tense: '完成时/分词' }],
  ['won', { base: 'win', tense: '过去时/分词' }],
  ['understood', { base: 'understand', tense: '过去时/分词' }],
  ['read', { base: 'read', tense: '过去时/分词' }],
  ['sent', { base: 'send', tense: '过去时/分词' }],
  ['spent', { base: 'spend', tense: '过去时/分词' }],
  ['led', { base: 'lead', tense: '过去时/分词' }],
  ['met', { base: 'meet', tense: '过去时/分词' }],
  ['paid', { base: 'pay', tense: '过去时/分词' }],
  ['sat', { base: 'sit', tense: '一般过去时' }],
  ['stood', { base: 'stand', tense: '过去时/分词' }],
  ['lost', { base: 'lose', tense: '过去时/分词' }],
  ['lived', { base: 'live', tense: '过去时/分词' }],
  ['believed', { base: 'believe', tense: '过去时/分词' }],
  ['live', { base: 'live', tense: '动词原形' }]
])

// -------------------------------------------------------------
// 1. 分词器 (Tokenizer)
// -------------------------------------------------------------

function tokenizeSentence(text: string): string[] {
  const tokenRegex = /[A-Za-z]+(?:'[A-Za-z]+)?|\d+(?:\.\d+)?|[^\s\w]/g
  const matches = text.match(tokenRegex)
  return matches || []
}

// -------------------------------------------------------------
// 2. 词形推导与词性标注 (POS Tagger)
// -------------------------------------------------------------

function inferPartOfSpeech(rawWord: string): { pos: PartOfSpeech; label: string; tense?: string } {
  const word = rawWord.toLowerCase()

  if (/^[^a-zA-Z0-9]$/.test(word)) {
    return { pos: 'punctuation', label: '标点符号' }
  }

  if (/^\d+(\.\d+)?$/.test(word)) {
    return { pos: 'numeral', label: '数词' }
  }

  if (CONJUNCTIVE_ADVERBS.has(word)) {
    return { pos: 'adverb', label: '连接副词/状语' }
  }

  if (COMMON_ADVERBS.has(word)) {
    return { pos: 'adverb', label: '副词' }
  }

  if (SUBJECT_PRONOUNS.has(word)) {
    return { pos: 'pronoun', label: '代词 (主格)' }
  }

  if (OBJECT_PRONOUNS.has(word)) {
    return { pos: 'pronoun', label: '代词 (宾格)' }
  }

  if (POSSESSIVE_DETERMINERS.has(word)) {
    return { pos: 'determiner', label: '物主限定词' }
  }

  if (OTHER_PRONOUNS.has(word)) {
    return { pos: 'pronoun', label: '代词' }
  }

  if (DETERMINERS.has(word)) {
    return { pos: 'determiner', label: '限定词/冠词' }
  }

  if (PREPOSITIONS.has(word)) {
    return { pos: 'preposition', label: '介词' }
  }

  if (COORDINATING_CONJUNCTIONS.has(word) || CLAUSE_LEADERS.has(word)) {
    return { pos: 'conjunction', label: '连词/引导词' }
  }

  if (MODAL_VERBS.has(word)) {
    return { pos: 'modal', label: '情态动词', tense: '情态动词' }
  }

  if (BE_VERBS.has(word)) {
    const tense = (word === 'was' || word === 'were') ? '一般过去时' : (word === 'been' ? '过去分词' : (word === 'being' ? '进行时' : '一般现在时'))
    return { pos: 'verb', label: '系动词 / be动词', tense }
  }

  if (AUXILIARY_VERBS.has(word)) {
    const tense = (word === 'did' || word === 'had') ? '过去时' : '现在时'
    return { pos: 'auxiliary', label: '助动词', tense }
  }

  if (LINKING_VERBS.has(word)) {
    return { pos: 'verb', label: '系动词' }
  }

  if (IRREGULAR_VERBS.has(word)) {
    const info = IRREGULAR_VERBS.get(word)!
    return { pos: 'verb', label: '动词', tense: info.tense }
  }

  if (COMMON_ADJECTIVES.has(word)) {
    return { pos: 'adjective', label: '形容词' }
  }

  if (word.endsWith('ly') && word.length > 3) {
    return { pos: 'adverb', label: '副词' }
  }

  if (
    word.endsWith('able') ||
    word.endsWith('ible') ||
    word.endsWith('al') ||
    word.endsWith('ful') ||
    word.endsWith('ic') ||
    word.endsWith('ish') ||
    word.endsWith('ive') ||
    word.endsWith('less') ||
    word.endsWith('ous')
  ) {
    return { pos: 'adjective', label: '形容词' }
  }

  if (
    word.endsWith('tion') ||
    word.endsWith('sion') ||
    word.endsWith('ment') ||
    word.endsWith('ness') ||
    word.endsWith('ity') ||
    word.endsWith('ance') ||
    word.endsWith('ence') ||
    word.endsWith('ism') ||
    word.endsWith('ist') ||
    word.endsWith('ship') ||
    word.endsWith('er') ||
    word.endsWith('or')
  ) {
    return { pos: 'noun', label: '名词' }
  }

  if (word.endsWith('ing') && word.length > 4) {
    return { pos: 'verb', label: '现在分词 / 动名词', tense: '进行/分词' }
  }

  if (word.endsWith('ed') && word.length > 3) {
    return { pos: 'verb', label: '动词 (过去式/分词)', tense: '过去时/分词' }
  }

  // 动词后缀规则过滤 (如 minimize, realize, 但排除 wise, promise 等)
  if (
    ((word.endsWith('ize') || word.endsWith('ise')) && word.length >= 6) ||
    (word.endsWith('ate') && word.length >= 5) ||
    (word.endsWith('ify') && word.length >= 5)
  ) {
    return { pos: 'verb', label: '动词' }
  }

  return { pos: 'noun', label: '名词' }
}

// -------------------------------------------------------------
// 3. 子句主干分析算法 (Clause-level Syntactic Analyzer)
// -------------------------------------------------------------

interface ClauseSegment {
  startIndex: number
  endIndex: number // exclusive
}

function splitIntoClauses(tokens: GrammarToken[]): ClauseSegment[] {
  const clauses: ClauseSegment[] = []
  let curStart = 0

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]

    // 1. 分号与冒号是绝对的独立分句分界线
    if (t.text === ';' || t.text === ':') {
      if (i > curStart) {
        clauses.push({ startIndex: curStart, endIndex: i })
      }
      curStart = i + 1
      continue
    }

    // 2. 从属连词 (that, which, who, because, when...) 开启一个从句
    if (CLAUSE_LEADERS.has(t.normalized) && i > curStart) {
      if (i - curStart >= 2) {
        clauses.push({ startIndex: curStart, endIndex: i })
        curStart = i
      }
    }

    // 3. 并列连词 (and, but, so...) 前有标点时切分
    if (COORDINATING_CONJUNCTIONS.has(t.normalized) && i > curStart && i - curStart >= 2) {
      const prev = tokens[i - 1]
      if (prev && (prev.text === ',' || prev.text === ';')) {
        clauses.push({ startIndex: curStart, endIndex: i })
        curStart = i
      }
    }
  }

  if (curStart < tokens.length) {
    clauses.push({ startIndex: curStart, endIndex: tokens.length })
  }

  return clauses
}

function analyzeSingleClause(tokens: GrammarToken[], start: number, end: number): void {
  const clauseLen = end - start
  if (clauseLen <= 0) return

  let subStart = start

  // 1. 句首连词与引导词 (and, but, that, which...)
  if (
    COORDINATING_CONJUNCTIONS.has(tokens[subStart].normalized) ||
    CLAUSE_LEADERS.has(tokens[subStart].normalized)
  ) {
    tokens[subStart].syntaxRole = 'conjunction'
    tokens[subStart].syntaxLabel = '连词 / 引导词'
    subStart++
  }

  if (subStart >= end) return

  // 2. 句首前置副词/状语 (Thus, Therefore, However, Suddenly...)
  while (subStart < end && (CONJUNCTIVE_ADVERBS.has(tokens[subStart].normalized) || (tokens[subStart].pos === 'adverb' && subStart + 1 < end && tokens[subStart + 1].text === ','))) {
    tokens[subStart].syntaxRole = 'modifier'
    tokens[subStart].syntaxLabel = '前置状语 (副词)'
    subStart++
    if (subStart < end && tokens[subStart].text === ',') {
      tokens[subStart].syntaxRole = 'punctuation'
      subStart++
    }
  }

  // 3. 寻找谓语动词群起点
  let predicateStart = -1
  let predicateEnd = -1

  for (let i = subStart; i < end; i++) {
    const t = tokens[i]
    if (t.pos === 'punctuation') continue

    // 检查是否为助动词/情态动词 (可能后跟副词，如 has always seemed)
    if (t.pos === 'auxiliary' || t.pos === 'modal') {
      let lookAhead = i + 1
      while (lookAhead < end && tokens[lookAhead].pos === 'adverb') {
        lookAhead++
      }
      if (lookAhead < end && (tokens[lookAhead].pos === 'verb' || LINKING_VERBS.has(tokens[lookAhead].normalized) || BE_VERBS.has(tokens[lookAhead].normalized))) {
        predicateStart = i
        predicateEnd = lookAhead + 1
        break
      }
    }

    const isDirectVerb =
      t.pos === 'verb' ||
      t.pos === 'modal' ||
      BE_VERBS.has(t.normalized) ||
      LINKING_VERBS.has(t.normalized)

    if (isDirectVerb) {
      predicateStart = i
      predicateEnd = i + 1

      // 向后吞入连带的不定式 (ought to live) 或后续动词
      while (predicateEnd < end) {
        const next = tokens[predicateEnd]
        if (
          next.pos === 'verb' ||
          BE_VERBS.has(next.normalized) ||
          (next.pos === 'preposition' && next.normalized === 'to' && predicateEnd + 1 < end && (tokens[predicateEnd + 1].pos === 'verb' || tokens[predicateEnd + 1].normalized === 'live'))
        ) {
          predicateEnd++
        } else {
          break
        }
      }
      break
    }
  }

  // 若子句中无动词：全部标记为补充修饰
  if (predicateStart === -1) {
    for (let i = subStart; i < end; i++) {
      if (tokens[i].syntaxRole === 'unknown') {
        tokens[i].syntaxRole = 'modifier'
        tokens[i].syntaxLabel = '修饰成分'
      }
    }
    return
  }

  // 4. 标记谓语动词群 (副词标为修饰状语，动词核心标为谓语)
  for (let i = predicateStart; i < predicateEnd; i++) {
    if (tokens[i].pos === 'adverb') {
      tokens[i].syntaxRole = 'modifier'
      tokens[i].syntaxLabel = '状语 (副词)'
    } else {
      tokens[i].syntaxRole = 'predicate'
      tokens[i].syntaxLabel = '谓语核心动词'
    }
  }

  // 5. 谓语动词之前：解析主语短语 (Subject)
  let foundSubject = false
  for (let i = subStart; i < predicateStart; i++) {
    const t = tokens[i]
    if (t.syntaxRole !== 'unknown') continue

    if (t.pos === 'preposition') {
      t.syntaxRole = 'modifier'
      t.syntaxLabel = '前置介词状语'
      let pIdx = i + 1
      while (pIdx < predicateStart && tokens[pIdx].pos !== 'punctuation') {
        tokens[pIdx].syntaxRole = 'modifier'
        tokens[pIdx].syntaxLabel = '状语成分'
        pIdx++
      }
      i = pIdx - 1
      continue
    }

    if (!foundSubject) {
      if (t.pos === 'pronoun' || t.pos === 'noun' || t.pos === 'determiner' || t.pos === 'adjective') {
        t.syntaxRole = 'subject'
        t.syntaxLabel = t.pos === 'noun' ? '主语 (核心名词)' : (t.pos === 'pronoun' ? '主语 (代词)' : '主语修饰词')

        // 连带吞入形容词修饰 + 核心名词 (如 wise men, the planet)
        let npIdx = i + 1
        while (npIdx < predicateStart && (tokens[npIdx].pos === 'noun' || tokens[npIdx].pos === 'adjective')) {
          tokens[npIdx].syntaxRole = 'subject'
          tokens[npIdx].syntaxLabel = tokens[npIdx].pos === 'noun' ? '主语 (核心名词)' : '主语修饰词'
          npIdx++
        }
        i = npIdx - 1
        foundSubject = true
        continue
      }
    }

    t.syntaxRole = 'modifier'
    t.syntaxLabel = '前置修饰'
  }

  // 6. 谓语动词之后：解析宾语/表语 (Object/Predicative) 与后置修饰
  const isLinking =
    BE_VERBS.has(tokens[predicateStart].normalized) ||
    LINKING_VERBS.has(tokens[predicateStart].normalized) ||
    (predicateEnd > predicateStart + 1 && LINKING_VERBS.has(tokens[predicateEnd - 1].normalized))

  let foundObjectOrPred = false

  for (let i = predicateEnd; i < end; i++) {
    const t = tokens[i]
    if (t.syntaxRole !== 'unknown') continue

    // 遇到介词 (to, without, with, in, on...)：进入介词短语状语
    if (t.pos === 'preposition') {
      t.syntaxRole = 'modifier'
      t.syntaxLabel = '介词状语 / 修饰'
      let pIdx = i + 1
      while (pIdx < end && tokens[pIdx].pos !== 'punctuation' && tokens[pIdx].pos !== 'preposition') {
        tokens[pIdx].syntaxRole = 'modifier'
        tokens[pIdx].syntaxLabel = '修饰成分'
        pIdx++
      }
      i = pIdx - 1
      continue
    }

    // 遇到副词 (alone, free, back...)：判定为状语修饰，绝不误吞为宾语
    if (t.pos === 'adverb' || (t.pos === 'adjective' && foundObjectOrPred)) {
      t.syntaxRole = 'modifier'
      t.syntaxLabel = '状语 / 补语'
      continue
    }

    // 宾语/表语名词短语判定 (my life, the way...)
    if (!foundObjectOrPred) {
      if (t.pos === 'determiner' || t.pos === 'adjective' || t.pos === 'noun' || t.pos === 'pronoun') {
        t.syntaxRole = isLinking ? 'predicative' : 'object'
        t.syntaxLabel = isLinking ? '表语 / 主语补足语' : '宾语'

        let npIdx = i + 1
        // 遇到紧跟的形容词或名词，归入同一个宾语/表语短语
        while (npIdx < end && (tokens[npIdx].pos === 'noun' || (tokens[npIdx].pos === 'adjective' && npIdx + 1 < end && tokens[npIdx + 1].pos === 'noun'))) {
          tokens[npIdx].syntaxRole = isLinking ? 'predicative' : 'object'
          tokens[npIdx].syntaxLabel = isLinking ? '表语核心词' : '宾语核心名词'
          npIdx++
        }
        i = npIdx - 1
        foundObjectOrPred = true
        continue
      }
    }

    t.syntaxRole = 'modifier'
    t.syntaxLabel = '状语 / 补足语'
  }
}

// -------------------------------------------------------------
// 4. 对外主入口：分析英文段落 (analyzeEnglishGrammar)
// -------------------------------------------------------------

export function analyzeEnglishGrammar(text: string): AnalyzedSentence[] {
  if (!text || !text.trim()) return []

  const rawSentences = text.match(/[^.!?\n]+(?:[.!?\n]+|$)/g) || [text]
  const results: AnalyzedSentence[] = []

  for (const rawSen of rawSentences) {
    const trimmed = rawSen.trim()
    if (!trimmed) continue

    const rawTokens = tokenizeSentence(trimmed)
    const tokens: GrammarToken[] = rawTokens.map((rawWord) => {
      const { pos, label, tense } = inferPartOfSpeech(rawWord)
      return {
        text: rawWord,
        normalized: rawWord.toLowerCase(),
        pos,
        posLabel: label,
        syntaxRole: 'unknown',
        syntaxLabel: '',
        tenseInfo: tense
      }
    })

    // 标点符号直接定型
    tokens.forEach((t) => {
      if (t.pos === 'punctuation') {
        t.syntaxRole = 'punctuation'
        t.syntaxLabel = '标点符号'
      }
    })

    // 子句切分并分别分析主谓宾
    const clauses = splitIntoClauses(tokens)
    for (const clause of clauses) {
      analyzeSingleClause(tokens, clause.startIndex, clause.endIndex)
    }

    // 兜底补齐
    tokens.forEach((t) => {
      if (t.syntaxRole === 'unknown') {
        t.syntaxRole = 'modifier'
        t.syntaxLabel = t.posLabel
      }
    })

    results.push({
      original: trimmed,
      tokens
    })
  }

  return results
}

// -------------------------------------------------------------
// 5. HTML 着色渲染器 (renderGrammarToHtml)
// -------------------------------------------------------------

export type GrammarDisplayMode = 'syntax' | 'pos' | 'plain'

export function renderGrammarToHtml(sentences: AnalyzedSentence[], mode: GrammarDisplayMode = 'syntax'): string {
  if (sentences.length === 0) return ''

  return sentences.map((sen) => {
    let senHtml = '<span class="mt-grammar-sentence">'
    sen.tokens.forEach((token, idx) => {
      const isPunctuation = token.pos === 'punctuation'
      const prevToken = idx > 0 ? sen.tokens[idx - 1] : null
      const needsSpace = idx > 0 && !isPunctuation && prevToken && prevToken.pos !== 'punctuation' && !token.text.startsWith("'")

      if (needsSpace) {
        senHtml += ' '
      }

      if (mode === 'plain' || isPunctuation) {
        senHtml += `<span class="mt-token-plain">${escapeHtml(token.text)}</span>`
        return
      }

      let roleClass = ''
      let tooltipContent = ''

      if (mode === 'syntax') {
        switch (token.syntaxRole) {
          case 'subject':
            roleClass = 'mt-role-subject'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 主语 (Subject)<br/><span class="mt-tip-sub">${escapeHtml(token.syntaxLabel)}</span>`
            break
          case 'predicate':
            roleClass = 'mt-role-predicate'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 谓语核心 (Predicate)<br/><span class="mt-tip-sub">${escapeHtml(token.tenseInfo || token.posLabel)}</span>`
            break
          case 'object':
            roleClass = 'mt-role-object'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 宾语 (Object)<br/><span class="mt-tip-sub">${escapeHtml(token.syntaxLabel)}</span>`
            break
          case 'predicative':
            roleClass = 'mt-role-predicative'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 表语 (Predicative)<br/><span class="mt-tip-sub">${escapeHtml(token.syntaxLabel)}</span>`
            break
          case 'modifier':
            roleClass = 'mt-role-modifier'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 状语/修饰 (Modifier)<br/><span class="mt-tip-sub">${escapeHtml(token.syntaxLabel)}</span>`
            break
          case 'conjunction':
            roleClass = 'mt-role-conjunction'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 引导词 / 连词 (Conjunction)<br/><span class="mt-tip-sub">${escapeHtml(token.posLabel)}</span>`
            break
          default:
            roleClass = 'mt-role-other'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · ${escapeHtml(token.posLabel)}`
        }
      } else {
        switch (token.pos) {
          case 'noun':
            roleClass = 'mt-pos-noun'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 名词 (Noun)`
            break
          case 'verb':
          case 'modal':
          case 'auxiliary':
            roleClass = 'mt-pos-verb'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 动词 (Verb)${token.tenseInfo ? ` [${escapeHtml(token.tenseInfo)}]` : ''}`
            break
          case 'adjective':
            roleClass = 'mt-pos-adj'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 形容词 (Adjective)`
            break
          case 'adverb':
            roleClass = 'mt-pos-adv'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 副词 (Adverb)`
            break
          case 'pronoun':
            roleClass = 'mt-pos-pron'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 代词 (Pronoun)`
            break
          case 'preposition':
            roleClass = 'mt-pos-prep'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 介词 (Preposition)`
            break
          case 'conjunction':
            roleClass = 'mt-pos-conj'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 连词 (Conjunction)`
            break
          case 'determiner':
            roleClass = 'mt-pos-det'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 限定词/冠词`
            break
          default:
            roleClass = 'mt-pos-other'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · ${escapeHtml(token.posLabel)}`
        }
      }

      senHtml += `<span class="mt-grammar-token ${roleClass}" data-grammar-tip="${escapeAttr(tooltipContent)}">${escapeHtml(token.text)}</span>`
    })

    senHtml += '</span>'
    return senHtml
  }).join(' ')
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m] || m))
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;')
}
