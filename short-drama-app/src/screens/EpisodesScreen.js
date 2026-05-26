import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function EpisodeRow({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.episodeTitle}>{item.title}</Text>
      <Text style={styles.episodeMeta}>{'\u70b9\u51fb\u64ad\u653e'}</Text>
    </TouchableOpacity>
  );
}

export default function EpisodesScreen({ navigation, route }) {
  const { drama } = route.params;

  const renderItem = ({ item }) => (
    <EpisodeRow
      item={item}
      onPress={() =>
        navigation.navigate('Player', {
          dramaTitle: drama.title,
          episode: item,
        })
      }
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{drama.title}</Text>
      <FlatList
        data={drama.episodes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b1f2a',
    marginBottom: 14,
  },
  listContent: {
    paddingBottom: 16,
  },
  separator: {
    height: 12,
  },
  row: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b1f2a',
    marginBottom: 6,
  },
  episodeMeta: {
    fontSize: 13,
    color: '#667085',
  },
});

