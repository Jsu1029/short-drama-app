import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEvent } from 'expo';
import {
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { getHighlightsByEpisodeId } from '../data/highlights';
import { getInteractionsByEpisodeId } from '../data/interactions';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function clamp01(value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

const HIGHLIGHT_THEMES = {
  爽: {
    color: '#FF4D00',
    bg: 'rgba(255,77,0,0.25)',
    iconAsset: require('../../assets/icons/shuang.png'),
    danmakuAsset: require('../../assets/icons/shuang.png'),
    iconFallback: '😤',
    particle: '🔥',
    motion: 'bounce',
  },
  反转: {
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.25)',
    iconAsset: require('../../assets/icons/fanzhuan.png'),
    danmakuAsset: require('../../assets/icons/fanzhuan.png'),
    iconFallback: '🔄',
    particle: '❓',
    motion: 'rotate',
  },
  名场面: {
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.25)',
    iconAsset: require('../../assets/icons/mingchangmian.png'),
    danmakuAsset: require('../../assets/icons/mingchangmian.png'),
    iconFallback: '⭐️',
    particle: '⭐️',
    motion: 'breathe',
  },
  撒糖: {
    color: '#F472B6',
    bg: 'rgba(244,114,182,0.25)',
    iconAsset: require('../../assets/icons/satang.png'),
    danmakuAsset: require('../../assets/icons/satang.png'),
    iconFallback: '🍬',
    particle: '💗',
    motion: 'float',
  },
};

const ENABLE_LOCAL_ICON_ASSETS = true;

