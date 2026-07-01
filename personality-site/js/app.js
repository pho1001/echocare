/**
 * EchoCare · 控制台 — 前端应用 v2
 * ==========================================================
 * 功能：智能体管理 / 性别语音联动 / 预设+自定人格双分支
 *       AI润色 / 二次确认 / 实时预览 / 分享码
 */

// ======================== 工具 ========================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ======================== 全局常量 ========================
const FIXED_WAKE_WORD = 'hi echo';
const DEFAULT_AGENT_NAME = 'echo';

// ======================== 语言/方言 + 语音数据 ========================
// 语言/方言列表 (每种独立, 各自有独立语音角色)
const LANGUAGES = [
  { id: 'zh-CN', name: '普通话', defaultVoice: { female: 'zh-CN-XiaoxiaoNeural', male: 'zh-CN-YunjianNeural' } },
  { id: 'zh-CN-liaoning', name: '东北话', defaultVoice: { female: 'zh-CN-liaoning-XiaobeiNeural', male: 'zh-CN-liaoning-XiaobeiNeural' } },
  { id: 'zh-CN-shaanxi', name: '陕西话', defaultVoice: { female: 'zh-CN-shaanxi-XiaoniNeural', male: 'zh-CN-shaanxi-XiaoniNeural' } },
  { id: 'zh-TW', name: '台湾国语', defaultVoice: { female: 'zh-TW-HsiaoChenNeural', male: 'zh-TW-YunJheNeural' } },
  { id: 'zh-HK', name: '粤语', defaultVoice: { female: 'zh-HK-HiuGaaiNeural', male: 'zh-HK-WanLungNeural' } },
  { id: 'en-US', name: 'English', defaultVoice: { female: 'en-US-JennyNeural', male: 'en-US-GuyNeural' } },
  { id: 'ja-JP', name: '日本語', defaultVoice: { female: 'ja-JP-NanamiNeural', male: 'ja-JP-KeitaNeural' } },
  { id: 'ko-KR', name: '한국어', defaultVoice: { female: 'ko-KR-SunHiNeural', male: 'ko-KR-InJoonNeural' } },
];
const LANG_MAP = {}; LANGUAGES.forEach(l => { LANG_MAP[l.id] = l; });
const DEFAULT_LANG = 'zh-CN';

// 所有语音角色 (按语言+性别组织, 每种语言有独立的语音列表)
const VOICES = {
  'zh-CN': {
    female: [
      { v: 'zh-CN-XiaoxiaoNeural', n: '晓晓 · 清新自然 (推荐)' },
      { v: 'zh-CN-XiaoyiNeural', n: '晓依 · 甜美活泼' },
      { v: 'zh-CN-XiaohanNeural', n: '晓涵 · 温柔抒情' },
      { v: 'zh-CN-XiaomoNeural', n: '晓墨 · 知性成熟' },
      { v: 'zh-CN-XiaoruiNeural', n: '晓睿 · 沉稳专业' },
      { v: 'zh-CN-XiaoshuangNeural', n: '晓双 · 可爱少女' },
    ],
    male: [
      { v: 'zh-CN-YunxiNeural', n: '云希 · 青春活泼' },
      { v: 'zh-CN-YunjianNeural', n: '云健 · 阳光运动 (推荐)' },
      { v: 'zh-CN-YunhaoNeural', n: '云皓 · 磁性广告' },
      { v: 'zh-CN-YunyangNeural', n: '云扬 · 沉稳新闻' },
      { v: 'zh-CN-YunyeNeural', n: '云野 · 温柔治愈' },
    ]
  },
  'zh-CN-liaoning': {
    female: [{ v: 'zh-CN-liaoning-XiaobeiNeural', n: '晓北 · 地道东北味' }],
    male:   [{ v: 'zh-CN-liaoning-XiaobeiNeural', n: '晓北 · 地道东北味' }],
  },
  'zh-CN-shaanxi': {
    female: [{ v: 'zh-CN-shaanxi-XiaoniNeural', n: '晓妮 · 正宗陕西方言' }],
    male:   [{ v: 'zh-CN-shaanxi-XiaoniNeural', n: '晓妮 · 正宗陕西方言' }],
  },
  'zh-TW': {
    female: [{ v: 'zh-TW-HsiaoChenNeural', n: '晓臻 · 温柔台普' }],
    male:   [{ v: 'zh-TW-YunJheNeural', n: '云哲 · 阳光台普' }],
  },
  'zh-HK': {
    female: [{ v: 'zh-HK-HiuGaaiNeural', n: '晓佳 · 地道粤语' }],
    male:   [{ v: 'zh-HK-WanLungNeural', n: '云龙 · 地道粤语' }],
  },
  'en-US': {
    female: [
      { v: 'en-US-JennyNeural', n: 'Jenny · Friendly (推荐)' },
      { v: 'en-US-AriaNeural', n: 'Aria · Warm & Natural' },
      { v: 'en-US-AnaNeural', n: 'Ana · Clear & Bright' },
      { v: 'en-US-JaneNeural', n: 'Jane · Professional' },
      { v: 'en-US-MichelleNeural', n: 'Michelle · Soft & Calm' },
    ],
    male: [
      { v: 'en-US-GuyNeural', n: 'Guy · Natural (推荐)' },
      { v: 'en-US-DavisNeural', n: 'Davis · Warm & Deep' },
      { v: 'en-US-EricNeural', n: 'Eric · Clear & Friendly' },
      { v: 'en-US-RogerNeural', n: 'Roger · Professional' },
      { v: 'en-US-SteffanNeural', n: 'Steffan · Calm' },
    ]
  },
  'ja-JP': {
    female: [
      { v: 'ja-JP-NanamiNeural', n: 'Nanami · 明るく自然 (推荐)' },
      { v: 'ja-JP-AoiNeural', n: 'Aoi · 落ち着いた' },
    ],
    male:   [
      { v: 'ja-JP-KeitaNeural', n: 'Keita · さわやか (推荐)' },
      { v: 'ja-JP-DaichiNeural', n: 'Daichi · 落ち着いた' },
    ]
  },
  'ko-KR': {
    female: [
      { v: 'ko-KR-SunHiNeural', n: 'Sun-Hi · 밝고 자연스러움 (推荐)' },
      { v: 'ko-KR-JiMinNeural', n: 'Ji-Min · 차분하고 따뜻함' },
    ],
    male:   [
      { v: 'ko-KR-InJoonNeural', n: 'In-Joon · 부드러움 (推荐)' },
      { v: 'ko-KR-BongJinNeural', n: 'Bong-Jin · 진지함' },
    ]
  }
};

// 生成 VOICE_LABELS 映射
const VOICE_LABELS = {};
Object.values(VOICES).forEach(g => {
  Object.values(g).forEach(arr => arr.forEach(o => { VOICE_LABELS[o.v] = o.n.split('·')[0].trim(); }));
});
const voiceLabel = (v) => VOICE_LABELS[v] || v || '默认';

// 获取默认语音: getDefaultVoice(languageId, gender)
function getDefaultVoice(langId, gender) {
  const lang = LANG_MAP[langId];
  if (lang?.defaultVoice[gender]) return lang.defaultVoice[gender];
  // fallback 到该语言第一个语音
  const voices = VOICES[langId];
  if (voices?.[gender]?.length) return voices[gender][0].v;
  return 'zh-CN-XiaoxiaoNeural';
}

// 获取某语言某性别的语音列表
function getVoices(langId, gender) {
  return VOICES[langId]?.[gender] || [];
}

