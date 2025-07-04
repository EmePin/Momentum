import React from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';

const BoltBadge: React.FC = () => {
  const handlePress = () => {
    Linking.openURL('https://bolt.new/?rid=os72mi');
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
      >
        <Image
          source={{
            uri: 'https://storage.bolt.army/logotext_poweredby_360w.png',
          }}
          style={styles.image}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignItems: 'center',
    padding: 30,
  },
  image: {
    height: Platform.OS === 'web' ? 40 : 32, // como en @media min-width 768px
    width: 180,
    opacity: 0.9,
  },
});

export default BoltBadge;
