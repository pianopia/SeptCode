import { useEffect, useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiRequest } from "../../src/lib/api";
import type { AuthUser } from "../../src/lib/types";
import { useAuth } from "../../src/providers/AuthProvider";
import { useRouter } from "expo-router";

export default function MeScreen() {
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileLanguages, setProfileLanguages] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const me = await apiRequest<AuthUser>("/auth/me", { token });
        setProfile(me);
        setName(me.name ?? "");
        setBio(me.bio ?? "");
        setProfileLanguages((me.profileLanguages ?? []).join(", "));
        setAvatarUrl(me.avatarUrl ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "load_failed");
      }
    })();
  }, [token]);

  async function onLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  async function onSaveProfile() {
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const next = await apiRequest<AuthUser>("/users/me", {
        method: "PATCH",
        token,
        body: {
          name,
          bio,
          profileLanguages,
          avatarUrl
        }
      });
      setProfile(next);
      setName(next.name ?? "");
      setBio(next.bio ?? "");
      setProfileLanguages((next.profileLanguages ?? []).join(", "));
      setAvatarUrl(next.avatarUrl ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "update_profile_failed");
    } finally {
      setSaving(false);
    }
  }

  const fallbackAvatarSeed = profile?.handle ?? user?.handle ?? "guest";
  const resolvedAvatarUrl =
    profile?.avatarUrl && profile.avatarUrl.trim().length > 0
      ? profile.avatarUrl
      : `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(fallbackAvatarSeed)}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
        {!token ? (
          <>
            <Text style={styles.name}>ゲスト</Text>
            <Text style={styles.email}>ログインするとプロフィール編集や投稿ができます。</Text>
            <Pressable style={styles.button} onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.buttonText}>ログイン</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Image source={{ uri: resolvedAvatarUrl }} style={styles.avatar} />
            <Text style={styles.handle}>@{profile?.handle ?? "-"}</Text>
            <Text style={styles.name}>{profile?.name ?? "-"}</Text>
            <Text style={styles.email}>{profile?.email ?? "-"}</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="表示名" placeholderTextColor="#778" />
            <TextInput
              style={[styles.input, styles.multiline]}
              value={bio}
              onChangeText={setBio}
              placeholder="自己紹介"
              placeholderTextColor="#778"
              multiline
            />
            <TextInput
              style={styles.input}
              value={profileLanguages}
              onChangeText={setProfileLanguages}
              placeholder="扱う言語 (comma separated)"
              placeholderTextColor="#778"
            />
            <TextInput
              style={styles.input}
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              placeholder="avatar URL (optional)"
              placeholderTextColor="#778"
              autoCapitalize="none"
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.button} onPress={() => void onSaveProfile()} disabled={saving}>
              <Text style={styles.buttonText}>{saving ? "保存中..." : "プロフィール保存"}</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => void onLogout()}>
              <Text style={styles.buttonText}>ログアウト</Text>
            </Pressable>
          </>
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f1d" },
  content: { padding: 14 },
  card: { backgroundColor: "#111931", borderWidth: 1, borderColor: "#1f2d5a", borderRadius: 12, padding: 14, gap: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: "#1f2d5a", backgroundColor: "#0a0f1d", alignSelf: "center" },
  handle: { color: "#6efacb", fontWeight: "700", fontSize: 18 },
  name: { color: "#edf3ff", fontSize: 24, fontWeight: "700" },
  email: { color: "#aabbe6" },
  input: { backgroundColor: "#0e1730", borderWidth: 1, borderColor: "#1f2d5a", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: "#e8edff" },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  error: { color: "#ff9e9e" },
  button: { marginTop: 8, backgroundColor: "#22396e", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  buttonText: { color: "#dce6ff", fontWeight: "700" }
});
