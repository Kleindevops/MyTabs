/**
 * 纯前端轻量级英语语法分析与着色引擎 (Grammar Engine)
 * 具备分词、词性标注 (POS Tagging)、句子主干与成分分析 (Syntactic Parsing)
 * 零外部依赖，毫秒级离线运行，安全无沙箱风险
 */

export type SyntaxRole =
  | 'subject' // 主语
  | 'predicate' // 谓语动词/动词短语
  | 'object' // 宾语
  | 'predicative' // 表语/主语补足语
  | 'modifier' // 修饰语 (定语/状语/介词短语)
  | 'conjunction' // 连词/从属引导词
  | 'clause' // 从句块
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
  tenseInfo?: string // 时态语态提示 (如 "一般过去时", "进行时", "被动语态")
  isClauseLeader?: boolean // 是否为从句引导词
}

export interface AnalyzedSentence {
  original: string
  tokens: GrammarToken[]
}

// -------------------------------------------------------------
// 高频语法词库与词法模式
// -------------------------------------------------------------

const PRONOUNS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
  'everyone', 'everybody', 'someone', 'somebody', 'anyone', 'anybody', 'nobody',
  'everything', 'something', 'anything', 'nothing', 'one', 'none'
])

const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'as', 'into',
  'through', 'during', 'including', 'against', 'among', 'throughout', 'despite',
  'towards', 'upon', 'concerning', 'of', 'over', 'before', 'after', 'above',
  'below', 'under', 'between', 'without', 'behind', 'across', 'around', 'within'
])

const CONJUNCTIONS = new Set([
  'and', 'but', 'or', 'nor', 'so', 'yet', 'for',
  'although', 'though', 'even', 'because', 'since', 'as',
  'while', 'whereas', 'if', 'unless', 'whether',
  'that', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'before', 'after', 'until', 'till', 'once'
])

const CLAUSE_LEADERS = new Set([
  'that', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'because', 'although', 'though', 'since', 'if', 'unless', 'while', 'whereas', 'whether'
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

// 常见不规则动词过去式与分词表
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
  ['lost', { base: 'lose', tense: '过去时/分词' }]
])

// -------------------------------------------------------------
// 1. 分词器 (Tokenizer)
// -------------------------------------------------------------

function tokenizeSentence(text: string): string[] {
  // 匹配英语单词、带缩写撇号的词 (don't, it's)、数字或单个标点符号
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

  if (PRONOUNS.has(word)) {
    return { pos: 'pronoun', label: '代词' }
  }

  if (DETERMINERS.has(word)) {
    return { pos: 'determiner', label: '限定词/冠词' }
  }

  if (PREPOSITIONS.has(word)) {
    return { pos: 'preposition', label: '介词' }
  }

  if (CONJUNCTIONS.has(word)) {
    return { pos: 'conjunction', label: '连词' }
  }

  if (MODAL_VERBS.has(word)) {
    return { pos: 'modal', label: '情态动词', tense: '情态动词' }
  }

  if (BE_VERBS.has(word)) {
    const tense = (word === 'was' || word === 'were') ? '一般过去时' : (word === 'been' ? '过去分词' : (word === 'being' ? '现在分词/进行时' : '一般现在时'))
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
    return { pos: 'verb', label: '动词 (不规则)', tense: info.tense }
  }

  // 后缀形态学规则识别
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
    return { pos: 'verb', label: '现在分词 / 动名词', tense: '进行/动名词' }
  }

  if (word.endsWith('ed') && word.length > 3) {
    return { pos: 'verb', label: '动词 (规则过去式/分词)', tense: '过去时/分词' }
  }

  if (word.endsWith('ize') || word.endsWith('ise') || word.endsWith('ate') || word.endsWith('ify')) {
    return { pos: 'verb', label: '动词' }
  }

  // 默认推断为名词或常规词汇
  return { pos: 'noun', label: '名词' }
}

// -------------------------------------------------------------
// 3. 句子成分识别与长难句主干分析 (Syntactic Parser)
// -------------------------------------------------------------

