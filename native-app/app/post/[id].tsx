import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiRequest } from "../../src/lib/api";
import { useAuth } from "../../src/providers/AuthProvider";
import { CodeRenderer } from "../../src/components/CodeRenderer";

type PostDetail = {
  id: number;
  publicId: string;
  authorId: number;
  authorName: string;
  authorHandle: string;
  premise1: string;
  premise2: string;
  code: string;
  language: string;
  version: string | null;
  aiSummary: string | null;
  tags: string[];
  likeCount: number;
  likedByMe: boolean;
  comments: Array<{ id: number; body: string; userName: string; userHandle: string }>;
};

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editCode, setEditCode] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editPremiseText, setEditPremiseText] = useState("");

  const isOwner = Boolean(post && user && post.authorId === user.id);

  function applyPostToEditor(next: PostDetail) {
    setEditCode(next.code);
    setEditLanguage(next.language ?? "");
    setEditVersion(next.version ?? "");
    setEditTags(next.tags.join(", "));
    setEditPremiseText([next.premise1 ?? "", next.premise2 ?? ""].filter((line) => line.trim().length > 0).join("\n"));
  }

  async function refreshPost() {
    if (!params.id) return;
    const data = await apiRequest<PostDetail>(`/posts/${params.id}`, { token });
    setPost(data);
    applyPostToEditor(data);
  }

  useEffect(() => {
    if (!params.id) return;
    void (async () => {
      try {
        await refreshPost();
      } catch (e) {
        setError(e instanceof Error ? e.message : "load_failed");
      }
    })();
  }, [params.id, token]);

  async function addComment() {
    if (!token || !params.id || !body.trim()) return;
    try {
      setError("");
      await apiRequest(`/posts/${params.id}/comments`, { method: "POST", token, body: { body } });
      setBody("");
      await refreshPost();
    } catch (e) {
      setError(e instanceof Error ? e.message : "comment_failed");
    }
  }

  async function toggleLike() {
    if (!token || !params.id) return;
    try {
      setError("");
      await apiRequest(`/posts/${params.id}/like`, { method: "POST", token });
      await refreshPost();
    } catch (e) {
      setError(e instanceof Error ? e.message : "like_failed");
    }
  }

  async function savePost() {
    if (!token || !params.id || !isOwner) return;
    setSaving(true);
    setError("");
    try {
      const premiseLines = editPremiseText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      await apiRequest(`/posts/${params.id}`, {
        method: "PATCH",
        token,
        body: {
          code: editCode,
          language: editLanguage,
          version: editVersion,
          tags: editTags,
          premise1: premiseLines[0] ?? "",
          premise2: premiseLines[1] ?? ""
        }
      });
      await refreshPost();
    } catch (e) {
      setError(e instanceof Error ? e.message : "update_failed");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost() {
    if (!token || !params.id || !isOwner) return;
    setDeleting(true);
    setError("");
    try {
      await apiRequest(`/posts/${params.id}`, { method: "DELETE", token });
      router.replace("/(tabs)/timeline");
    } catch (e) {
      setError(e instanceof Error ? e.message : "delete_failed");
      setDeleting(false);
    }
  }

  const avatarUrl = post ? `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(post.authorHandle)}` : "";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {!!error && <Text style={styles.error}>{error}</Text>}
        {post && (
          <View style={styles.card}>
            <Link href={`/(tabs)/user/${post.authorId}`} asChild>
              <Pressable style={styles.authorRow}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                <View>
                  <Text style={styles.authorName}>{post.authorName}</Text>
                  <Text style={styles.author}>@{post.authorHandle}</Text>
                </View>
              </Pressable>
            </Link>
            <Text style={styles.premise}>{post.premise1}</Text>
            <Text style={styles.premise}>{post.premise2}</Text>
            <CodeRenderer language={post.language} code={post.code} />
            <Text style={styles.ai}>AI: {post.aiSummary ?? "解説未生成"}</Text>
            <View style={styles.actionRow}>
              <Pressable onPress={() => void toggleLike()}>
                <Text style={styles.action}>{post.likedByMe ? `♥ ${post.likeCount}` : `♡ ${post.likeCount}`}</Text>
              </Pressable>
            </View>

            {isOwner && (
              <View style={styles.editSection}>
                <Text style={styles.section}>投稿を編集</Text>
                <TextInput style={[styles.input, styles.codeInput]} value={editCode} onChangeText={setEditCode} multiline placeholder="// code" />
                <TextInput style={styles.input} value={editLanguage} onChangeText={setEditLanguage} placeholder="language (optional)" />
                <TextInput style={styles.input} value={editVersion} onChangeText={setEditVersion} placeholder="version (optional)" />
                <TextInput style={styles.input} value={editTags} onChangeText={setEditTags} placeholder="tags (comma separated)" />
                <TextInput
                  style={[styles.input, styles.premiseInput]}
                  value={editPremiseText}
                  onChangeText={setEditPremiseText}
                  placeholder={"前提文を2行で入力\n例: 処理対象は10万件\n例: 1秒以内で返す必要あり"}
                  placeholderTextColor="#778"
                  multiline
                />
                <Pressable style={styles.button} onPress={() => void savePost()} disabled={saving || deleting}>
                  <Text style={styles.buttonText}>{saving ? "更新中..." : "更新する"}</Text>
                </Pressable>
                <Pressable style={styles.dangerButton} onPress={() => void deletePost()} disabled={saving || deleting}>
                  <Text style={styles.dangerButtonText}>{deleting ? "削除中..." : "投稿を削除"}</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.section}>コメント</Text>
            <TextInput value={body} onChangeText={setBody} placeholder="コメントを入力" placeholderTextColor="#778" style={styles.input} />
            <Pressable style={styles.button} onPress={() => void addComment()}>
              <Text style={styles.buttonText}>送信</Text>
            </Pressable>
            {post.comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <Text style={styles.commentBody}>{comment.body}</Text>
                <Text style={styles.commentMeta}>
                  {comment.userName} (@{comment.userHandle})
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f1d" },
  content: { padding: 12 },
  error: { color: "#ff9e9e" },
  card: { backgroundColor: "#111931", borderWidth: 1, borderColor: "#1f2d5a", borderRadius: 12, padding: 12, gap: 8 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: "#1f2d5a", backgroundColor: "#0a0f1d" },
  authorName: { color: "#dce6ff", fontWeight: "700" },
  author: { color: "#87d9ff", fontSize: 12 },
  premise: { color: "#dde6ff" },

  ai: { color: "#cdb6ff", fontSize: 12 },
  actionRow: { flexDirection: "row", gap: 12 },
  action: { color: "#d2defd" },
  editSection: { gap: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: "#1f2d5a", paddingTop: 8 },
  section: { color: "#f0f5ff", fontWeight: "700", marginTop: 6 },
  input: { backgroundColor: "#0e1730", borderWidth: 1, borderColor: "#1f2d5a", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: "#e8edff" },
  codeInput: { minHeight: 130, textAlignVertical: "top", fontFamily: "monospace" },
  premiseInput: { minHeight: 90, textAlignVertical: "top" },
  button: { backgroundColor: "#22396e", borderRadius: 8, alignItems: "center", paddingVertical: 10 },
  buttonText: { color: "#dce6ff", fontWeight: "700" },
  dangerButton: { borderWidth: 1, borderColor: "#8a2f3f", borderRadius: 8, alignItems: "center", paddingVertical: 10 },
  dangerButtonText: { color: "#ffb0bb", fontWeight: "700" },
  commentCard: { backgroundColor: "#0e1730", borderRadius: 8, padding: 8, borderWidth: 1, borderColor: "#1f2d5a" },
  commentBody: { color: "#e8edff" },
  commentMeta: { color: "#8fa4d6", fontSize: 12, marginTop: 4 }
});
