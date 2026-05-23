import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

export default function PlayerScreen({ route }) {
  const { drama } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);

  const player = useVideoPlayer(drama.video, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  const handleTogglePlayback = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{drama.title}</Text>

      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        allowsFullscreen
        nativeControls={false}
      />

      <View style={styles.buttonWrap}>
        <Button
          title={isPlaying ? '\u6682\u505c' : '\u64ad\u653e'}
          onPress={handleTogglePlayback}
        />
      </View>

      <Text style={styles.pathText}>
        {'\u89c6\u9891\u6765\u6e90\uff1a'}
        {drama.originalVideoPath}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1b1f2a',
    marginBottom: 16,
  },
  video: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonWrap: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  pathText: {
    marginTop: 18,
    fontSize: 12,
    color: '#667085',
    lineHeight: 18,
  },
});
