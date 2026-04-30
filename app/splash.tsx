import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    const timeout = setTimeout(() => {
      router.replace("/(tabs)");
    }, 3200);

    return () => {
      clearTimeout(timeout);
    };
  }, [progressAnim, router]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />
      <LottieView
        source={require("@/assets/animations/MKAqlxo29g.json")}
        autoPlay
        loop
        style={styles.lottie}
      />

      <Text style={styles.title}>MovieTV</Text>
      <Text style={styles.text}>Luz, câmera... carregando!</Text>

      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030014",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  orbTop: {
    position: "absolute",
    top: -90,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(171, 139, 255, 0.22)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -100,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: "rgba(0, 255, 247, 0.10)",
  },
  lottie: {
    width: 220,
    height: 220,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: 1.2,
  },
  text: {
    color: "#D6C7FF",
    fontSize: 16,
    marginTop: 10,
    fontWeight: "700",
  },
  progressContainer: {
    height: 10,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    marginTop: 28,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#AB8BFF",
    borderRadius: 999,
  },
});
