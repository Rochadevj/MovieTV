import { useLocalSearchParams } from 'expo-router';
import { StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const TrailerScreen = () => {
  const { videoKey, title } = useLocalSearchParams();

  if (!videoKey) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
        <StatusBar hidden />
        <Text style={{ color: 'white', fontSize: 18 }}>Trailer não disponível</Text>
        <Text style={{ color: 'gray', marginTop: 8 }}>{title}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar hidden />
      <WebView
        source={{ 
          uri: `https://www.youtube.com/embed/${videoKey}?autoplay=1&controls=1&modestbranding=1&rel=0`
        }}
        style={{ flex: 1 }}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState={true}
        allowsInlineMediaPlayback
        scrollEnabled={false}
      />
    </View>
  );
};

export default TrailerScreen;