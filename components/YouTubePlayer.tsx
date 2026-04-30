import type { StyleProp, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

const YOUTUBE_EMBED_ORIGIN = "https://movietv.local";

const getYouTubeHtml = (videoKey: string) => {
  const encodedVideoKey = encodeURIComponent(videoKey);
  const encodedOrigin = encodeURIComponent(YOUTUBE_EMBED_ORIGIN);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <style>
      html,
      body,
      iframe {
        height: 100%;
        margin: 0;
        padding: 0;
        width: 100%;
      }

      body {
        background: #030014;
        overflow: hidden;
      }

      iframe {
        border: 0;
        display: block;
      }
    </style>
  </head>
  <body>
    <iframe
      src="https://www.youtube.com/embed/${encodedVideoKey}?autoplay=1&controls=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodedOrigin}"
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen>
    </iframe>
  </body>
</html>`;
};

type YouTubePlayerProps = {
  videoKey: string;
  style?: StyleProp<ViewStyle>;
};

export function YouTubePlayer({ videoKey, style }: YouTubePlayerProps) {
  return (
    <WebView
      source={{
        html: getYouTubeHtml(videoKey),
        baseUrl: YOUTUBE_EMBED_ORIGIN,
      }}
      style={style}
      originWhitelist={["*"]}
      allowsFullscreenVideo
      javaScriptEnabled
      domStorageEnabled
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback
      scrollEnabled={false}
      setSupportMultipleWindows={false}
    />
  );
}
