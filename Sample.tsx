import React, { useState, useEffect, useRef } from 'react';
import {
    Code2,
    Heart,
    Copy,
    Share2,
    Plus,
    Search,
    User,
    MoreHorizontal,
    Image as ImageIcon,
    Check,
    Wand2,
    Sparkles,
    Zap,
    X,
    Terminal,
    Hash
} from 'lucide-react';

// --- 拡張版モックデータ: 12個の多様なサンプル ---
const INITIAL_POSTS = [
    {
        id: 1,
        user: { name: 'Shou', handle: '@shou_dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shou' },
        lang: 'React',
        code: `const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};`,
        likes: 342,
        previewColor: 'from-blue-500 to-cyan-400',
        description: '入力遅延処理の決定版。検索バーの実装に必須。',
        aiAnalysis: '✨ クリーンアップ関数を利用したメモリリーク防止の実装が完璧です。'
    },
    {
        id: 2,
        user: { name: 'Sarah', handle: '@rust_gurl', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
        lang: 'CSS',
        code: `.neon-text {
  color: #fff;
  text-shadow:
    0 0 7px #fff,
    0 0 10px #fff,
    0 0 21px #fff,
    0 0 42px #0fa,
    0 0 82px #0fa;
}`,
        likes: 892,
        previewColor: 'from-fuchsia-600 to-purple-600',
        description: 'たった数行でサイバーパンクな雰囲気を出すネオンエフェクト。',
        aiAnalysis: '✨ 多重text-shadowによる発光表現。ぼかし半径の倍数設定が黄金比的です。'
    },
    {
        id: 3,
        user: { name: 'Vim God', handle: '@vim_exit', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vim' },
        lang: 'Shell',
        code: `# 指定したポート(3000)を使っているプロセスを殺す
kill -9 $(lsof -t -i:3000)

# 解説:
# lsof -t : PIDのみを出力
# -i:3000 : ポート指定`,
        likes: 1205,
        previewColor: 'from-slate-800 to-black',
        description: 'Reactが起動しない時、大体これで解決する。',
        aiAnalysis: '✨ lsofとkillの組み合わせによる古典的かつ最強の解決策。強制終了(-9)は慎重に。'
    },
    {
        id: 4,
        user: { name: 'Alex', handle: '@algo_master', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
        lang: 'JavaScript',
        code: `// 配列のシャッフル (Fisher-Yates)
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};`,
        likes: 156,
        previewColor: 'from-emerald-500 to-green-600',
        description: 'sort(() => 0.5 - Math.random()) は偏るからやめとけ。これが正解。',
        aiAnalysis: '✨ O(n)の計算量で完全にランダムな順列を生成できる、最も効率的なアルゴリズムです。'
    },
    {
        id: 5,
        user: { name: 'Dave', handle: '@pythonista', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave' },
        lang: 'Python',
        code: `# リストの内包表記でFizzBuzz
print([
    "Fizz" * (i % 3 == 0) + 
    "Buzz" * (i % 5 == 0) or 
    str(i) 
    for i in range(1, 101)
])`,
        likes: 420,
        previewColor: 'from-yellow-400 to-orange-500',
        description: '面接で書くと嫌われるけど、個人的には大好きなワンライナー。',
        aiAnalysis: '✨ 文字列の掛け算とOR演算子の短絡評価を悪用(活用)した、Pythonicな黒魔術です。'
    },
    {
        id: 6,
        user: { name: 'Yuki', handle: '@ios_dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki' },
        lang: 'Swift',
        code: `// 画面のスクリーンショット撮影禁止
extension UIView {
    func makeSecure() {
        let field = UITextField()
        field.isSecureTextEntry = true
        self.addSubview(field)
        field.centerYAnchor.constraint(equalTo: self.centerYAnchor).isActive = true
        // Note: Hacky way to leverage secure layer
    }
}`,
        likes: 67,
        previewColor: 'from-orange-500 to-red-500',
        description: 'iOSのスクショ防止ハック。UITextFieldのセキュアレイヤーを逆利用する。',
        aiAnalysis: '✨ OSのセキュリティ機構をUIレイヤーに転用する、リスクはあるが非常に創造的なハックです。'
    },
    {
        id: 7,
        user: { name: 'Ken', handle: '@sql_ninja', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ken' },
        lang: 'SQL',
        code: `-- 重複レコードの削除（IDが大きい方を残す）
DELETE FROM users
WHERE id NOT IN (
  SELECT MAX(id)
  FROM users
  GROUP BY email
);`,
        likes: 310,
        previewColor: 'from-indigo-600 to-blue-800',
        description: 'やらかして重複データが入った時の救世主。',
        aiAnalysis: '✨ GROUP BYとサブクエリを組み合わせた、DBA必須のクリーンアップ・パターンです。'
    },
    {
        id: 8,
        user: { name: 'Mika', handle: '@three_js', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mika' },
        lang: 'GLSL',
        code: `// 虹色のプラズマシェーダー
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord/iResolution.xy;
    vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    fragColor = vec4(col,1.0);
}`,
        likes: 888,
        previewColor: 'from-pink-500 via-purple-500 to-indigo-500',
        description: 'Shadertoyでよく見るやつ。コサイン波だけで虹色は作れる。',
        aiAnalysis: '✨ 三角関数によるRGBの位相ズレを利用した、数学的に美しいカラーパレット生成手法です。'
    },
    {
        id: 9,
        user: { name: 'Git Bot', handle: '@git_rescue', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Git' },
        lang: 'Git',
        code: `# 直前のコミットメッセージを修正する
git commit --amend -m "New message"

# 直前のコミットにファイルを追加し忘れた時
git add forgotten_file
git commit --amend --no-edit`,
        likes: 2200,
        previewColor: 'from-orange-700 to-red-800',
        description: '「Fix typo」コミットを量産しないために。',
        aiAnalysis: '✨ 歴史改変(--amend)はプッシュ前なら無罪。履歴を綺麗に保つための基本作法です。'
    },
    {
        id: 10,
        user: { name: 'Hacker', handle: '@regex_lover', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hacker' },
        lang: 'Regex',
        code: `(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}

# 解説:
# 小文字, 大文字, 数字, 記号 を各1つ以上含む
# かつ8文字以上`,
        likes: 150,
        previewColor: 'from-green-400 to-blue-500',
        description: '最強のパスワードバリデーション正規表現。肯定先読み(?=)が肝。',
        aiAnalysis: '✨ 先読みアサーション(Lookahead)を連鎖させることで、複雑な条件を1行で記述しています。'
    },
    {
        id: 11,
        user: { name: 'DevOps', handle: '@docker_clean', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
        lang: 'Shell',
        code: `# 停止中のコンテナ・未使用イメージ・ボリュームを一括削除
docker system prune -a --volumes

# 警告: 全て消えるので注意`,
        likes: 540,
        previewColor: 'from-blue-600 to-blue-400',
        description: 'ディスク容量が足りない時に唱える呪文。',
        aiAnalysis: '✨ 開発環境の断捨離コマンド。--volumesを含めることで永続化データも消去する徹底ぶりです。'
    },
    {
        id: 12,
        user: { name: 'Rustacean', handle: '@rust_fan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rust' },
        lang: 'Rust',
        code: `// Result型のエレガントな処理
let result = match file.read_to_string(&mut contents) {
    Ok(_) => "Success!",
    Err(e) => panic!("Error: {:?}", e),
};

// 失敗したら即終了なら .expect("msg") も可`,
        likes: 212,
        previewColor: 'from-orange-600 to-yellow-600',
        description: 'Rustのパターンマッチは芸術。エラーハンドリングすら美しい。',
        aiAnalysis: '✨ パターンマッチングによる網羅的なエラー処理。Rustの安全性を象徴する構文です。'
    }
];

// --- コンポーネント: シンタックスハイライト ---
const CodeBlock = ({ code }) => {
    const highlight = (text) => {
        // 簡易ハイライトロジック
        const keywords = ['const', 'let', 'var', 'return', 'function', 'import', 'from', 'class', 'if', 'else', '=>', 'for', 'while', 'print', 'struct', 'impl', 'pub', 'fn', 'mut', 'match', 'Ok', 'Err'];
        const types = ['String', 'Int', 'bool', 'void', 'vec2', 'vec3', 'vec4', 'useState', 'useEffect'];
        const comments = text.includes('//') || text.includes('#') || text.includes('--');

        return text.split(/(\s+)/).map((word, i) => {
            if (word.startsWith('//') || word.startsWith('#') || (word.startsWith('--') && !word.includes('var'))) return <span key={i} className="text-slate-500 italic" > {word} </span>;
            if (keywords.includes(word)) return <span key={i} className="text-purple-400 font-bold" > {word} </span>;
            if (types.includes(word)) return <span key={i} className="text-yellow-300" > {word} </span>;
            if (word.startsWith('"') || word.startsWith("'")) return <span key={i} className="text-green-300" > {word} </span>;
            if (word.match(/^[A-Z][a-zA-Z]*$/)) return <span key={i} className="text-blue-300" > {word} </span>;
            if (!isNaN(word)) return <span key={i} className="text-orange-300" > {word} </span>;
            return <span key={i}> {word} </span>;
        });
    };

    return (
        <pre className="font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre font-medium text-slate-300" >
            <code>{highlight(code)} </code>
        </pre>
    );
};

// --- メインアプリ ---
export default function SeptimaApp() {
    const [activeTab, setActiveTab] = useState('feed');
    const [posts, setPosts] = useState(INITIAL_POSTS);

    // 投稿用State
    const [newCode, setNewCode] = useState('');
    const [newLang, setNewLang] = useState('JavaScript');
    const [newDesc, setNewDesc] = useState('');
    const [lineCount, setLineCount] = useState(1);
    const [isOverLimit, setIsOverLimit] = useState(false);

    // AI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);

    // コード入力ハンドラー
    const handleCodeChange = (text) => {
        const lines = text.split('\n').length;
        setNewCode(text);
        setLineCount(lines);
        setIsOverLimit(lines > 7);
    };

    // ----------------------------------------------------------------
    // AI機能: Refine (コード短縮)
    // ----------------------------------------------------------------
    const handleAiRefine = () => {
        if (!newCode.trim()) return;
        setIsAiLoading(true);
        setTimeout(() => {
            // 模擬的なAI短縮処理
            let refined = newCode;
            if (newCode.includes('function') && newCode.includes('return')) {
                refined = refined.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{[\s\S]*return\s+([^;]+);?[\s\S]*\}/, 'const $1 = ($2) => $3;');
            } else {
                refined = newCode.split('\n').filter(line => line.trim() !== '').join('\n');
            }
            handleCodeChange(refined);
            setIsAiLoading(false);
            setAiSuggestion('✨ Code condensed magically!');
            setTimeout(() => setAiSuggestion(null), 3000);
        }, 1000);
    };

    // 投稿ハンドラー
    const handlePost = () => {
        if (isOverLimit || !newCode.trim()) return;
        const newPost = {
            id: Date.now(),
            user: { name: 'Guest User', handle: '@guest', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest' },
            lang: newLang,
            code: newCode,
            likes: 0,
            previewColor: 'from-gray-700 to-gray-600',
            description: newDesc,
            aiAnalysis: '✨ AI analysis pending...'
        };
        setPosts([newPost, ...posts]);
        setNewCode('');
        setNewDesc('');
        setLineCount(1);
        setActiveTab('feed');
    };

    // --- フィード画面 ---
    const FeedView = () => (
        <div className="pb-24 space-y-6" >
            <div className="flex items-center justify-between px-4 pt-4 sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 py-3 border-b border-white/5" >
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 font-mono tracking-tighter cursor-pointer" onClick={() => window.scrollTo(0, 0)
                }>
                    Septima
                </h1>
                < div className="flex space-x-4" >
                    <Search className="w-6 h-6 text-slate-400" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-0.5" >
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Me" alt="Me" className="w-full h-full rounded-full bg-slate-900" />
                    </div>
                </div>
            </div>

            < div className="flex space-x-3 px-4 overflow-x-auto scrollbar-hide pb-2 pt-2" >
                {
                    ['#Trending', '#React', '#Python', '#Shell', '#Rust', '#CSS', '#SQL'].map((tag) => (
                        <button key={tag} className="px-4 py-1.5 rounded-full bg-slate-900 text-slate-300 text-xs font-medium whitespace-nowrap border border-slate-800 hover:border-purple-500/50 hover:text-purple-400 transition-colors" >
                            {tag}
                        </button>
                    ))
                }
            </div>

            < div className="space-y-6 px-4" >
                {
                    posts.map((post) => (
                        <FeedItem key={post.id} post={post} />
                    ))
                }
            </div>
        </div>
    );

    const FeedItem = ({ post }) => {
        const [showAiAnalysis, setShowAiAnalysis] = useState(false);
        return (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl shadow-black/20 group" >
                <div className="p-4 flex justify-between items-start bg-[#0d1117] border-b border-slate-800/50" >
                    <div className="flex items-center space-x-3" >
                        <img src={post.user.avatar} alt={post.user.name} className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800" />
                        <div>
                            <div className="flex items-center space-x-2" >
                                <span className="font-bold text-slate-200 text-sm" > {post.user.name} </span>
                                < span className="text-xs text-slate-500" > {post.user.handle} </span>
                            </div>
                            < div className="flex items-center space-x-2 mt-1" >
                                <span className={
                                    `inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${post.lang === 'React' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                        post.lang === 'Python' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                                            post.lang === 'Rust' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                                                post.lang === 'Shell' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                                                    'text-purple-400 bg-purple-500/10 border-purple-500/20'
                                    }`
                                }>
                                    {post.lang}
                                </span>
                                < span className="text-[10px] text-slate-600" > 2h ago </span>
                            </div>
                        </div>
                    </div>
                    < button className="text-slate-500 hover:text-slate-300" >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>

                < div className="relative bg-[#0d1117]" >
                    <div className="px-4 py-5 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent" >
                        <CodeBlock code={post.code} />
                    </div>
                    < button
                        className="absolute top-2 right-2 p-2 bg-slate-800/50 hover:bg-slate-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white backdrop-blur-sm"
                        onClick={() => alert('Copied!')}
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                </div>

                < div className="relative" >
                    <div className={`h-12 w-full bg-gradient-to-r ${post.previewColor} relative overflow-hidden flex items-center px-4 justify-between`}>
                        <div className="flex items-center space-x-2" >
                            <Terminal className="w-3 h-3 text-white/50" />
                            <span className="text-white/60 text-[10px] font-mono uppercase tracking-wider" > Output Preview </span>
                        </div>

                        < button
                            onClick={() => setShowAiAnalysis(!showAiAnalysis)}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-full backdrop-blur-md transition-all border ${showAiAnalysis ? 'bg-purple-500 border-purple-400 text-white' : 'bg-black/20 border-white/10 text-white hover:bg-black/40'}`}
                        >
                            <Sparkles className="w-3 h-3" />
                            <span className="text-[10px] font-bold" > AI Analyze </span>
                        </button>
                    </div>

                    {
                        showAiAnalysis && (
                            <div className="bg-slate-800/90 backdrop-blur-xl p-4 border-t border-slate-700 animate-in slide-in-from-top-2 duration-200" >
                                <div className="flex items-start space-x-3" >
                                    <div className="mt-0.5 p-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg shadow-purple-500/20" >
                                        <Wand2 className="w-3 h-3 text-white" />
                                    </div>
                                    < div >
                                        <p className="text-[10px] font-bold text-purple-300 mb-1 tracking-wider" > SEPTIMA AI INSIGHT </p>
                                        < p className="text-sm text-slate-200 leading-relaxed font-medium" > {post.aiAnalysis} </p>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>

                < div className="p-4 bg-slate-900" >
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed" >
                        <span className="text-slate-200 font-bold mr-2" > {post.user.handle} </span>
                        {post.description}
                    </p>
                    < div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-800/50" >
                        <div className="flex space-x-6" >
                            <button className="flex items-center space-x-1.5 hover:text-pink-500 transition-colors group" >
                                <Heart className="w-5 h-5 group-hover:scale-110 transition-transform group-active:scale-90" />
                                <span className="text-xs font-mono font-medium" > {post.likes} </span>
                            </button>
                            < button className="flex items-center space-x-1.5 hover:text-blue-400 transition-colors" >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                        < button className="text-slate-600 hover:text-slate-400" >
                            <Hash className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const ComposeView = () => (
        <div className="h-full flex flex-col bg-slate-950" >
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800 bg-slate-950 sticky top-0 z-10" >
                <button onClick={() => setActiveTab('feed')} className="text-slate-400 hover:text-white text-sm font-medium" >
                    Cancel
                </button>
                < span className="font-bold text-white" > New Snippet </span>
                < button
                    onClick={handlePost}
                    disabled={isOverLimit || !newCode.trim()}
                    className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${isOverLimit || !newCode.trim()
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-purple-100'
                        }`}
                >
                    Post
                </button>
            </div>

            < div className="flex-1 p-4 overflow-y-auto" >
                <div className="flex space-x-2 mb-6 overflow-x-auto scrollbar-hide py-1" >
                    {
                        ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Swift', 'Go', 'Shell', 'SQL', 'CSS'].map(lang => (
                            <button
                                key={lang}
                                onClick={() => setNewLang(lang)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${newLang === lang
                                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20 transform scale-105'
                                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'
                                    }`}
                            >
                                {lang}
                            </button>
                        ))}
                </div>

                {
                    aiSuggestion && (
                        <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2" >
                            <div className="flex items-center text-purple-300 text-xs font-medium" >
                                <Zap className="w-3 h-3 mr-2 text-yellow-400 fill-yellow-400" />
                                {aiSuggestion}
                            </div>
                            < button onClick={() => setAiSuggestion(null)
                            } className="text-slate-500 hover:text-white" > <X className="w-3 h-3" /> </button>
                        </div>
                    )}

                <div className="relative group bg-[#0d1117] rounded-xl border border-slate-800 overflow-hidden" >
                    <div className="absolute left-0 top-0 bottom-0 w-10 pt-4 text-center text-slate-600 font-mono text-xs leading-6 border-r border-slate-800/50 select-none bg-slate-900/50" >
                        {
                            [...Array(Math.max(7, lineCount))].map((_, i) => (
                                <div key={i} className={`transition-colors ${i >= 7 ? 'text-red-500 font-bold bg-red-500/10' : ''}`} >
                                    {i + 1}
                                </div>
                            ))}
                    </div>

                    < textarea
                        value={newCode}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="// Only 7 lines. Make it count."
                        className={`w-full h-64 bg-transparent pl-12 pr-4 py-4 text-sm font-mono leading-6 resize-none focus:outline-none placeholder-slate-700 ${isOverLimit ? 'text-red-300' : 'text-slate-200'
                            }`}
                        spellCheck="false"
                    />

                    <button
                        onClick={handleAiRefine}
                        disabled={!newCode.trim() || isAiLoading}
                        className="absolute bottom-4 right-4 p-2.5 bg-purple-600 rounded-lg shadow-lg text-white hover:bg-purple-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group border border-purple-400/30"
                    >
                        <Wand2 className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                < div className={`mt-3 flex justify-end items-center text-xs font-mono transition-colors ${isOverLimit ? 'text-red-400' : 'text-slate-500'}`}>
                    {isOverLimit && <span className="font-bold mr-2 animate-pulse" >⚠️ TOO LONG </span>}
                    <span>{lineCount} / 7 lines </span>
                </div>

                < div className="mt-8" >
                    <input
                        type="text"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Add a caption... (optional)"
                        className="w-full bg-slate-900 border-b border-slate-800 px-0 py-3 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-colors placeholder-slate-600"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-slate-200 flex justify-center font-sans selection:bg-purple-500/30" >
            <div className="w-full max-w-md h-screen bg-slate-950 relative flex flex-col shadow-2xl overflow-hidden border-x border-slate-900" >
                <div className="flex-1 overflow-y-auto scrollbar-hide" >
                    {activeTab === 'compose' ? <ComposeView /> : <FeedView />}
                </div>
                {
                    activeTab !== 'compose' && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex items-center justify-around py-3 px-2 z-50" >
                            <button onClick={() => setActiveTab('feed')} className={`p-2 rounded-xl transition-all ${activeTab === 'feed' ? 'text-white bg-white/10' : 'text-slate-500 hover:text-slate-300'}`
                            }> <Code2 className="w-6 h-6" /> </button>
                            < button onClick={() => setActiveTab('compose')} className="p-3 -mt-10 bg-white text-black rounded-full shadow-lg shadow-white/20 hover:scale-105 transition-transform" > <Plus className="w-6 h-6" /> </button>
                            < button className="p-2 rounded-xl text-slate-500 hover:text-slate-300" > <User className="w-6 h-6" /> </button>
                        </div>
                    )}
            </div>
        </div>
    );
}