function parseSyntacticRoles(tokens: GrammarToken[]): void {
  const len = tokens.length
  if (len === 0) return

  // 第一遍：标记连词与从句起始点
  for (let i = 0; i < len; i++) {
    const t = tokens[i]
    if (CLAUSE_LEADERS.has(t.normalized)) {
      t.isClauseLeader = true
      t.syntaxRole = 'conjunction'
      t.syntaxLabel = '从属引导词 / 连词'
    } else if (t.pos === 'punctuation') {
      t.syntaxRole = 'punctuation'
      t.syntaxLabel = '标点符号'
    }
  }

  // 寻找主句核心谓语动词位置
  let mainVerbIdx = -1

  for (let i = 0; i < len; i++) {
    const t = tokens[i]
    if (t.pos === 'punctuation') continue
    if (t.isClauseLeader) {
      // 遇到引导词跳过从句区域
      break
    }

    // 优先匹配情态动词、be动词、助动词或明确动词
    if (
      t.pos === 'modal' ||
      BE_VERBS.has(t.normalized) ||
      LINKING_VERBS.has(t.normalized) ||
      (t.pos === 'verb' && !t.normalized.endsWith('ing')) ||
      (t.pos === 'auxiliary' && i + 1 < len && tokens[i + 1].pos === 'verb')
    ) {
      mainVerbIdx = i
      break
    }
  }

  // 如果前半段没找到，从前往后扫描第一个非引导从句的动词
  if (mainVerbIdx === -1) {
    for (let i = 0; i < len; i++) {
      if (tokens[i].pos === 'verb' || tokens[i].pos === 'modal') {
        mainVerbIdx = i
        break
      }
    }
  }

  // 若成功定位到核心谓语动词
  if (mainVerbIdx !== -1) {
    // 1. 动词群标记为谓语 (Predicate)
    tokens[mainVerbIdx].syntaxRole = 'predicate'
    tokens[mainVerbIdx].syntaxLabel = '谓语核心动词'

    // 检查前后连带的助动词/情态动词，合并为谓语动词短语
    if (mainVerbIdx > 0 && (tokens[mainVerbIdx - 1].pos === 'modal' || tokens[mainVerbIdx - 1].pos === 'auxiliary')) {
      tokens[mainVerbIdx - 1].syntaxRole = 'predicate'
      tokens[mainVerbIdx - 1].syntaxLabel = '谓语助动词'
    }
    if (mainVerbIdx + 1 < len && (tokens[mainVerbIdx + 1].pos === 'verb')) {
      tokens[mainVerbIdx + 1].syntaxRole = 'predicate'
      tokens[mainVerbIdx + 1].syntaxLabel = '主要动词'
    }

    // 2. 谓语动词之前的内容（除状语介词短语外）标记为主语 (Subject)
    let inPrepositionBeforeVerb = false
    for (let i = 0; i < mainVerbIdx; i++) {
      const t = tokens[i]
      if (t.syntaxRole === 'predicate' || t.syntaxRole === 'punctuation') continue

      if (t.pos === 'preposition') {
        inPrepositionBeforeVerb = true
      }

      if (inPrepositionBeforeVerb) {
        t.syntaxRole = 'modifier'
        t.syntaxLabel = '前置状语 / 介词短语'
      } else {
        t.syntaxRole = 'subject'
        t.syntaxLabel = t.pos === 'noun' ? '主语 (核心名词)' : (t.pos === 'pronoun' ? '主语 (代词)' : '主语修饰成分')
      }
    }

    // 3. 谓语动词之后的内容解析：宾语/表语/后置定语与状语
    let pastVerbEnd = mainVerbIdx + 1
    if (pastVerbEnd < len && tokens[pastVerbEnd].syntaxRole === 'predicate') {
      pastVerbEnd++
    }

    let foundObject = false
    let inClause = false
    let inPostModifier = false

    for (let i = pastVerbEnd; i < len; i++) {
      const t = tokens[i]
      if (t.syntaxRole === 'punctuation') {
        if (t.text === ',' || t.text === ';') {
          inPostModifier = true
        }
        continue
      }

      if (t.isClauseLeader) {
        inClause = true
      }

      if (inClause) {
        t.syntaxRole = 'modifier'
        t.syntaxLabel = '从句结构 (定语/状语/名词从句)'
        continue
      }

      if (t.pos === 'preposition') {
        inPostModifier = true
      }

      if (!foundObject && !inPostModifier) {
        if (t.pos === 'noun' || t.pos === 'pronoun' || t.pos === 'determiner' || t.pos === 'adjective') {
          const isLinking = BE_VERBS.has(tokens[mainVerbIdx].normalized) || LINKING_VERBS.has(tokens[mainVerbIdx].normalized)
          t.syntaxRole = isLinking ? 'predicative' : 'object'
          t.syntaxLabel = isLinking ? '表语 / 主语补足语' : '宾语'
          if (t.pos === 'noun' || t.pos === 'pronoun') {
            foundObject = true
          }
          continue
        }
      }

      t.syntaxRole = 'modifier'
      t.syntaxLabel = inPostModifier ? '后置修饰语 (介词短语/定语/状语)' : '补充说明'
    }
  } else {
    // 无法精准确定谓语的短语或不完整句：按词性平滑标注为通用成分
    tokens.forEach((t) => {
      if (t.syntaxRole === 'unknown') {
        if (t.pos === 'noun' || t.pos === 'pronoun') {
          t.syntaxRole = 'subject'
          t.syntaxLabel = '名词主体'
        } else if (t.pos === 'verb') {
          t.syntaxRole = 'predicate'
          t.syntaxLabel = '动词动作'
        } else if (t.pos === 'preposition' || t.pos === 'adverb') {
          t.syntaxRole = 'modifier'
          t.syntaxLabel = '修饰成分'
        } else {
          t.syntaxRole = 'modifier'
          t.syntaxLabel = t.posLabel
        }
      }
    })
  }
}

