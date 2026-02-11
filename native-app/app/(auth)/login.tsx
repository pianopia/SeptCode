import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View, Image } from "react-native";
import { useAuth } from "../../src/providers/AuthProvider";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.replace("/(tabs)/timeline");
    } catch (e) {
      setError(e instanceof Error ? e.message : "login_failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image source={require("../../assets/icon.png")} style={styles.logo} />
        <Text style={styles.title}>SeptCode</Text>
        <Text style={styles.subtitle}>ログイン</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="Email" placeholderTextColor="#778" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor="#778" style={styles.input} />
        <Pressable onPress={onLogin} style={styles.button} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "送信中..." : "ログイン"}</Text>
        </Pressable>
        <Link href="/(auth)/register" style={styles.link}>
          新規登録へ
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f1d" },
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 20 },
  logo: { width: 100, height: 100, marginBottom: 20 },
  title: { color: "#7cf8d5", fontSize: 40, fontWeight: "800", textAlign: "center" },
  subtitle: { color: "#cfe", fontSize: 20, textAlign: "center", marginBottom: 8 },
  error: { color: "#ff9e9e", textAlign: "center" },
  input: { backgroundColor: "#111931", borderColor: "#1e2955", borderWidth: 1, borderRadius: 10, color: "#e8edff", paddingHorizontal: 12, paddingVertical: 10 },
  button: { backgroundColor: "#4de8b8", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  buttonText: { color: "#071018", fontWeight: "700" },
  link: { color: "#74b8ff", textAlign: "center", marginTop: 8 }
});
