import { useState, useEffect } from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/theme';

interface ReceiptViewerProps {
  visible: boolean;
  receiptUrl: string;
  onClose: () => void;
}

export function ReceiptViewer({ visible, receiptUrl, onClose }: ReceiptViewerProps) {
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (visible) {
      // Small delay to ensure safe area insets are calculated
      const timer = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType='fade'
      onRequestClose={onClose}
      statusBarTranslucent={false}>
      <View style={styles.container}>
        <StatusBar style='light' />
        <View style={[styles.header, { paddingTop: isReady ? insets.top + 12 : 60 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name='close' size={32} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: receiptUrl }}
            style={styles.image}
            resizeMode='contain'
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[900],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.gray[900],
  },
  closeButton: {
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