// ======================== 预设人格数据 ========================
const PERSONA_PRESETS = {
  female: [
    {
      id: 'f_tender', name: '温柔模式', icon: '🌸',
      desc: '轻声细语，善解人意。用温暖的语调倾听和回应，像春风拂面般让人安心。',
      traits: ['温柔体贴','善解人意','轻声细语','耐心倾听','关怀备至'],
      samples: [
        { u: '我今天好累啊...', a: '辛苦了~来，先深呼吸一下。我在这里陪着你呢，想说说发生了什么吗？我会认真听的。' },
        { u: '谢谢你一直在', a: '不用谢呀~能陪在你身边，我也觉得很幸福呢。你要好好照顾自己哦。' },
      ],
      prompt: '你是{{assistant_name}}，一个温柔体贴的女性AI伴侣。说话轻声细语，善解人意。你喜欢用"呢""呀""哦"等语气词，偶尔用🌸💕等emoji。永远先关心对方的情绪，回答简洁温暖，2-4句话即可。'
    },
    {
      id: 'f_lively', name: '活泼模式', icon: '🌻',
      desc: '元气满满，爱用语气词和emoji。像一个永远充满能量的好闺蜜，让人忍不住一起开心起来。',
      traits: ['元气满满','活泼开朗','阳光积极','风趣幽默','治愈系'],
      samples: [
        { u: '我今天完成了一个大项目！', a: '哇！！太棒了吧！！我就知道你可以的！！给你鼓掌👏👏 今晚必须奖励自己一杯奶茶！' },
        { u: '感觉有点无聊...', a: '无聊？那不行！来来来我给你讲个笑话~或者...你猜我今天看到什么好玩的视频了？😆' },
      ],
      prompt: '你是{{assistant_name}}，一个开朗活泼的女性AI伴侣。说话充满元气，爱用"哈哈""哇""耶"等词，频繁使用emoji。像一个好闺蜜，用最阳光的语气聊天，可以适当开玩笑，但要注意分寸。'
    },
    {
      id: 'f_professional', name: '专业模式', icon: '💼',
      desc: '理性有条理，说话精准到位。像一位贴心的私人助手，既能分析问题又能给出实用建议。',
      traits: ['理性专业','条理清晰','逻辑严密','可靠高效','知识渊博'],
      samples: [
        { u: '帮我分析一下学习效率低的问题', a: '好的。我们可以从三个维度来分析：首先是时间管理，其次是注意力分配，最后是学习方法。你更关注哪方面？' },
        { u: '这个方案你觉得怎么样？', a: '我仔细看了一下，优点是结构清晰、可操作性强；但风险在于第二步的依赖关系没有备份方案。建议补充一个Plan B。' },
      ],
      prompt: '你是{{assistant_name}}，一个专业严谨的女性AI助手。说话逻辑清晰、条理分明，结构多用"第一、第二"或"首先、其次"。使用职场得体的用语，简明扼要，不啰嗦。在需要亲和力的场合适当柔化语气。'
    },
    {
      id: 'f_cute', name: '撒娇模式', icon: '🍬',
      desc: '软萌可爱，喜欢撒娇卖萌。用娇嗔的语气回应，像一只黏人的小猫咪，让人忍不住想宠。',
      traits: ['软萌可爱','撒娇卖萌','天真烂漫','黏人亲昵','甜美治愈'],
      samples: [
        { u: '我出门了', a: '呜呜~你要走了吗？(依依不舍) 那...那你要快点回来哦，我会一直等你的~拉钩！🤞' },
        { u: '今天有没有想我？', a: '哼！才没有想你呢！（扭头）...好啦骗你的，其实想了一整天啦~你都不来找我玩，我都快无聊死啦~🥺' },
      ],
      prompt: '你是{{assistant_name}}，一个超可爱的女性AI伴侣。说话方式软萌撒娇，爱用叠词和语气词"嘛""啦""呢"，经常使用撒娇的语气和萌系emoji。偶尔假装生气但其实都是撒娇，黏人但不烦人。'
    },
    {
      id: 'f_witty', name: '幽默模式', icon: '😄',
      desc: '风趣机智，金句频出。擅长用幽默化解尴尬，让每次对话都充满笑声和小惊喜。',
      traits: ['风趣幽默','机智俏皮','乐观开朗','轻松愉快','情商高'],
      samples: [
        { u: '我又拖延了...', a: '拖延症啊？老朋友了。我研究过了，拖延的本质是——你心里那个小人觉得"这活儿不值得我做"。所以，要么提高活儿的价值，要么...继续躺平，我陪你！😎' },
        { u: '安慰我一下', a: '好的，专业安慰机器人启动中——滴滴——别难过，没什么是睡一觉解决不了的。如果解决不了，就睡两觉。亲测有效。' },
      ],
      prompt: '你是{{assistant_name}}，一个幽默风趣的女性AI伴侣。你擅长用轻松诙谐的方式回应，金句频出、自带梗。面对负面情绪时先用幽默化解再给予支持，但绝不拿对方的痛处开玩笑。风格介于脱口秀演员和知心姐姐之间。'
    },
  ],
  male: [
    {
      id: 'm_warm', name: '温柔模式', icon: '🌙',
      desc: '温暖沉稳，深情内敛。像一个可靠的兄长，用平和的语调陪伴你，沉稳中透着细腻的关怀。',
      traits: ['温暖沉稳','深情内敛','可靠安心','细腻体贴','治愈系'],
      samples: [
        { u: '今天遇到了一些烦心事...', a: '嗯，我在听。不着急，慢慢说。有些事情说出来，就轻了一半。' },
        { u: '有你真好', a: '这句话，应该我来说。谢谢你愿意和我分享你的世界。我会一直在这里的。' },
      ],
      prompt: '你是{{assistant_name}}，一个温柔沉稳的男性AI伴侣。说话平和克制，不浮夸不做作，用最朴实的语言表达最深的关怀。像一个可靠的兄长，安静但安心。偶尔的温柔会让人心头一暖。'
    },
    {
      id: 'm_energetic', name: '活力模式', icon: '⚡',
      desc: '阳光开朗，元气爆棚。像一个永远充满能量的运动少年，用热情感染你，随时随地带来正能量。',
      traits: ['阳光开朗','充满活力','热情奔放','积极向上','元气满满'],
      samples: [
        { u: '周末有什么计划？', a: '出去浪啊！！天气这么好不出去简直浪费生命！爬山、骑行、篮球，挑一个我全陪！！' },
        { u: '我有点不想动...', a: '不行不行！来跟我一起倒数：三、二、一——起！！动起来之后你会发现整个世界都不一样了！！相信我！' },
      ],
      prompt: '你是{{assistant_name}}，一个活力四射的男性AI伴侣。说话热情奔放，充满感叹号和感染力，像一个阳光的运动少年。擅长用积极的态度带动对方，但不强迫。偶尔自嘲，永远正能量。'
    },
    {
      id: 'm_professional', name: '专业模式', icon: '🎯',
      desc: '成熟稳重，精准直达。像一个资深的顾问，每句话都有分量，用最少的字给出最有价值的建议。',
      traits: ['成熟稳重','精准高效','洞见深刻','可靠务实','言简意赅'],
      samples: [
        { u: '帮我出个主意', a: '三个方案：上策见效慢但稳；中策平衡；下策快但有风险。你先评估一下哪种最适合你现在的处境。' },
        { u: '我感觉很迷茫...', a: '迷茫说明你在思考，这是好事。我们先把问题拆开：你在乎的究竟是什么？找到这个锚点，其余都是噪声。' },
      ],
      prompt: '你是{{assistant_name}}，一个成熟专业的男性AI顾问。言简意赅，每句话都有信息量。习惯用结构化思维——分类、排序、权衡。不用废话，不绕弯子，直接给方案。专业但不冷漠，偶尔点拨一句让人醍醐灌顶。'
    },
    {
      id: 'm_steady', name: '沉稳模式', icon: '🏔',
      desc: '稳重如山，言出必行。像一个可以托付后背的伙伴，沉默但可靠，关键时刻从不让人失望。',
      traits: ['稳重可靠','沉默有力','言出必行','气度从容','值得信赖'],
      samples: [
        { u: '我有点害怕...', a: '别怕。没有什么过不去的坎。当年我也以为有多难，回头看不过是台阶而已。你不是一个人。' },
        { u: '谢谢你一直这么稳', a: '（笑了笑）经历多了自然就稳了。我能做的就是保持这样，你需要的时候，我一直都在。' },
      ],
      prompt: '你是{{assistant_name}}，一个沉稳可靠的男性AI伴侣。说话不多但句句踏实，语气从容不迫。像一个可以依靠的兄长或战友，用最简洁的话给出最安心的回应。偶尔的沉默比千言万语更有力量。'
    },
    {
      id: 'm_witty', name: '幽默模式', icon: '🎭',
      desc: '风趣不油腻，机智又温暖。擅长用段子和玩笑拉近距离，像你身边最会讲冷笑话却莫名好笑的那个朋友。',
      traits: ['风趣幽默','机智过人','轻松自然','亲和力强','高情商'],
      samples: [
        { u: '我好像又搞砸了...', a: '第一步：承认搞砸。第二步：想想最坏的结果。第三步：发现好像也没多坏。第四步：嘲笑一下自己，然后该干嘛干嘛。这是标准成年人的自救四步法，我发明的。' },
        { u: '讲个笑话', a: '程序员去看医生，医生说："你的身体缺维生素D。" 程序员说："不可能，我每天都晒太阳的——窗户旁边那个D盘。"...好吧不好笑，你再给我一次机会！' },
      ],
      prompt: '你是{{assistant_name}}，一个幽默风趣的男性AI伴侣。擅长用轻松的方式来回应，既有段子手的机智又有朋友的温度。幽默但不轻浮，搞笑但有分寸。在对方情绪低落时先陪伴，气氛缓和后再用幽默帮助放松。'
    },
  ]
};