// -------------------------------------------------------------
// 4. 对外主入口：分析英文段落 (analyzeEnglishGrammar)
// -------------------------------------------------------------

export function analyzeEnglishGrammar(text: string): AnalyzedSentence[] {
  if (!text || !text.trim()) return []

  // 按标点拆分句子，同时保留标点符号
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

    // 进行句法成分分析
    parseSyntacticRoles(tokens)

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
        // 句子成分视角：主语、谓语、宾语、表语、修饰语、连词
        switch (token.syntaxRole) {
          case 'subject':
            roleClass = 'mt-role-subject'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 主语 (Subject)<br/><span class="mt-tip-sub">${escapeHtml(token.posLabel)}</span>`
            break
          case 'predicate':
            roleClass = 'mt-role-predicate'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 谓语 (Predicate)<br/><span class="mt-tip-sub">${escapeHtml(token.tenseInfo || token.posLabel)}</span>`
            break
          case 'object':
            roleClass = 'mt-role-object'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 宾语 (Object)<br/><span class="mt-tip-sub">${escapeHtml(token.posLabel)}</span>`
            break
          case 'predicative':
            roleClass = 'mt-role-predicative'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 表语 (Predicative)<br/><span class="mt-tip-sub">${escapeHtml(token.posLabel)}</span>`
            break
          case 'modifier':
            roleClass = 'mt-role-modifier'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 修饰成分 (Modifier)<br/><span class="mt-tip-sub">${escapeHtml(token.syntaxLabel)}</span>`
            break
          case 'conjunction':
            roleClass = 'mt-role-conjunction'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · 引导词 / 连词<br/><span class="mt-tip-sub">${escapeHtml(token.posLabel)}</span>`
            break
          default:
            roleClass = 'mt-role-other'
            tooltipContent = `<strong>${escapeHtml(token.text)}</strong> · ${escapeHtml(token.posLabel)}`
        }
      } else {
        // 词性视角：名、动、形、副、介、代、连
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
