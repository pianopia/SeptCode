import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { apiRequest } from "../../../src/lib/api";
import { PostCard } from "../../../src/components/PostCard";
import type { TimelinePost } from "../../../src/lib/types";
import { useAuth } from "../../../src/providers/AuthProvider";

type Profile = {
  id: number;
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string | null;
  profileLanguages: string[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  posts: TimelinePost[];
};

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    void (async () => {
      try {
        const data = await apiRequest<Profile>(`/users/id/${params.id}`, { token });
        setProfile(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "load_failed");
      }
    })();
  }, [params.id, token]);

  async function toggleFollow() {
    if (!token || !profile) return;
    await apiRequest(`/users/id/${profile.id}/follow`, { method: "POST", token });
    const refreshed = await apiRequest<Profile>(`/users/id/${profile.id}`, { token });
    setProfile(refreshed);
  }

  async function toggleLike(publicId: string) {
    if (!token || !profile) return;
    await apiRequest(`/posts/${publicId}/like`, { method: "POST", token });
    const refreshed = await apiRequest<Profile>(`/users/id/${profile.id}`, { token });
    setProfile(refreshed);
  }

  const avatarUrl = profile
    ? profile.avatarUrl && profile.avatarUrl.trim().length > 0
      ? profile.avatarUrl
      : `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(profile.handle)}`
    : "";
  const profileLanguages = Array.isArray(profile?.profileLanguages) ? profile.profileLanguages : [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {!!error && <Text style={styles.error}>{error}</Text>}
        {profile && (
          <View style={styles.card}>
            <View style={styles.head}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              <View style={styles.headText}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.handle}>@{profile.handle}</Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {profile.followerCount} followers / {profile.followingCount} following
            </Text>
            <Text style={styles.bio}>{profile.bio || "自己紹介は未設定です。"}</Text>
            <View style={styles.languageRow}>
              {profileLanguages.length > 0 ? (
                profileLanguages.map((lang) => (
                  <Text key={lang} style={styles.languageChip}>
                    {lang}
                  </Text>
                ))
              ) : (
                <Text style={styles.languageEmpty}>扱う言語は未設定です。</Text>
              )}
            </View>
            {token && user?.id !== profile.id && (
              <Pressable style={styles.button} onPress={() => void toggleFollow()}>
                <Text style={styles.buttonText}>{profile.isFollowing ? "フォロー中" : "フォローする"}</Text>
              </Pressable>
            )}
            {!token && <Text style={styles.loginNote}>フォローするにはログインが必要です。</Text>}
          </View>
        )}

        {profile && (
          <View style={styles.postSection}>
            <Text style={styles.postTitle}>投稿</Text>
            {profile.posts.map((post) => (
              <PostCard key={post.publicId} post={post} onToggleLike={toggleLike} />
            ))}
            {profile.posts.length === 0 && <Text style={styles.postEmpty}>投稿はまだありません。</Text>}
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
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  headText: { gap: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: "#1f2d5a", backgroundColor: "#0a0f1d" },
  name: { color: "#edf3ff", fontSize: 22, fontWeight: "700" },
  handle: { color: "#6efacb" },
  meta: { color: "#9fb3e5" },
  bio: { color: "#e8edff" },
  languageRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  languageChip: {
    color: "#c8d6fb",
    borderWidth: 1,
    borderColor: "#334980",
    borderRadius: 999,
    fontSize: 11,
    paddingHorizontal: 7,
    paddingVertical: 2
  },
  languageEmpty: { color: "#7f92c4", fontSize: 12 },
  button: { backgroundColor: "#22396e", borderRadius: 8, alignItems: "center", paddingVertical: 10, marginTop: 8 },
  buttonText: { color: "#dce6ff", fontWeight: "700" },
  loginNote: { color: "#8fa4d6", marginTop: 4 },
  postSection: { marginTop: 12, gap: 8 },
  postTitle: { color: "#edf3ff", fontWeight: "700", fontSize: 18 },
  postEmpty: { color: "#8fa4d6" }
});
