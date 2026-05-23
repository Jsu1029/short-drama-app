import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import dramas from '../data/dramas';

function DramaCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <Image source={item.cover} style={styles.cover} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {'\u70b9\u51fb\u8fdb\u5165\u64ad\u653e\u9875'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <DramaCard
      item={item}
      onPress={() => navigation.navigate('Player', { drama: item })}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={dramas}
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
  },
  listContent: {
    padding: 16,
  },
  separator: {
    height: 14,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cover: {
    width: 120,
    height: 160,
    backgroundColor: '#dfe6f2',
  },
  info: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1f2a',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: '#667085',
  },
});


// import { View, Text } from "react-native";

// export default function HomeScreen() {
//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Text>首页正常了</Text>
//     </View>
//   );
// }