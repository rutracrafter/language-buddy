import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LanguagePickerModalProps {
  visible: boolean;
  title: string;
  selectedLanguage: string;
  languages: string[];
  onSelect: (lang: string) => void;
  onClose: () => void;
}

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  visible,
  title,
  selectedLanguage,
  languages,
  onSelect,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {languages.map((lang) => {
              const isSelected = lang === selectedLanguage;
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => {
                    onSelect(lang);
                    onClose();
                  }}
                  style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                >
                  <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                    {lang}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '65%',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  itemRowSelected: {
    backgroundColor: '#1e293b',
  },
  itemText: {
    fontSize: 15,
    color: '#cbd5e1',
  },
  itemTextSelected: {
    color: '#34d399',
    fontWeight: '700',
  },
});
