import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { TimelinePost } from "../lib/types";

export function PostCard({
  post,
  onToggleLike
}: {
  post: TimelinePost;
  onToggleLike: (publicId: string) => Promise<void>;
}) {
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(post.authorHandle)}`;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.authorRow}>
          <Link href={`/(tabs)/user/${post.authorId}`} asChild>
            <Pressable>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            </Pressable>
          </Link>
          <Link href={`/(tabs)/user/${post.authorId}`} style={styles.author}>
            @{post.authorHandle}
          </Link>
        </View>
        <Text style={styles.language}>{post.language}</Text>
      </View>
      <Text style={styles.premise}>{post.premise1}</Text>
      <Text style={styles.premise}>{post.premise2}</Text>
      <View style={styles.codeBox}>
        <Text style={styles.codeText}>{post.code}</Text>
      </View>
      <View style={styles.tagRow}>
        <Text style={styles.version}>{post.version ?? "latest"}</Text>
        {post.tags.map((tag) => (
          <Text key={tag} style={styles.tag}>
            #{tag}
          </Text>
        ))}
      </View>
      <View style={styles.actionRow}>
        <Pressable onPress={() => void onToggleLike(post.publicId)}>
          <Text style={styles.action}>{post.likedByMe ? `♥ ${post.likeCount}` : `♡ ${post.likeCount}`}</Text>
        </Pressable>
        <Link href={`/post/${post.publicId}`} style={styles.action}>
          💬 {post.commentCount}
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111931",
    borderColor: "#1f2d5a",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: "#1f2d5a", backgroundColor: "#0a0f1d" },
  author: { color: "#cde7ff", fontWeight: "700" },
  language: { color: "#87d9ff", fontSize: 12 },
  premise: { color: "#d4dcf8", fontSize: 13 },
  codeBox: { backgroundColor: "#0a0f1d", borderRadius: 10, borderWidth: 1, borderColor: "#1f2d5a", padding: 10 },
  codeText: { color: "#bde9ff", fontFamily: "monospace", fontSize: 12 },
  tagRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  version: { color: "#6efacb", fontSize: 12 },
  tag: { color: "#9fb3e5", fontSize: 12 },
  actionRow: { flexDirection: "row", gap: 14 },
  action: { color: "#d2defd", fontSize: 13 }
});
