import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/providers/AuthProvider";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    setLoading(true);
    setError("");
    try {
      await register({ name, handle, email, password });
      router.replace("/(tabs)/timeline");
    } catch (e) {
      setError(e instanceof Error ? e.message : "register_failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>アカウント作成</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TextInput value={name} onChangeText={setName} placeholder="表示名" placeholderTextColor="#778" style={styles.input} />
        <TextInput value={handle} onChangeText={setHandle} autoCapitalize="none" placeholder="handle" placeholderTextColor="#778" style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="Email" placeholderTextColor="#778" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor="#778" style={styles.input} />
        <Pressable onPress={onRegister} style={styles.button} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "送信中..." : "登録"}</Text>
        </Pressable>
        <Link href="/(auth)/login" style={styles.link}>
          ログインへ戻る
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0f1d" },
  container: { flex: 1, justifyContent: "center", gap: 12, padding: 20 },
  title: { color: "#e8edff", fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  error: { color: "#ff9e9e", textAlign: "center" },
  input: { backgroundColor: "#111931", borderColor: "#1e2955", borderWidth: 1, borderRadius: 10, color: "#e8edff", paddingHorizontal: 12, paddingVertical: 10 },
  button: { backgroundColor: "#4de8b8", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  buttonText: { color: "#071018", fontWeight: "700" },
  link: { color: "#74b8ff", textAlign: "center", marginTop: 8 }
});
