import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiRequest } from "../../src/lib/api";
import type { ComposerSuggestions, TimelinePost } from "../../src/lib/types";
import { useAuth } from "../../src/providers/AuthProvider";
import { PostCard } from "../../src/components/PostCard";

type TimelineResponse = {
  items: TimelinePost[];
  hasMore: boolean;
};

const DEFAULT_SUGGESTIONS: ComposerSuggestions = {
  languages: ["TypeScript", "JavaScript", "Python", "Rust", "SQL", "Mermaid"],
  versions: ["latest", "v5", "v4", "3.12", "1.81"],
  tags: ["react", "nextjs", "drizzle", "turso", "hono", "zod"]
};

export default function TimelineScreen() {
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [tab, setTab] = useState<"for-you" | "latest" | "following">("for-you");
  const [items, setItems] = useState<TimelinePost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [premiseText, setPremiseText] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("TypeScript");
  const [version, setVersion] = useState("latest");
  const [tags, setTags] = useState("");
  const [posting, setPosting] = useState(false);
  const [postMessage, setPostMessage] = useState("");
  const [suggestions, setSuggestions] = useState<ComposerSuggestions>(DEFAULT_SUGGESTIONS);
  const requestSeqRef = useRef(0);
  const tabRef = useRef(tab);

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  const loadPage = useCallback(
    async (targetPage: number, reset = false, requestedTab: "for-you" | "latest" | "following" = tabRef.current) => {
      const seq = ++requestSeqRef.current;
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<TimelineResponse>(`/timeline?tab=${requestedTab}&page=${targetPage}&limit=20`, { token });
        if (seq !== requestSeqRef.current || requestedTab !== tabRef.current) return;
        setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
        setHasMore(data.hasMore);
        setPage(targetPage);
      } catch (e) {
        if (seq !== requestSeqRef.current || requestedTab !== tabRef.current) return;
        setError(e instanceof Error ? e.message : "timeline_failed");
      } finally {
        if (seq === requestSeqRef.current) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    setItems([]);
    setHasMore(false);
    setPage(1);
    void loadPage(1, true, tab);
  }, [tab, loadPage]);

  useEffect(() => {
    void (async () => {
      try {
        const fetched = await apiRequest<ComposerSuggestions>("/composer/suggestions", { token });
        setSuggestions({
          languages: fetched.languages.length ? fetched.languages : DEFAULT_SUGGESTIONS.languages,
          versions: fetched.versions.length ? fetched.versions : DEFAULT_SUGGESTIONS.versions,
          tags: fetched.tags.length ? fetched.tags : DEFAULT_SUGGESTIONS.tags
        });
      } catch {
        setSuggestions(DEFAULT_SUGGESTIONS);
      }
    })();
  }, [token]);

  async function toggleLike(publicId: string) {
    if (!token) return;
    await apiRequest(`/posts/${publicId}/like`, { method: "POST", token });
    await loadPage(1, true);
  }

  async function onLogout() {
    await logout();
    router.replace("/(tabs)/timeline");
  }

  async function onSubmitPost() {
    if (!token) return;
    setPosting(true);
    setPostMessage("");
    try {
      await apiRequest<{ publicId: string }>("/posts", {
        method: "POST",
        token,
        body: { premiseText, code, language, version, tags }
      });
      setComposerOpen(false);
      setCode("");
      setPremiseText("");
      setTags("");
      await loadPage(1, true);
    } catch (e) {
      setPostMessage(e instanceof Error ? e.message : "post_failed");
    } finally {
      setPosting(false);
    }
  }

  const lineCount = code ? code.split("\n").length : 1;
  const overLimit = lineCount > 7;
  const languageSuggestions = suggestions.languages
    .filter((item) => item.toLowerCase().includes(language.trim().toLowerCase()))
    .slice(0, 8);
  const versionSuggestions = suggestions.versions
    .filter((item) => item.toLowerCase().includes(version.trim().toLowerCase()))
    .slice(0, 8);
  const tagNeedle = tags.split(",").at(-1)?.trim().toLowerCase() ?? "";
  const tagSuggestions = suggestions.tags.filter((item) => item.toLowerCase().includes(tagNeedle)).slice(0, 8);

  function applyTagSuggestion(suggestion: string) {
    const parts = tags.split(",");
    if (parts.length === 1) {
      setTags(suggestion);
      return;
    }
    parts[parts.length - 1] = ` ${suggestion}`;
    setTags(parts.join(",").replace(/^ /, ""));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>SeptCode</Text>
          <Text style={styles.tagline}>-7行のコード共有-</Text>
        </View>
        {user ? (
          <View style={styles.authRow}>
            <Text style={styles.userHandle}>@{user.handle}</Text>
            <Pressable style={styles.authButtonGhost} onPress={() => void onLogout()}>
              <Text style={styles.authButtonGhostText}>ログアウト</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.authRow}>
            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.authButtonPrimary}>
                <Text style={styles.authButtonPrimaryText}>ログイン</Text>
              </Pressable>
            </Link>
            <Link href="/(auth)/register" asChild>
              <Pressable style={styles.authButtonGhost}>
                <Text style={styles.authButtonGhostText}>新規登録</Text>
              </Pressable>
            </Link>
          </View>
        )}
      </View>

      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === "for-you" && styles.tabActive]} onPress={() => setTab("for-you")}>
          <Text style={styles.tabText}>おすすめ</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "latest" && styles.tabActive]} onPress={() => setTab("latest")}>
          <Text style={styles.tabText}>最新</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "following" && styles.tabActive, !token && styles.tabDisabled]}
          onPress={() => {
            if (!token) return;
            setTab("following");
          }}
        >
          <Text style={styles.tabText}>フォロー中</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {!token && <Text style={styles.note}>未ログインでも閲覧できます。フォロー中表示やいいねにはログインが必要です。</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}
        {items.map((item) => (
          <PostCard key={item.publicId} post={item} onToggleLike={toggleLike} />
        ))}
        {hasMore && (
          <Pressable style={styles.moreButton} onPress={() => void loadPage(page + 1)}>
            <Text style={styles.moreButtonText}>{loading ? "読み込み中..." : "さらに表示"}</Text>
          </Pressable>
        )}
        {!hasMore && items.length === 0 && <Text style={styles.empty}>投稿がありません。</Text>}
      </ScrollView>

      {user && (
        <Pressable style={styles.fab} onPress={() => setComposerOpen(true)}>
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      )}

      <Modal visible={composerOpen} transparent animationType="fade" onRequestClose={() => setComposerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新規投稿</Text>
              <Pressable style={styles.closeButton} onPress={() => setComposerOpen(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={setCode}
                placeholder="// 7行以内のコード"
                placeholderTextColor="#778"
                multiline
              />
              <Text style={[styles.lineCount, overLimit && styles.lineCountOver]}>{lineCount} / 7 lines</Text>

              <TextInput style={styles.input} value={language} onChangeText={setLanguage} placeholder="language (e.g. TypeScript)" placeholderTextColor="#778" />
              <View style={styles.suggestRow}>
                {languageSuggestions.map((item) => (
                  <Pressable key={`lang-${item}`} style={styles.suggestChip} onPress={() => setLanguage(item)}>
                    <Text style={styles.suggestChipText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput style={styles.input} value={version} onChangeText={setVersion} placeholder="version (e.g. v5)" placeholderTextColor="#778" />
              <View style={styles.suggestRow}>
                {versionSuggestions.map((item) => (
                  <Pressable key={`ver-${item}`} style={styles.suggestChip} onPress={() => setVersion(item)}>
                    <Text style={styles.suggestChipText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="tags (comma separated)" placeholderTextColor="#778" />
              <View style={styles.suggestRow}>
                {tagSuggestions.map((item) => (
                  <Pressable key={`tag-${item}`} style={styles.suggestChip} onPress={() => applyTagSuggestion(item)}>
                    <Text style={styles.suggestChipText}>#{item}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={[styles.input, styles.premiseInput]}
                value={premiseText}
                onChangeText={setPremiseText}
                placeholder={"前提文を2行で入力\n例: 処理対象は10万件\n例: 1秒以内で返す必要あり"}
                placeholderTextColor="#778"
                multiline
              />

              <Pressable style={[styles.submitButton, overLimit && styles.submitButtonDisabled]} onPress={() => void onSubmitPost()} disabled={posting || overLimit}>
                <Text style={styles.submitButtonText}>{posting ? "投稿中..." : "投稿する"}</Text>
              </Pressable>
              {!!postMessage && <Text style={styles.error}>{postMessage}</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f1d" },
  header: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2a365f",
    borderRadius: 12,
    backgroundColor: "#111931",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  brand: { color: "#7cf8d5", fontSize: 26, fontWeight: "800" },
  tagline: { color: "#9fb3e5", fontSize: 11 },
  authRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  userHandle: { color: "#d8e3ff", fontSize: 12 },
  authButtonPrimary: { backgroundColor: "#56f0c1", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  authButtonPrimaryText: { color: "#04101a", fontSize: 12, fontWeight: "700" },
  authButtonGhost: { borderWidth: 1, borderColor: "#4b5d8d", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  authButtonGhostText: { color: "#d8e3ff", fontSize: 12, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: 8, padding: 12 },
  tab: { flex: 1, backgroundColor: "#111931", borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: "#24335f" },
  tabActive: { borderColor: "#6efacb" },
  tabDisabled: { opacity: 0.6 },
  tabText: { color: "#d8e3ff", fontWeight: "700" },
  content: { padding: 12, gap: 10, paddingBottom: 28 },
  note: { color: "#9fb3e5", fontSize: 12 },
  error: { color: "#ff9e9e", marginBottom: 8 },
  empty: { color: "#9fb3e5", textAlign: "center", marginTop: 16 },
  moreButton: { marginTop: 8, backgroundColor: "#1a2a4f", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  moreButtonText: { color: "#d4e1ff" },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#56f0c1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  fabText: { color: "#04101a", fontSize: 32, lineHeight: 34 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 14 },
  modalCard: { maxHeight: "88%", borderRadius: 16, borderWidth: 1, borderColor: "#2a365f", backgroundColor: "#0d1117" },
  modalHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#24335f",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  modalTitle: { color: "#e8edff", fontWeight: "700" },
  closeButton: { borderWidth: 1, borderColor: "#4b5d8d", borderRadius: 8, width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  closeButtonText: { color: "#d8e3ff", fontSize: 20, lineHeight: 21 },
  modalBody: { padding: 14, gap: 10 },
  input: { backgroundColor: "#111931", borderWidth: 1, borderColor: "#1f2d5a", borderRadius: 10, color: "#e8edff", paddingHorizontal: 12, paddingVertical: 10 },
  suggestRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: -2 },
  suggestChip: { borderWidth: 1, borderColor: "#2c3d66", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#111931" },
  suggestChipText: { color: "#b8c8ef", fontSize: 12 },
  codeInput: { minHeight: 180, textAlignVertical: "top", fontFamily: "monospace" },
  premiseInput: { minHeight: 80, textAlignVertical: "top" },
  lineCount: { color: "#9fb3e5", textAlign: "right", fontSize: 12 },
  lineCountOver: { color: "#ff9e9e", fontWeight: "700" },
  submitButton: { backgroundColor: "#56f0c1", borderRadius: 999, alignItems: "center", paddingVertical: 11 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#04101a", fontWeight: "700" }
});