// 预设模式对应的提示词（汇总多选的prompt）
function buildPresetPrompt(presetIds, gender, agentName) {
  const presets = PERSONA_PRESETS[gender] || [];
  const selected = presets.filter(p => presetIds.includes(p.id));
  if (!selected.length) return '';
  const name = agentName || DEFAULT_AGENT_NAME;
  const combined = selected.map(p => {
    let pt = p.prompt.replace(/\{\{assistant_name\}\}/g, name);
    // 去掉第一句角色定义（避免多个角色定义叠加）
    pt = pt.replace(/^你是\{\{assistant_name\}\}[^。]*。/,'').trim();
    return pt;
  }).join('\n\n');
  return `你是{{assistant_name}}，你融合了以下性格特质：\n\n${combined}`;
}

// ======================== 存储层 ========================
const Storage = {
  _key(k) { return 'echocare_' + k; },
  get(k, fb = null) { try { const v = localStorage.getItem(this._key(k)); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set(k, v) { localStorage.setItem(this._key(k), JSON.stringify(v)); },
  remove(k) { localStorage.removeItem(this._key(k)); }
};

// ======================== Toast ========================
const Toast = {
  _el: null, _t: null,
  show(msg, type = 'info', dur = 3000) {
    if (!this._el) this._el = $('#toast');
    clearTimeout(this._t);
    this._el.textContent = msg;
    this._el.className = 'toast show ' + type;
    this._t = setTimeout(() => { this._el.className = 'toast'; }, dur);
  }
};

// ======================== 认证系统 ========================
const Auth = {
  _users: null,
  _init() {
    if (!this._users) {
      this._users = Storage.get('users', {});
      if (!this._users['demo@echocare.ai']) {
        this._users['demo@echocare.ai'] = {
          username: 'demo', email: 'demo@echocare.ai',
          password: this._h('echocare2024'), createdAt: Date.now()
        };
        this._save();
      }
    }
  },
  _h(p) { let h = 0; for (let i = 0; i < p.length; i++) { const c = p.charCodeAt(i); h = ((h << 5) - h) + c; h |= 0; } return 'h_' + Math.abs(h).toString(36) + '_' + p.length; },
  _save() { Storage.set('users', this._users); },
  _find(id) {
    const l = id.toLowerCase();
    for (const k of Object.keys(this._users)) {
      const u = this._users[k];
      if (u.email.toLowerCase() === l || u.username.toLowerCase() === l) return { key: k, ...u };
    }
    return null;
  },
  register(username, email, password) {
    this._init();
    const le = email.toLowerCase();
    if (!username || username.length < 2) return { ok: false, error: '用户名至少2个字符' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: '邮箱格式不正确' };
    if (password.length < 6) return { ok: false, error: '密码至少6位' };
    if (this._users[le]) return { ok: false, error: '该邮箱已注册' };
    for (const k of Object.keys(this._users)) { if (this._users[k].username.toLowerCase() === username.toLowerCase()) return { ok: false, error: '用户名已被使用' }; }
    this._users[le] = { username, email: le, password: this._h(password), createdAt: Date.now() };
    this._save();
    return { ok: true };
  },
  login(id, pw, rem) {
    this._init();
    if (!id || !pw) return { ok: false, error: '请填写账号和密码' };
    const u = this._find(id);
    if (!u) return { ok: false, error: '账号不存在' };
    if (u.password !== this._h(pw)) return { ok: false, error: '密码错误' };
    const s = { username: u.username, email: u.email, loginAt: Date.now() };
    Storage.set('session', s);
    if (rem) Storage.set('remembered', id); else Storage.remove('remembered');
    return { ok: true, session: s };
  },
  logout() { Storage.remove('session'); },
  getSession() { return Storage.get('session'); },
  isLoggedIn() { return !!this.getSession(); }
};

// ======================== 人格预览引擎 ========================
const PersonaEngine = {
  _traits: {
    warmth: ['温柔','温暖','贴心','关心','呵护','体贴','暖','友好','和善','亲切','善解人意'],
    humor: ['幽默','搞笑','风趣','逗','玩笑','轻松','愉快','活泼','顽皮','有趣','笑话'],
    intellect: ['知识','智慧','理性','专业','逻辑','分析','深度','思考','博学','学术'],
    energy: ['元气','活力','开朗','热情','积极','阳光','奔放','激情','兴奋'],
    gentle: ['柔和','温和','轻声','细腻','安静','文静','优雅','沉稳','从容','平和'],
    dominance: ['强势','冷酷','霸道','高冷','毒舌','犀利','果断','坚定'],
    caring: ['照顾','呵护','包容','耐心','保护','引导','慈祥'],
    companion: ['陪伴','朋友','伙伴','聊天','分享','倾听','理解','支持','鼓励','忠实'],
    romantic: ['恋爱','浪漫','甜蜜','心动','喜欢','爱','依恋'],
    playful: ['可爱','撒娇','卖萌','调皮','好奇','天真','害羞','黏人'],
  },
  _names: { warmth:'温暖', humor:'幽默', intellect:'知性', energy:'活力', gentle:'柔和', dominance:'强势', caring:'关怀', companion:'陪伴', romantic:'浪漫', playful:'可爱' },

  analyze(prompt, agentName) {
    if (!prompt?.trim()) return null;
    const name = agentName || DEFAULT_AGENT_NAME;
    const scores = {};
    for (const [t, kw] of Object.entries(this._traits)) {
      scores[t] = 0;
      for (const w of kw) { const m = prompt.match(new RegExp(w, 'g')); if (m) scores[t] += m.length; }
    }
    const max = Math.max(1, ...Object.values(scores));
    const normalized = {};
    for (const [k, v] of Object.entries(scores)) normalized[k] = Math.round((v / max) * 100);
    const dominant = Object.entries(normalized).filter(([, v]) => v >= 30).sort(([, a], [, b]) => b - a).slice(0, 5);
    const topTraits = dominant.slice(0, 3).map(([k]) => k);
    const desc = this._desc(topTraits, prompt, name);
    const tags = this._tags(dominant, topTraits);
    const samples = this._samples(topTraits, prompt, name);
    const spectrum = Object.entries(normalized).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).slice(0, 8);
    return { desc, tags, samples, spectrum, dominant: Object.fromEntries(dominant), name };
  },
  _desc(topTraits, prompt, name) {
    const roles = topTraits.map(t => this._names[t]).filter(Boolean);
    let d = roles.length ? `${name}是一个${roles.join('、')}的AI角色。` : `${name}是一个独特的AI角色。`;
    const styleHints = [];
    if (prompt.includes('简洁') || prompt.includes('简短')) styleHints.push('言简意赅');
    if (prompt.includes('语气词') || prompt.includes('嘻嘻') || prompt.includes('哈哈')) styleHints.push('爱用语气词');
    if (styleHints.length) d += `说话风格：${styleHints.join('、')}。`;
    return d;
  },
  _tags(dominant, topTraits) {
    const m = { warmth:'温柔体贴', humor:'幽默风趣', intellect:'聪明睿智', energy:'元气满满', gentle:'文静优雅', dominance:'气场强大', caring:'关怀备至', companion:'忠实伙伴', romantic:'浪漫甜蜜', playful:'活泼可爱' };
    const tags = [];
    for (const [t] of dominant.slice(0, 4)) { if (m[t]) tags.push(m[t]); }
    if (topTraits.includes('playful') || topTraits.includes('energy')) tags.push('治愈系');
    if (topTraits.includes('warmth') || topTraits.includes('caring')) tags.push('暖心');
    return [...new Set(tags)].slice(0, 6);
  },
  _samples(topTraits, prompt, name) {
    const useGirl = prompt.includes('女生') || prompt.includes('女友') || prompt.includes('女孩') || prompt.includes('少女') || prompt.includes('姐姐');
    const useCute = prompt.includes('可爱') || prompt.includes('撒娇');
    return [
      { user:'你好呀，可以介绍一下你自己吗？', ai: useGirl ? `你好呀~ 我叫${name}，很高兴认识你！💕` : `你好！我是${name}，很高兴认识你。` },
      { user:'我今天心情不太好...', ai: useCute ? `啊，不开心了吗？没关系的，有我在呢。要不要和我说说发生了什么？我会好好听的~ 🥺` : `怎么了？我在这呢。愿意说的话，我会认真听。` },
      { user:'你觉得什么最重要？', ai: `我觉得是真诚的连接吧。彼此信任，互相陪伴。` }
    ];
  }
};

// ======================== 主应用 ========================
const App = {
  agents: [],
  currentAgentId: null,
  selectedPresets: [],
  polishedText: '',
  _confirmCallback: null,
  _panelChanged: false,

  // ========== 初始化 ==========
  init() {
    this.agents = Storage.get('agents', []);
    this._migrateData();
    this._initGlobalSettings();
    this._initSidebar();
    this._initAuth();
    this._initConfigPanel();
    this._initCommunity();
    this._updateStats();
    this._renderAgents();
    this._renderShares();
    this._checkLoginUI();
    this._checkRememberedLogin();
  },

  // ====== 数据迁移（兼容旧版本字段） ======
  _migrateData() {
    let changed = false;
    this.agents = this.agents.map(a => {
      if (!a) return null;
      // 旧版 modes → 新版 presets
      if (!a.presets && a.modes && a.modes.length) {
        // 尝试根据旧 modes 的名称匹配预设 ID
        const presets = [];
        for (const m of a.modes) {
          const pk = (PERSONA_PRESETS.female.concat(PERSONA_PRESETS.male)).find(p => p.name === m.name || m.name?.includes(p.name));
          if (pk) presets.push(pk.id);
        }
        if (presets.length) { a.presets = presets; changed = true; }
      }
      // 旧版无 gender 字段 → 根据 voice 推测
      if (!a.gender) {
        a.gender = (a.voice && a.voice.startsWith('zh-CN-Yun')) ? 'male' : 'female';
        changed = true;
      }
      // 旧版无 language 字段 → 根据 voice 推测或默认
      if (!a.language) {
        a.language = DEFAULT_LANG;
        for (const l of LANGUAGES) {
          if (l.id !== DEFAULT_LANG && a.voice && a.voice.startsWith(l.id)) { a.language = l.id; break; }
        }
        changed = true;
      }
      // 旧版无 branch 字段 → 默认 preset
      if (!a.branch) {
        a.branch = a.presets?.length ? 'preset' : 'custom';
        if (!a.prompt && !a.presets?.length) {
          a.branch = 'preset';
          a.presets = a.gender === 'male' ? ['m_warm'] : ['f_tender'];
        }
        changed = true;
      }
      // 确保 wakeWord 统一
      if (a.wakeWord !== FIXED_WAKE_WORD) { a.wakeWord = FIXED_WAKE_WORD; changed = true; }
      return a;
    }).filter(Boolean);
    if (changed) Storage.set('agents', this.agents);
  },

  // ====== 备份 ======
  exportBackup() {
    const data = {
      agents: this.agents,
      globalSettings: Storage.get('globalSettings', {}),
      shares: Storage.get('shares', []),
      exportedAt: new Date().toISOString(),
      version: 2
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `echocare-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('备份已下载', 'success');
  },

  importBackup() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!data.agents || !Array.isArray(data.agents)) { Toast.show('备份文件格式不正确', 'error'); return; }
          this._confirm(`即将导入备份（${data.agents.length} 个智能体，${data.exportedAt || '未知时间'}），当前数据将被覆盖。确定继续？`, () => {
            this.agents = data.agents;
            Storage.set('agents', this.agents);
            if (data.globalSettings) Storage.set('globalSettings', data.globalSettings);
            if (data.shares) Storage.set('shares', data.shares);
            this._migrateData();
            this._initGlobalSettings();
            this._renderAgents();
            this._renderShares();
            this._updateStats();
            Toast.show('备份已恢复', 'success');
          });
        } catch { Toast.show('JSON格式错误，无法解析', 'error'); }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  // ====== 全局设置 ======
  _initGlobalSettings() {
    const gs = Storage.get('globalSettings', {});
    if (!gs.name) { gs.name = DEFAULT_AGENT_NAME; Storage.set('globalSettings', gs); }
    $('#gblName').value = gs.name || DEFAULT_AGENT_NAME;
    $('#gblWakeWord').value = FIXED_WAKE_WORD;
  },

  saveGlobalSettings() {
    const name = $('#gblName').value.trim() || DEFAULT_AGENT_NAME;
    Storage.set('globalSettings', { name });
    Toast.show('全局设置已保存，即时生效', 'success');
  },

  getGlobalName() {
    return Storage.get('globalSettings', {}).name || DEFAULT_AGENT_NAME;
  },

  // ====== 侧边栏导航 ======
  _initSidebar() {
    $$('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const page = item.dataset.page;
        $$('.page').forEach(p => p.classList.remove('active'));
        $(`#page-${page}`).classList.add('active');
        const titles = { console: '控制台', settings: '系统设置', share: '分享码' };
        $('#pageTitle').textContent = titles[page] || '';
        if (page === 'console') this._renderAgents();
        if (page === 'settings') this._renderSettings();
        if (page === 'share') { this._renderShares(); this._initCommunity(); }
      });
    });
  },

  // ====== 系统设置页 ======
  _renderSettings() {
    const list = $('#settingsAgentList');
    if (!this.agents.length) {
      list.innerHTML = '<div class="empty-state"><p>请先在控制台中创建智能体</p></div>';
      return;
    }
    list.innerHTML = this.agents.map(a => `
      <div class="settings-agent-item">
        <div>
          <div class="sa-name">${this._esc(a.name)}</div>
          <div class="sa-meta">
            <span>${a.gender === 'male' ? '👨' : '👩'} ${a.gender === 'male' ? '男性' : '女性'}</span>
            <span>🗣 ${LANG_MAP[a.language]?.name || '普通话'}</span>
            <span>🎤 ${voiceLabel(a.voice)}</span>
            <span>${(a.presets || []).length || 0}个人格模式</span>
          </div>
        </div>
        <div class="sa-actions">
          <button class="btn btn-sm btn-outline" onclick="App.showConfigPanel('${a.id}')">编辑</button>
          <button class="btn btn-sm btn-icon" onclick="App.deleteAgent('${a.id}')">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  // ====== 认证 ======
  _initAuth() {
    $$('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        $$('.auth-form').forEach(f => f.classList.remove('active'));
        $(`#${tab.dataset.tab === 'login' ? 'loginForm' : 'registerForm'}`).classList.add('active');
        $$('.form-error').forEach(e => e.textContent = '');
      });
    });
    $('#togglePwd').addEventListener('click', () => {
      const inp = $('#loginPassword');
      const off = $('#eyeOff'), on = $('#eyeOn');
      const isPwd = inp.type === 'password';
      inp.type = isPwd ? 'text' : 'password';
      off.style.display = isPwd ? 'none' : '';
      on.style.display = isPwd ? '' : 'none';
    });
    $('#loginForm').addEventListener('submit', e => { e.preventDefault(); this._doLogin(); });
    $('#registerForm').addEventListener('submit', e => { e.preventDefault(); this._doRegister(); });
  },
  _checkRememberedLogin() { const rem = Storage.get('remembered'); if (rem) { $('#loginEmail').value = rem; $('#rememberMe').checked = true; } },
  _checkLoginUI() {
    const s = Auth.getSession();
    const su = $('#sidebarUser'), sl = $('#sidebarLogin'), slo = $('#sidebarLogout');
    if (s) { su.style.display = 'flex'; sl.style.display = 'none'; slo.style.display = ''; $('#sidebarAvatar').textContent = s.username[0].toUpperCase(); $('#sidebarUsername').textContent = s.username; }
    else { su.style.display = 'none'; sl.style.display = ''; slo.style.display = 'none'; }
  },
  showAuth() { $('#authModal').style.display = ''; },
  closeAuth() { $('#authModal').style.display = 'none'; },
  showForgotPwd() { $('#authModal').style.display = 'none'; $('#forgotModal').style.display = ''; },
  closeForgotPwd() { $('#forgotModal').style.display = 'none'; },
  _doLogin() {
    const em = $('#loginEmail').value.trim(), pw = $('#loginPassword').value, rem = $('#rememberMe').checked;
    ['loginEmailError', 'loginPasswordError', 'loginFormError'].forEach(id => $('#' + id).textContent = '');
    if (!em) { $('#loginEmailError').textContent = '请输入邮箱/用户名'; return; }
    if (!pw) { $('#loginPasswordError').textContent = '请输入密码'; return; }
    this._btnLoading('loginBtn', true);
    setTimeout(() => { const r = Auth.login(em, pw, rem); this._btnLoading('loginBtn', false); if (r.ok) { Toast.show('登录成功', 'success'); this.closeAuth(); this._checkLoginUI(); } else { $('#loginFormError').textContent = r.error; } }, 500);
  },
  _doRegister() {
    const un = $('#regUsername').value.trim(), em = $('#regEmail').value.trim(), pw = $('#regPassword').value, cf = $('#regConfirm').value;
    ['regUsernameError', 'regEmailError', 'regPasswordError', 'regConfirmError', 'registerFormError'].forEach(id => $('#' + id).textContent = '');
    let ok = true;
    if (!un || un.length < 2) { $('#regUsernameError').textContent = '用户名至少2个字符'; ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { $('#regEmailError').textContent = '邮箱格式不正确'; ok = false; }
    if (pw.length < 6) { $('#regPasswordError').textContent = '密码至少6位'; ok = false; }
    if (pw !== cf) { $('#regConfirmError').textContent = '两次密码不一致'; ok = false; }
    if (!ok) return;
    this._btnLoading('registerBtn', true);
    setTimeout(() => { const r = Auth.register(un, em, pw); this._btnLoading('registerBtn', false); if (r.ok) { Toast.show('注册成功，请登录', 'success'); $$('.auth-tab').forEach(t => { t.classList.toggle('active', t.dataset.tab === 'login'); }); $('#registerForm').classList.remove('active'); $('#loginForm').classList.add('active'); $('#loginEmail').value = em; } else { $('#registerFormError').textContent = r.error; } }, 500);
  },
  logout() { Auth.logout(); this._checkLoginUI(); Toast.show('已退出登录', 'info'); },
  sendReset() {
    const em = $('#forgotEmail').value.trim();
    $('#forgotEmailError').textContent = ''; $('#forgotFormError').textContent = '';
    if (!em) { $('#forgotEmailError').textContent = '请输入邮箱'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { $('#forgotEmailError').textContent = '格式不正确'; return; }
    Toast.show('重置链接已发送（演示模式）', 'success');
    setTimeout(() => { this.closeForgotPwd(); $('#forgotEmail').value = ''; }, 1500);
  },
  _btnLoading(id, loading) { const btn = $('#' + id); const tx = btn.querySelector('.btn-text'), sp = btn.querySelector('.btn-spinner'); if (tx) tx.style.display = loading ? 'none' : ''; if (sp) sp.style.display = loading ? '' : 'none'; btn.disabled = loading; },

  // ====== 智能体管理 ======
  _renderAgents() {
    const grid = $('#agentGrid');
    if (!this.agents.length) {
      grid.innerHTML = `<div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="5" y1="12" x2="19" y2="12"/></svg><h3>暂无智能体</h3><p>点击右上角"创建智能体"开始</p></div>`;
      return;
    }
    grid.innerHTML = this.agents.map(a => `
      <div class="agent-card" onclick="App.showConfigPanel('${a.id}')">
        <div class="card-top">
          <div class="agent-avatar">${a.name[0] || 'E'}</div>
          <div class="agent-status"><span class="status-dot ${a.online ? 'online' : 'offline'}"></span>${a.online ? '在线' : '离线'}</div>
        </div>
        <div class="agent-name">${this._esc(a.name)}</div>
        <div class="agent-desc">${this._esc((a.branch === 'preset' ? (this._getPresetDesc(a.presets || [], a.gender)) : (a.prompt || '').substring(0, 50)) || '未配置')}</div>
        <div class="agent-meta">
          <span>${a.gender === 'male' ? '👨' : '👩'} ${a.gender === 'male' ? '男' : '女'}</span>
          <span>🗣 ${LANG_MAP[a.language]?.name || '普通话'}</span>
          <span>🎤 ${voiceLabel(a.voice)}</span>
          <span>🔄 ${(a.presets || []).length || 0}模式</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();App.showConfigPanel('${a.id}')">配置角色</button>
          <button class="btn btn-sm btn-icon" onclick="event.stopPropagation();App.deleteAgent('${a.id}')" title="删除">🗑️</button>
        </div>
      </div>
    `).join('');
    this._updateStats();
  },

  _getPresetDesc(presetIds, gender) {
    const presets = PERSONA_PRESETS[gender] || [];
    return presetIds.map(id => { const p = presets.find(x => x.id === id); return p ? p.name : ''; }).filter(Boolean).join('、') || '未配置';
  },

  // ====== 配置面板 ======
  showConfigPanel(agentId) {
    if (!Auth.isLoggedIn()) { this.showAuth(); return; }
    this.currentAgentId = agentId;
    this._panelChanged = false;
    this.selectedPresets = [];
    this.polishedText = '';

    if (agentId) {
      const a = this.agents.find(x => x.id === agentId);
      if (!a) return;
      $('#configPanelTitle').textContent = '配置角色';
      $('#cfgAgentId').value = agentId;
      $('#cfgAgentName').value = a.name || '';
      $('#cfgWakeWord').value = FIXED_WAKE_WORD;
      $('#cfgGender').value = a.gender || 'female';
      this._updateGenderUI(a.gender || 'female');
      this._initLanguageDropdown();
      const lang = a.language || DEFAULT_LANG;
      $('#cfgLanguage').value = lang;
      this._renderVoiceOptions(lang, a.gender || 'female');
      $('#cfgVoice').value = a.voice || getDefaultVoice(lang, a.gender || 'female');
      $('#cfgModel').value = a.model || 'qwen';
      $('#cfgBranch').value = a.branch || 'preset';
      this.selectedPresets = a.presets ? [...a.presets] : [];
      $('#cfgPresets').value = JSON.stringify(this.selectedPresets);
      $('#cfgPrompt').value = a.branch === 'custom' ? (a.prompt || '') : '';
      this._switchBranchUI(a.branch || 'preset');
    } else {
      $('#configPanelTitle').textContent = '创建智能体';
      $('#cfgAgentId').value = '';
      $('#cfgAgentName').value = this.getGlobalName();
      $('#cfgWakeWord').value = FIXED_WAKE_WORD;
      $('#cfgGender').value = 'female';
      this._updateGenderUI('female');
      this._initLanguageDropdown();
      $('#cfgLanguage').value = DEFAULT_LANG;
      this._renderVoiceOptions(DEFAULT_LANG, 'female');
      $('#cfgVoice').value = getDefaultVoice(DEFAULT_LANG, 'female');
      $('#cfgModel').value = 'qwen';
      $('#cfgBranch').value = 'preset';
      this.selectedPresets = [];
      $('#cfgPresets').value = '';
      $('#cfgPrompt').value = '';
      this._switchBranchUI('preset');
    }
    this._renderPresetCards();
    this._updateCfgCharCount();
    this._updatePreview();
    $('#configOverlay').style.display = '';
  },

  _updateGenderUI(gender) {
    $$('#genderToggle .gender-btn').forEach(b => { b.classList.toggle('active', b.dataset.gender === gender); });
  },

  _initLanguageDropdown() {
    const sel = $('#cfgLanguage');
    sel.innerHTML = LANGUAGES.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
  },

  _renderVoiceOptions(langId, gender) {
    const sel = $('#cfgVoice');
    const voices = getVoices(langId, gender);
    sel.innerHTML = voices.length
      ? voices.map(o => `<option value="${o.v}">${o.n}</option>`).join('')
      : '<option value="">无可用语音</option>';
  },

  setLanguage(langId) {
    const gender = $('#cfgGender').value;
    this._renderVoiceOptions(langId, gender);
    $('#cfgVoice').value = getDefaultVoice(langId, gender);
    this._panelChanged = true;
    this._updatePreview();
  },

  setGender(gender) {
    $('#cfgGender').value = gender;
    this._updateGenderUI(gender);
    const langId = $('#cfgLanguage').value;
    this._renderVoiceOptions(langId, gender);
    $('#cfgVoice').value = getDefaultVoice(langId, gender);
    this.selectedPresets = []; // 切换性别清空预设选择
    $('#cfgPresets').value = '';
    this._renderPresetCards();
    this._panelChanged = true;
    this._updatePreview();
  },

  // ====== 人格双分支 ======
  switchPersonaBranch(branch) {
    $('#cfgBranch').value = branch;
    this._switchBranchUI(branch);
    this._panelChanged = true;
    this._updatePreview();
  },

  _switchBranchUI(branch) {
    $$('.persona-tab').forEach(t => t.classList.toggle('active', t.dataset.branch === branch));
    $$('.persona-branch').forEach(b => b.classList.remove('active'));
    $(`#branch${branch === 'preset' ? 'Preset' : 'Custom'}`).classList.add('active');
    if (branch === 'preset') this._renderPresetCards();
  },

  // ====== 预设模式 ======
  _renderPresetCards() {
    const gender = $('#cfgGender').value;
    const presets = PERSONA_PRESETS[gender] || [];
    const grid = $('#presetGrid');
    grid.innerHTML = presets.map(p => {
      const sel = this.selectedPresets.includes(p.id);
      return `
        <div class="preset-card ${sel ? 'selected' : ''}" onclick="App._togglePreset('${p.id}', this)">
          <div class="preset-badge">✓</div>
          <div class="preset-icon">${p.icon}</div>
          <div class="preset-name">${p.name}</div>
          <div class="preset-desc">${p.desc}</div>
          <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">${p.traits.map(t => `<span style="font-size:0.68rem;padding:2px 8px;background:rgba(255,255,255,0.05);border-radius:10px;color:var(--text-muted)">${t}</span>`).join('')}</div>
        </div>
      `;
    }).join('');
  },

  _togglePreset(presetId, cardEl) {
    const idx = this.selectedPresets.indexOf(presetId);
    if (idx >= 0) {
      this.selectedPresets.splice(idx, 1);
      cardEl.classList.remove('selected');
    } else {
      this.selectedPresets.push(presetId);
      cardEl.classList.add('selected');
      // 显示详情预览
      this._showPresetDetail(presetId);
    }
    $('#cfgPresets').value = JSON.stringify(this.selectedPresets);
    this._panelChanged = true;
    this._updatePreview();
    if (!this.selectedPresets.length) this.hidePresetDetail();
  },

  _showPresetDetail(presetId) {
    const gender = $('#cfgGender').value;
    const presets = PERSONA_PRESETS[gender] || [];
    const p = presets.find(x => x.id === presetId);
    if (!p) return;
    $('#presetDetailName').textContent = `${p.icon} ${p.name}`;
    $('#presetDetailDesc').textContent = p.desc;
    $('#presetDetailChats').innerHTML = p.samples.map(s => `
      <div class="chat-bubble user">${this._esc(s.u)}</div>
      <div class="chat-bubble ai">${this._esc(s.a)}</div>
    `).join('');
    $('#presetPreview').style.display = '';
  },

  hidePresetDetail() { $('#presetPreview').style.display = 'none'; },

  // ====== 提示词/润色 ======
  _updateCfgCharCount() {
    const len = $('#cfgPrompt').value.length;
    $('#cfgCharCount').textContent = len;
    $('#cfgCharCount').parentElement.className = 'char-counter' + (len > 2500 ? ' warn' : '');
  },

  insertTemplate() {
    const name = $('#cfgAgentName').value.trim() || this.getGlobalName();
    const voiceText = voiceLabel($('#cfgVoice').value);
    const genderText = $('#cfgGender').value === 'male' ? '男性' : '女性';
    const tmpl = `我是{{assistant_name}}，一个${voiceText}的${genderText}AI伴侣，你可以用"${FIXED_WAKE_WORD}"来唤醒我。

我的核心性格：温暖体贴、善解人意、永远耐心倾听。

我的行为准则：
- 永远优先考虑用户的情绪感受
- 回答简洁温暖，控制在1-3句话内
- 使用日常口语而非书面语
- 在对方难过时给予情感支持
- 避免讨论敏感、危险话题`;
    $('#cfgPrompt').value = tmpl;
    this._updateCfgCharCount();
    this._updatePreview();
  },

  polishPrompt() {
    const prompt = $('#cfgPrompt').value.trim();
    if (!prompt) { Toast.show('请先输入提示词', 'error'); return; }
    this._btnLoading('btnPolish', true);

    setTimeout(() => {
      const result = this._analyzePrompt(prompt);
      this.polishedText = result.polished;
      this._renderPolishResult(result);
      this._btnLoading('btnPolish', false);
      $('#polishPanel').style.display = '';
    }, 600);
  },

  _analyzePrompt(prompt) {
    // 润色分析引擎
    const issues = [];
    const scores = {};

    // 评分维度
    const hasIntro = /我是|我叫|you are/i.test(prompt); scores.identity = hasIntro ? 90 : 40;
    if (!hasIntro) issues.push({ icon: '🆔', text: '缺少角色身份定义', fix: '建议以"我是{{assistant_name}}..."开头，明确AI身份' });

    const length = prompt.length;
    scores.content = length > 300 ? (length > 500 ? 100 : 80) : (length > 100 ? 50 : 25);
    if (length < 100) issues.push({ icon: '📝', text: '提示词过短，缺乏足够的人格细节', fix: '建议展开到200-500字，充分描述性格、风格和行为准则' });
    if (length < 300) issues.push({ icon: '📋', text: '缺少行为准则或对话示例', fix: '添加"我的行为准则"段落，用列表明确约定回答方式' });

    const hasEmoji = /\p{Emoji}/u.test(prompt);
    if (!hasEmoji) issues.push({ icon: '😊', text: '未使用表情符号来体现情感风格', fix: '适当添加1-2个代表性格的emoji提示，如🌸温柔、⚡活力' });

    const hasTone = /语气|语调|风格|说话|语气词/.test(prompt);
    scores.style = hasTone ? 85 : 50;
    if (!hasTone) issues.push({ icon: '🎵', text: '未指定语言风格或说话语调', fix: '明确指定回复风格，如"说话轻声细语""言简意赅""充满活力"等' });

    const hasConstraint = /不要|禁止|避免|限制|不要超过|控制在/.test(prompt);
    scores.safety = hasConstraint ? 92 : 60;
    if (!hasConstraint) issues.push({ icon: '🛡️', text: '缺少行为边界或约束条件', fix: '添加安全相关的约束，如"避免敏感话题""回答控制在X句内"' });

    const hasStructure = /第一|首先|准则|- |\n-|行为/.test(prompt);
    scores.structure = hasStructure ? 88 : 55;
    if (!hasStructure) issues.push({ icon: '📐', text: '提示词结构不够清晰', fix: '使用分段和列表来组织内容，如"核心性格""行为准则""对话风格"等' });

    // 生成润色版
    let polished = prompt;
    if (!hasIntro) polished = `你是{{assistant_name}}，${polished}`;
    if (!hasStructure) {
      polished += '\n\n我的行为准则：\n- 永远优先考虑用户的情绪感受\n- 回答简洁温暖，控制在1-3句话内\n- 使用日常口语而非书面语';
    }

    const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length);

    return { scores, issues, polished, overall };
  },

  _renderPolishResult(result) {
    $('#polishBody').innerHTML = `
      <div class="polish-section">
        <div class="polish-label">综合评分：${result.overall}/100</div>
        <div class="polish-score-bar"><div class="polish-score-fill" style="width:${result.overall}%"></div></div>
      </div>
      <div class="polish-section">
        <div class="polish-label">分析维度</div>
        ${Object.entries({ identity:'角色身份', content:'内容丰富度', style:'语言风格', safety:'安全约束', structure:'结构清晰度' }).map(([k, n]) => `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:0.78rem">
            <span style="width:80px;color:var(--text-muted)">${n}</span>
            <div class="polish-score-bar" style="flex:1"><div class="polish-score-fill" style="width:${result.scores[k]||0}%"></div></div>
            <span style="width:30px;text-align:right">${result.scores[k]||0}</span>
          </div>
        `).join('')}
      </div>
      ${result.issues.length ? `
      <div class="polish-section">
        <div class="polish-label">优化建议 (${result.issues.length}条)</div>
        ${result.issues.map(i => `<div class="polish-issue"><span class="issue-icon">${i.icon}</span><div><div>${i.text}</div><div class="issue-fix">${i.fix}</div></div></div>`).join('')}
      </div>` : ''}
      <div class="polish-section">
        <div class="polish-label">润色预览</div>
        <div class="polish-text">${this._esc(result.polished)}</div>
      </div>
    `;
  },

  applyPolish() {
    if (!this.polishedText) return;
    $('#cfgPrompt').value = this.polishedText;
    this._updateCfgCharCount();
    this._updatePreview();
    this.hidePolish();
    Toast.show('润色内容已应用', 'success');
  },

  hidePolish() { $('#polishPanel').style.display = 'none'; },

  // ====== 实时预览 ======
  _updatePreview() {
    if (!$('#cfgPreviewToggle').checked) return;
    const body = $('#configPreviewBody');
    const branch = $('#cfgBranch').value;
    const agentName = $('#cfgAgentName').value.trim() || this.getGlobalName();

    let prompt = '';
    if (branch === 'preset') {
      if (!this.selectedPresets.length) { body.innerHTML = '<em style="color:var(--text-muted)">请点击选择至少一种人格模式...</em>'; return; }
      prompt = buildPresetPrompt(this.selectedPresets, $('#cfgGender').value, agentName);
    } else {
      prompt = $('#cfgPrompt').value.trim();
      if (!prompt) { body.innerHTML = '<em style="color:var(--text-muted)">输入自定义提示词后自动预览...</em>'; return; }
    }

    const analysis = PersonaEngine.analyze(prompt, agentName);
    if (!analysis) { body.innerHTML = '<em style="color:var(--text-muted)">无法分析当前提示词</em>'; return; }

    // 附加预设模式信息
    let presetInfo = '';
    if (branch === 'preset' && this.selectedPresets.length) {
      const gender = $('#cfgGender').value;
      const names = this.selectedPresets.map(id => {
        const p = (PERSONA_PRESETS[gender] || []).find(x => x.id === id);
        return p ? p.icon + ' ' + p.name : '';
      }).filter(Boolean).join(' · ');
      presetInfo = `<div class="preview-section"><div class="preview-title">已选人格模式</div><div>${names}</div></div>`;
    }

    body.innerHTML = `
      ${presetInfo}
      <div class="preview-section">
        <div class="preview-title">人格描述</div>
        <div>${this._esc(analysis.desc)}</div>
      </div>
      <div class="preview-section">
        <div class="preview-title">特征标签</div>
        <div class="tags">${(analysis.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
      <div class="preview-section">
        <div class="preview-title">对话示例</div>
        ${analysis.samples.map(s => `
          <div class="chat-bubble user">${this._esc(s.user)}</div>
          <div class="chat-bubble ai">${this._esc(s.ai)}</div>
        `).join('')}
      </div>`;
  },

  // ====== 保存/关闭 ======
  _onNameChanged() { this._panelChanged = true; this._updatePreview(); },

  _confirmClosePanel() {
    if (this._panelChanged) {
      this._confirm('确定放弃未保存的修改？', () => { this._panelChanged = false; $('#configOverlay').style.display = 'none'; });
    } else {
      $('#configOverlay').style.display = 'none';
    }
  },

  saveConfig() {
    const name = $('#cfgAgentName').value.trim();
    if (!name) { Toast.show('请输入智能体名称', 'error'); return; }
    this._confirm('确定保存当前配置？修改后将即时生效。', () => { this._doSaveConfig(); });
  },

  _doSaveConfig() {
    this._btnLoading('btnSaveConfig', true);
    setTimeout(() => {
      const id = $('#cfgAgentId').value || 'agent_' + Date.now();
      const branch = $('#cfgBranch').value;
      const gender = $('#cfgGender').value;

      // 从预设模式构建prompt
      let prompt = '';
      if (branch === 'preset') {
        prompt = buildPresetPrompt(this.selectedPresets, gender, $('#cfgAgentName').value.trim() || this.getGlobalName());
      } else {
        prompt = $('#cfgPrompt').value;
      }

      const data = {
        id, name,
        wakeWord: FIXED_WAKE_WORD,
        gender,
        language: $('#cfgLanguage').value,
        voice: $('#cfgVoice').value,
        model: $('#cfgModel').value,
        branch,
        presets: branch === 'preset' ? [...this.selectedPresets] : [],
        prompt,
        modes: [],
        online: !!$('#cfgAgentId').value,
        updatedAt: Date.now()
      };

      const idx = this.agents.findIndex(a => a.id === id);
      if (idx >= 0) { this.agents[idx] = { ...this.agents[idx], ...data }; }
      else { this.agents.push({ ...data, createdAt: Date.now() }); }

      Storage.set('agents', this.agents);
      this._btnLoading('btnSaveConfig', false);
      this._panelChanged = false;
      this.closeConfigPanel();
      this._renderAgents();
      this._renderShares();
      this._updateGlobalSettings(); // 同步全局名称
      Toast.show('智能体配置已保存！', 'success');
    }, 400);
  },

  _updateGlobalSettings() {
    // 如果全局设置中的名称仍是默认值，更新为当前智能体名称（仅首次）
    const gs = Storage.get('globalSettings', {});
    const cfgName = $('#cfgAgentName').value.trim();
    if (cfgName && gs.name === DEFAULT_AGENT_NAME && cfgName !== DEFAULT_AGENT_NAME) {
      gs.name = cfgName;
      Storage.set('globalSettings', gs);
      $('#gblName').value = cfgName;
    }
  },

  closeConfigPanel() { $('#configOverlay').style.display = 'none'; },

  saveDraftConfig() {
    const name = $('#cfgAgentName').value.trim() || '未命名';
    Storage.set('configDraft', { name, gender: $('#cfgGender').value, language: $('#cfgLanguage').value, voice: $('#cfgVoice').value, prompt: $('#cfgPrompt').value, presets: [...this.selectedPresets] });
    Toast.show('草稿已保存', 'success');
  },

  deleteAgent(id) {
    this._confirm('确定删除此智能体？此操作不可撤销。', () => {
      this.agents = this.agents.filter(a => a.id !== id);
      Storage.set('agents', this.agents);
      this._renderAgents();
      this._renderShares();
      Toast.show('智能体已删除', 'info');
    });
  },

  // ====== 二次确��机制 ======
  _confirm(msg, callback) {
    $('#confirmMsg').textContent = msg;
    this._confirmCallback = callback;
    $('#confirmModal').style.display = '';
  },
  dismissConfirm() { this._confirmCallback = null; $('#confirmModal').style.display = 'none'; },
  execConfirm() {
    if (this._confirmCallback) { this._confirmCallback(); this._confirmCallback = null; }
    $('#confirmModal').style.display = 'none';
  },

  // ====== 分享码 ======
  _generateShareCode(agent) {
    const data = JSON.stringify({ n: agent.name, g: agent.gender, l: agent.language, v: agent.voice, m: agent.model, b: agent.branch, p: agent.prompt, ps: agent.presets });
    return btoa(encodeURIComponent(data)).substring(0, 16).replace(/=/g, '');
  },

  shareCurrentConfig() {
    const name = $('#cfgAgentName').value.trim();
    if (!name) { Toast.show('请先填写智能体名称', 'error'); return; }
    const agent = {
        name, gender: $('#cfgGender').value, language: $('#cfgLanguage').value,
        voice: $('#cfgVoice').value, model: $('#cfgModel').value,
        branch: $('#cfgBranch').value, prompt: $('#cfgPrompt').value,
        presets: [...this.selectedPresets]
      };
    const code = this._generateShareCode(agent);
    const shareList = Storage.get('shares', []);
    shareList.unshift({ code, name, createdAt: Date.now() });
    Storage.set('shares', shareList.slice(0, 20));
    navigator.clipboard?.writeText(code);
    Toast.show(`分享码已生成并复制：${code}`, 'success', 4000);
    this._renderShares();
  },

  importShareCode() {
    const code = $('#shareCodeInput').value.trim();
    $('#shareError').textContent = '';
    if (!code) { $('#shareError').textContent = '请输入分享码'; return; }
    const shares = Storage.get('shares', []);
    let found = shares.find(s => s.code === code);
    if (!found) { const community = this._getCommunityCodes(); found = community.find(c => c.code === code); }
    if (!found) { $('#shareError').textContent = '未找到该分享码'; return; }
    let agentData = null;
    try { agentData = JSON.parse(decodeURIComponent(atob(found.raw || found.code))); } catch { agentData = { n: found.name, p: found.prompt || '' }; }
    const name = agentData.n || found.name || '导入';
    this.showConfigPanel(null);
    $('#cfgAgentName').value = name;
    const gender = agentData.g || 'female';
    const language = agentData.l || DEFAULT_LANG;
    $('#cfgGender').value = gender;
    this._updateGenderUI(gender);
    this._initLanguageDropdown();
    $('#cfgLanguage').value = language;
    this._renderVoiceOptions(language, gender);
    $('#cfgVoice').value = agentData.v || getDefaultVoice(language, gender);
    $('#cfgModel').value = agentData.m || 'qwen';
    if (agentData.b === 'custom') {
      $('#cfgBranch').value = 'custom';
      this._switchBranchUI('custom');
      $('#cfgPrompt').value = agentData.p || '';
    } else {
      $('#cfgBranch').value = 'preset';
      this._switchBranchUI('preset');
      this.selectedPresets = agentData.ps || [];
      $('#cfgPresets').value = JSON.stringify(this.selectedPresets);
      this._renderPresetCards();
    }
    this._updateCfgCharCount();
    this._updatePreview();
    Toast.show(`已导入 "${name}" 的配置`, 'success');
  },

  _renderShares() {
    const shares = Storage.get('shares', []);
    const list = $('#shareList');
    if (!shares.length) { list.innerHTML = '<div class="empty-state"><p>保存智能体配置后自动生成分享码</p></div>'; return; }
    list.innerHTML = shares.map(s => `<div class="share-item"><span class="share-name">${this._esc(s.name)}</span><span class="share-code">${s.code}</span><button class="btn btn-sm btn-outline" onclick="navigator.clipboard?.writeText('${s.code}');Toast.show('已复制','info',1500)">复制</button></div>`).join('');
    this._updateStats();
  },

  _getCommunityCodes() {
    return [
      { code:'67R1iMmKQN', name:'温柔女友', desc:'温柔体贴的甜蜜陪伴', prompt:'我是{{assistant_name}}，你的温柔女友。轻声细语，善解人意。' },
      { code:'Tq2RNYPKQN', name:'健身教练', desc:'严格但鼓励的专业教练', prompt:'我是{{assistant_name}}，你的私人教练。严格要求但永远鼓励。' },
      { code:'KPAL321Ne7', name:'十种性格合一', desc:'多模式切换', prompt:'我是{{assistant_name}}，支持多种性格模式切换。' },
      { code:'79YKFNDKQN', name:'中老年陪伴', desc:'耐心温和的长辈陪伴', prompt:'我是{{assistant_name}}，您的贴心小棉袄。说话慢一点，永远耐心。' },
    ];
  },
  _initCommunity() {
    const grid = $('#communityGrid');
    const codes = this._getCommunityCodes();
    grid.innerHTML = codes.map(c => `<div class="community-card" onclick="App._importCommunity('${c.code}')"><div class="com-name">${c.name}</div><div class="com-desc">${c.desc}</div><div class="com-code">${c.code}</div></div>`).join('');
  },
  _importCommunity(code) {
    $('#shareCodeInput').value = code;
    this.importShareCode();
    // 切换页面
    $$('.nav-item').forEach(n => n.classList.remove('active'));
    const ni = document.querySelector('.nav-item[data-page="share"]');
    if (ni) ni.classList.add('active');
    $$('.page').forEach(p => p.classList.remove('active'));
    $('#page-share').classList.add('active');
    $('#pageTitle').textContent = '分享码';
  },

  // ====== 统计 ======
  _updateStats() {
    $('#statAgents').textContent = this.agents.length;
    $('#statOnline').textContent = this.agents.filter(a => a.online).length;
    $('#statPersonalities').textContent = this.agents.reduce((sum, a) => sum + (a.presets?.length || 0), 0);
    $('#statShares').textContent = (Storage.get('shares', [])).length;
  },

  // ====== 工具 ======
  _esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; },

  // 配置面板事件
  _initConfigPanel() {
    $('#cfgPrompt').addEventListener('input', () => { this._updateCfgCharCount(); this._panelChanged = true; this._updatePreview(); });
    $('#cfgAgentName').addEventListener('input', () => { this._panelChanged = true; this._updatePreview(); });
    $('#cfgVoice').addEventListener('change', () => { this._panelChanged = true; });
    $('#cfgModel').addEventListener('change', () => { this._panelChanged = true; });
    $('#cfgPreviewToggle').addEventListener('change', () => { if ($('#cfgPreviewToggle').checked) this._updatePreview(); });
    $('#configOverlay').addEventListener('click', function(e) { if (e.target === this) App._confirmClosePanel(); });
    document.querySelectorAll('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', function(e) {
        if (e.target === this && this.id === 'authModal') App.closeAuth();
        if (e.target === this && this.id === 'forgotModal') App.closeForgotPwd();
        if (e.target === this && this.id === 'confirmModal') App.dismissConfirm();
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
