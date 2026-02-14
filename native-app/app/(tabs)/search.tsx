import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiRequest } from "../../src/lib/api";
import type { TimelinePost } from "../../src/lib/types";
import { useAuth } from "../../src/providers/AuthProvider";
import { PostCard } from "../../src/components/PostCard";

type TimelineResponse = {
  items: TimelinePost[];
  hasMore: boolean;
};

export default function SearchScreen() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [items, setItems] = useState<TimelinePost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(targetPage = 1, reset = true) {
    const q = query.trim();
    if (!q) {
      setSubmittedQuery("");
      setItems([]);
      setHasMore(false);
      setPage(1);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<TimelineResponse>(
        `/timeline?tab=for-you&page=${targetPage}&limit=20&q=${encodeURIComponent(q)}`,
        { token }
      );
      setSubmittedQuery(q);
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setHasMore(data.hasMore);
      setPage(targetPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "search_failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike(publicId: string) {
    if (!token) return;
    await apiRequest(`/posts/${publicId}/like`, { method: "POST", token });
    if (!submittedQuery) return;
    const data = await apiRequest<TimelineResponse>(
      `/timeline?tab=for-you&page=1&limit=${Math.max(items.length, 20)}&q=${encodeURIComponent(submittedQuery)}`,
      { token }
    );
    setItems(data.items);
    setHasMore(data.hasMore);
    setPage(1);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>検索</Text>
        <Text style={styles.hint}>例: tag:react lang:ts date:2026-02-14 useState</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="キーワード / tag: / lang: / date:"
          placeholderTextColor="#778"
          returnKeyType="search"
          onSubmitEditing={() => void runSearch(1, true)}
        />
        <Pressable style={styles.button} onPress={() => void runSearch(1, true)} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "検索中" : "検索"}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!!error && <Text style={styles.error}>{error}</Text>}
        {!submittedQuery && <Text style={styles.note}>検索ワードを入力してください。</Text>}
        {!!submittedQuery && items.length === 0 && !loading && <Text style={styles.note}>一致する投稿が見つかりませんでした。</Text>}
        {items.map((item) => (
          <PostCard key={item.publicId} post={item} onToggleLike={toggleLike} />
        ))}
        {hasMore && (
          <Pressable style={styles.moreButton} onPress={() => void runSearch(page + 1, false)} disabled={loading}>
            <Text style={styles.moreButtonText}>{loading ? "読み込み中..." : "さらに表示"}</Text>
          </Pressable>
        )}
      </ScrollView>
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
    backgroundColor: "#111931"
  },
  title: { color: "#7cf8d5", fontSize: 22, fontWeight: "800" },
  hint: { color: "#9fb3e5", fontSize: 12, marginTop: 4 },
  searchRow: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: "#0e1730",
    borderWidth: 1,
    borderColor: "#1f2d5a",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#e8edff"
  },
  button: { backgroundColor: "#56f0c1", borderRadius: 10, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#04101a", fontWeight: "700" },
  content: { padding: 12, gap: 10, paddingBottom: 24 },
  error: { color: "#ff9e9e" },
  note: { color: "#9fb3e5", fontSize: 13 },
  moreButton: { marginTop: 8, backgroundColor: "#1a2a4f", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  moreButtonText: { color: "#d4e1ff" }
});
