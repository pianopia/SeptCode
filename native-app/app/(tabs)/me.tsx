import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { apiRequest } from "../../src/lib/api";
import type { AuthUser } from "../../src/lib/types";
import { useAuth } from "../../src/providers/AuthProvider";
import { useRouter } from "expo-router";

export default function MeScreen() {
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const me = await apiRequest<AuthUser>("/auth/me", { token });
        setProfile(me);
      } catch (e) {
        setError(e instanceof Error ? e.message : "load_failed");
      }
    })();
  }, [token]);

  async function onLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={styles.safe}>
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
            <Text style={styles.handle}>@{profile?.handle ?? "-"}</Text>
            <Text style={styles.name}>{profile?.name ?? "-"}</Text>
            <Text style={styles.email}>{profile?.email ?? "-"}</Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.button} onPress={() => void onLogout()}>
              <Text style={styles.buttonText}>ログアウト</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f1d", padding: 14 },
  card: { backgroundColor: "#111931", borderWidth: 1, borderColor: "#1f2d5a", borderRadius: 12, padding: 14, gap: 8 },
  handle: { color: "#6efacb", fontWeight: "700", fontSize: 18 },
  name: { color: "#edf3ff", fontSize: 24, fontWeight: "700" },
  email: { color: "#aabbe6" },
  error: { color: "#ff9e9e" },
  button: { marginTop: 8, backgroundColor: "#22396e", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  buttonText: { color: "#dce6ff", fontWeight: "700" }
});
