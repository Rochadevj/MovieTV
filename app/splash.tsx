import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();

  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
  
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.02;
        if (next >= 1) clearInterval(interval);
        return next >= 1 ? 1 : next;
      });
    }, 60);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    const timeout = setTimeout(() => {
      router.replace("/(tabs)");
    }, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <LottieView
        source={require("@/assets/animations/MKAqlxo29g.json")}
        autoPlay
        loop
        style={styles.lottie}
      />

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
    backgroundColor: "#0f0d23",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  text: {
    color: "#00FFF7",
    fontSize: 16,
    marginTop: 12,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  progressContainer: {
    height: 8,
    width: "100%",
    backgroundColor: "#22223B",
    borderRadius: 10,
    marginTop: 24,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#00FFF7",
    borderRadius: 10,
  },
});