export default function PlayerScreen({ route }) {
  const { dramaTitle, episode } = route.params;
  const { width, height } = useWindowDimensions();
  const [trackWidth, setTrackWidth] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubProgress, setScrubProgress] = useState(0);
  const [dismissedHighlightIds, setDismissedHighlightIds] = useState({});
  const [comboCounts, setComboCounts] = useState({});
  const [burstItems, setBurstItems] = useState([]);
  const [danmakuItems, setDanmakuItems] = useState([]);
  const [activeChoice, setActiveChoice] = useState(null);
  const [choiceResults, setChoiceResults] = useState({});
  const [iconErrorByType, setIconErrorByType] = useState({});
  const scrubProgressRef = useRef(0);
  const scrubStartXRef = useRef(0);
  const wasPlayingRef = useRef(false);
  const comboTimerRef = useRef(null);
  const burstIdRef = useRef(0);
  const danmakuIdRef = useRef(0);
  const choiceWasPlayingRef = useRef(false);
  const shownChoiceIdsRef = useRef({});
  const iconScale = useRef(new Animated.Value(1)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const iconTranslateY = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(1)).current;
  const tapIconOpacity = useRef(new Animated.Value(0)).current;
  const tapIconScale = useRef(new Animated.Value(0.92)).current;
  const tapIconTimerRef = useRef(null);

  const player = useVideoPlayer(episode.video, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.timeUpdateEventInterval = 0.25;
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });
  const { currentTime } = useEvent(player, 'timeUpdate', { currentTime: 0 });
  const { duration } = useEvent(player, 'sourceLoad', { duration: 0 });

  const handleTogglePlayback = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleVideoTap = () => {
    if (activeChoice) return;
    handleTogglePlayback();
    if (tapIconTimerRef.current) clearTimeout(tapIconTimerRef.current);
    tapIconOpacity.stopAnimation();
    tapIconScale.stopAnimation();
    tapIconOpacity.setValue(1);
    tapIconScale.setValue(1);
    tapIconTimerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(tapIconOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(tapIconScale, {
          toValue: 0.92,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 520);
  };

  const highlights = useMemo(() => getHighlightsByEpisodeId(episode.id), [episode.id]);
  const interactions = useMemo(
    () => getInteractionsByEpisodeId(episode.id),
    [episode.id]
  );
  const activeHighlight = useMemo(() => {
    if (!highlights.length) return null;
    const t = isScrubbing ? scrubProgress * (duration || 0) : currentTime;
    return (
      highlights.find((item) => t >= item.startSec && t <= item.endSec) ??
      null
    );
  }, [currentTime, duration, highlights, isScrubbing, scrubProgress]);

  const visibleHighlight = useMemo(() => {
    if (!activeHighlight) return null;
    if (dismissedHighlightIds[activeHighlight.id]) return null;
    return activeHighlight;
  }, [activeHighlight, dismissedHighlightIds]);

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const displayProgress = isScrubbing ? scrubProgress : progress;
  const videoHeight = Math.min(width * (16 / 9), Math.max(260, height * 0.62));
  const highlightTop = Math.max(16, Math.floor(videoHeight * 0.18));

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          if (!trackWidth || duration <= 0) return;
          wasPlayingRef.current = isPlaying;
          if (isPlaying) player.pause();

          const x = evt.nativeEvent.locationX;
          const next = clamp01(x / trackWidth);
          scrubStartXRef.current = next * trackWidth;
          scrubProgressRef.current = next;
          setScrubProgress(next);
          setIsScrubbing(true);
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (!trackWidth || duration <= 0) return;
          const x = scrubStartXRef.current + gestureState.dx;
          const next = clamp01(x / trackWidth);
          scrubProgressRef.current = next;
          setScrubProgress(next);
        },
        onPanResponderRelease: () => {
          if (!trackWidth || duration <= 0) {
            setIsScrubbing(false);
            return;
          }
          const next = scrubProgressRef.current;
          player.currentTime = next * duration;
          setIsScrubbing(false);
          if (wasPlayingRef.current) player.play();
        },
        onPanResponderTerminate: () => {
          setIsScrubbing(false);
        },
      }),
    [duration, isPlaying, player, trackWidth]
  );

  useEffect(() => {
    return () => {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      if (tapIconTimerRef.current) clearTimeout(tapIconTimerRef.current);
    };
  }, []);

  useEffect(() => {
    shownChoiceIdsRef.current = {};
    setActiveChoice(null);
    setChoiceResults({});
  }, [episode.id]);

  useEffect(() => {
    if (!interactions.length) return;
    if (activeChoice) return;
    if (isScrubbing) return;
    if (duration <= 0) return;

    const candidate = interactions.find(
      (it) =>
        it.type === 'choice' &&
        currentTime >= it.atSec &&
        !shownChoiceIdsRef.current[it.id]
    );
    if (!candidate) return;

    shownChoiceIdsRef.current[candidate.id] = true;
    choiceWasPlayingRef.current = isPlaying;
    player.pause();
    setActiveChoice(candidate);
  }, [activeChoice, currentTime, duration, interactions, isPlaying, isScrubbing, player]);

  const theme = useMemo(() => {
    const key = visibleHighlight?.type;
    return HIGHLIGHT_THEMES[key] ?? null;
  }, [visibleHighlight?.type]);

  useEffect(() => {
    iconScale.stopAnimation();
    iconRotate.stopAnimation();
    iconTranslateY.stopAnimation();
    iconOpacity.stopAnimation();
    iconScale.setValue(1);
    iconRotate.setValue(0);
    iconTranslateY.setValue(0);
    iconOpacity.setValue(1);

    if (!visibleHighlight || !theme) return;

    if (theme.motion === 'bounce') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconScale, {
            toValue: 1.08,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(iconScale, {
            toValue: 1,
            duration: 180,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(260),
        ])
      ).start();
      return;
    }

    if (theme.motion === 'rotate') {
      Animated.loop(
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      return;
    }

    if (theme.motion === 'breathe') {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(iconScale, {
              toValue: 1.08,
              duration: 900,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(iconOpacity, {
              toValue: 0.88,
              duration: 900,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(iconScale, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(iconOpacity, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
      return;
    }

    if (theme.motion === 'float') {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(iconScale, {
              toValue: 1.06,
              duration: 420,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(iconTranslateY, {
              toValue: -2,
              duration: 420,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(iconScale, {
              toValue: 1,
              duration: 420,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(iconTranslateY, {
              toValue: 0,
              duration: 420,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(240),
        ])
      ).start();
    }
  }, [Easing, iconOpacity, iconRotate, iconScale, iconTranslateY, theme, visibleHighlight]);

  const triggerBurst = (
    particleText,
    particleColor,
    particleBg,
    durationMs = 650,
    count = 8
  ) => {
    const baseRight = 22;
    const baseTop = highlightTop + 6;

    const items = Array.from({ length: count }).map((_, idx) => {
      const id = `b-${burstIdRef.current++}-${idx}`;
      const anim = new Animated.Value(0);
      const dx = -Math.round(18 + Math.random() * 70);
      const dy = -Math.round(10 + Math.random() * 120);
      const scale = 0.92 + Math.random() * 0.25;
      return {
        id,
        anim,
        dx,
        dy,
        scale,
        particleText,
        particleColor,
        particleBg,
        baseRight,
        baseTop,
      };
    });

    setBurstItems((prev) => [...prev, ...items]);

    items.forEach((item) => {
      Animated.timing(item.anim, {
        toValue: 1,
        duration: durationMs,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setBurstItems((prev) => prev.filter((x) => x.id !== item.id));
      });
    });
  };

  const triggerDanmaku = (asset) => {
    const id = `d-${danmakuIdRef.current++}`;
    const anim = new Animated.Value(0);
    const baseRight = 16;
    const baseTop = highlightTop + 84;
    const rotate = (Math.random() * 10 - 5).toFixed(2);

    const item = { id, anim, baseRight, baseTop, asset, rotate };
    setDanmakuItems((prev) => [...prev, item]);

    Animated.timing(anim, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setDanmakuItems((prev) => prev.filter((x) => x.id !== id));
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {dramaTitle}
      </Text>
      <Text style={styles.episodeTitle}>{episode.title}</Text>

      <View style={[styles.videoWrap, { height: videoHeight }]}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          allowsFullscreen
          nativeControls={false}
        />

        <Pressable style={styles.videoTapLayer} onPress={handleVideoTap} />

        <View style={styles.tapIconLayer} pointerEvents="none">
          <Animated.View
            style={[
              styles.tapIconBadge,
              {
                opacity: tapIconOpacity,
                transform: [{ scale: tapIconScale }],
              },
            ]}
          >
            <Text style={styles.tapIconText}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
          </Animated.View>
        </View>

        <View style={styles.danmakuLayer} pointerEvents="none">
          {danmakuItems.map((item) => {
            const opacity = item.anim.interpolate({
              inputRange: [0, 0.15, 0.85, 1],
              outputRange: [0, 1, 1, 0],
            });
            const translateY = item.anim.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            });
            const scale = item.anim.interpolate({
              inputRange: [0, 0.18, 1],
              outputRange: [0.92, 1.06, 1],
            });

            return (
              <Animated.Image
                key={item.id}
                source={item.asset}
                resizeMode="contain"
                style={[
                  styles.danmakuSticker,
                  { right: item.baseRight, top: item.baseTop },
                  {
                    opacity,
                    transform: [
                      { translateY },
                      { scale },
                      { rotate: `${item.rotate}deg` },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.burstLayer} pointerEvents="none">
          {burstItems.map((item) => {
            const translateX = item.anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, item.dx],
            });
            const translateY = item.anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, item.dy],
            });
            const opacity = item.anim.interpolate({
              inputRange: [0, 0.75, 1],
              outputRange: [0, 1, 0],
            });

            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.burstItem,
                  { right: item.baseRight, top: item.baseTop },
                  item.particleBg ? { backgroundColor: item.particleBg } : null,
                  {
                    opacity,
                    transform: [
                      { translateX },
                      { translateY },
                      { scale: item.scale },
                    ],
                  },
                ]}
              >
                <Text style={[styles.burstText, item.particleColor ? { color: item.particleColor } : null]}>
                  {item.particleText}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        {!!visibleHighlight && (
          <View style={[styles.highlightFloat, { top: highlightTop }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.highlightClose}
              onPress={() => {
                setDismissedHighlightIds((prev) => ({
                  ...prev,
                  [visibleHighlight.id]: true,
                }));
              }}
            >
              <Text style={styles.highlightCloseText}>{'\u00d7'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.highlightCircle,
                theme
                  ? {
                      backgroundColor: theme.bg,
                      borderColor: theme.color,
                    }
                  : null,
              ]}
              onPress={() => {
                const highlightId = visibleHighlight.id;
                setComboCounts((prev) => ({
                  ...prev,
                  [highlightId]: (prev[highlightId] ?? 0) + 1,
                }));

                const particleText = theme?.particle || visibleHighlight.stickerText || visibleHighlight.type;
                const particleColor = theme?.color || '#4f46e5';
                const particleBg = 'rgba(255,255,255,0.92)';
                const durationMs =
                  visibleHighlight.type === '爽'
                    ? 300
                    : visibleHighlight.type === '反转'
                      ? 650
                      : visibleHighlight.type === '名场面'
                        ? 850
                        : 750;
                const count =
                  visibleHighlight.type === '名场面'
                    ? 10
                    : visibleHighlight.type === '爽'
                      ? 9
                      : 8;
                triggerBurst(particleText, particleColor, particleBg, durationMs, count);
                if (theme?.danmakuAsset) triggerDanmaku(theme.danmakuAsset);

                if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
                comboTimerRef.current = setTimeout(() => {
                  setComboCounts((prev) => ({ ...prev, [highlightId]: 0 }));
                }, 1100);
              }}
            >
              <Animated.View
                style={[
                  {
                    opacity: iconOpacity,
                    transform: [
                      { scale: iconScale },
                      { translateY: iconTranslateY },
                      {
                        rotate: iconRotate.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {ENABLE_LOCAL_ICON_ASSETS &&
                theme?.iconAsset &&
                !iconErrorByType[visibleHighlight.type] ? (
                  <Image
                    source={theme.iconAsset}
                    style={styles.highlightIcon}
                    resizeMode="contain"
                    onError={() =>
                      setIconErrorByType((prev) => ({
                        ...prev,
                        [visibleHighlight.type]: true,
                      }))
                    }
                  />
                ) : (
                  <Text style={[styles.highlightCircleText, theme ? { color: theme.color } : null]}>
                    {theme?.iconFallback || visibleHighlight.stickerText || visibleHighlight.type}
                  </Text>
                )}
              </Animated.View>
            </TouchableOpacity>

            <View style={styles.highlightInfo}>
              <Text style={styles.highlightTitle} numberOfLines={1}>
                {visibleHighlight.title || visibleHighlight.type}
              </Text>
              <Text style={styles.highlightSubtitle} numberOfLines={2}>
                {visibleHighlight.subtitle || ''}
              </Text>
            </View>

            {(comboCounts[visibleHighlight.id] ?? 0) > 1 && (
              <View style={styles.comboBadge} pointerEvents="none">
                <Text style={styles.comboText}>
                  {'x '}
                  {comboCounts[visibleHighlight.id]}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.progressWrap}>
        <View
          style={styles.progressTrackWrap}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          {...panResponder.panHandlers}
        >
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${displayProgress * 100}%` }]} />
          </View>
          <View
            style={[
              styles.progressThumb,
              { left: Math.max(0, Math.min(trackWidth, trackWidth * displayProgress)) - 7 },
            ]}
          />
        </View>
        <View style={styles.progressMeta}>
          <Text style={styles.timeText}>
            {formatTime((isScrubbing ? scrubProgress : progress) * (duration || 0))}
          </Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <Modal transparent visible={!!activeChoice} animationType="fade">
        <View style={styles.choiceBackdrop}>
          <View style={styles.choiceCard}>
            <View style={styles.choiceHeader}>
              <Pressable
                style={styles.choiceClose}
                onPress={() => {
                  setActiveChoice(null);
                  if (choiceWasPlayingRef.current) player.play();
                }}
              >
                <Text style={styles.choiceCloseText}>{'\u00d7'}</Text>
              </Pressable>
            </View>

            <Text style={styles.choiceTitle}>{activeChoice?.title}</Text>

            <View style={styles.choiceOptions}>
              {(activeChoice?.options ?? []).map((opt) => (
                <Pressable
                  key={opt.id}
                  style={styles.choiceOptionBtn}
                  onPress={() => {
                    setChoiceResults((prev) => ({
                      ...prev,
                      [activeChoice.id]: opt.id,
                    }));
                    setActiveChoice(null);
                    if (choiceWasPlayingRef.current) player.play();
                  }}
                >
                  <Text style={styles.choiceOptionText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

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
    marginBottom: 6,
  },
  episodeTitle: {
    fontSize: 14,
    color: '#667085',
    marginBottom: 16,
  },
  videoWrap: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoTapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  tapIconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(17,24,39,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapIconText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
  },
  burstLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  danmakuLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  danmakuSticker: {
    position: 'absolute',
    width: 160,
    height: 90,
  },
  burstItem: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  burstText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4f46e5',
  },
  highlightFloat: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
  },
  highlightClose: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(17,24,39,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  highlightCloseText: {
    fontSize: 18,
    lineHeight: 18,
    color: '#ffffff',
  },
  highlightCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  highlightCircleText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4f46e5',
  },
  highlightIcon: {
    width: 44,
    height: 44,
  },
  highlightInfo: {
    marginTop: 10,
    width: 120,
    alignItems: 'center',
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  highlightSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 14,
  },
  comboBadge: {
    position: 'absolute',
    right: 78,
    top: 58,
    backgroundColor: 'rgba(17,24,39,0.68)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  comboText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  progressWrap: {
    marginTop: 12,
  },
  progressTrackWrap: {
    height: 26,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d0d6e0',
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2f80ed',
  },
  progressThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2f80ed',
    top: 6,
  },
  progressMeta: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#667085',
  },
  choiceBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  choiceCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#f3f1ff',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.35)',
  },
  choiceHeader: {
    height: 44,
    backgroundColor: 'rgba(124,58,237,0.25)',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  choiceClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  choiceCloseText: {
    fontSize: 18,
    lineHeight: 18,
    color: '#111827',
  },
  choiceTitle: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  choiceOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  choiceOptionBtn: {
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.18)',
  },
  choiceOptionText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
});
