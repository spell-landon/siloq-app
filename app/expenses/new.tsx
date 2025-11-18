import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth';
import { DatePicker } from '@/components/DatePicker';
import {
  validateRequired,
  validatePositiveNumber,
  enforcePositiveNumber,
} from '@/lib/validation';
import { COLORS } from '@/lib/theme';

const EXPENSE_CATEGORIES = [
  'Meals',
  'Travel',
  'Office',
  'Supplies',
  'Utilities',
  'Software',
  'Equipment',
  'Marketing',
  'Professional Services',
  'Other',
];

export default function NewExpenseScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);

  // Form fields
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTaxDeductible, setIsTaxDeductible] = useState(true);
  const [notes, setNotes] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: any) => {
    switch (field) {
      case 'merchant':
        if (!validateRequired(value)) {
          return 'Merchant name is required';
        }
        break;
      case 'amount':
        if (!value || value.trim() === '') {
          return 'Amount is required';
        }
        if (!validatePositiveNumber(value)) {
          return 'Amount must be greater than 0';
        }
        break;
      case 'date':
        if (!validateRequired(value)) {
          return 'Date is required';
        }
        break;
    }
    return '';
  };

  const handleFieldBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(
      field,
      field === 'merchant'
        ? merchant
        : field === 'amount'
          ? amount
          : field === 'date'
            ? date
            : ''
    );
    setErrors({ ...errors, [field]: error });
  };

  const handleMerchantChange = (value: string) => {
    setMerchant(value);
    if (touched.merchant) {
      const error = validateField('merchant', value);
      setErrors({ ...errors, merchant: error });
    }
  };

  const handleAmountChange = (value: string) => {
    // Enforce positive numbers only
    const sanitized = enforcePositiveNumber(value);
    setAmount(sanitized);
    if (touched.amount) {
      const error = validateField('amount', sanitized);
      setErrors({ ...errors, amount: error });
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera permission is required to take photos');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
          exif: false,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Photo library permission is required');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
          exif: false,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setReceiptImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Receipt Photo',
      'Choose how to add your receipt',
      [
        {
          text: 'Take Photo',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Choose from Library',
          onPress: () => pickImage('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const uploadReceipt = async (imageUri: string): Promise<string | null> => {
    if (!user) return null;

    try {
      setUploadingReceipt(true);

      // Generate unique filename
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Read the image file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // Decode base64 to binary for upload
      const decode = (str: string): Uint8Array => {
        const binary = atob(str);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      };

      const arrayBuffer = decode(base64);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      console.log('Receipt uploaded successfully. Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      throw error;
    } finally {
      setUploadingReceipt(false);
    }
  };

  const removeReceipt = () => {
    Alert.alert(
      'Remove Receipt',
      'Are you sure you want to remove this receipt photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setReceiptImage(null),
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate all fields
    const merchantError = validateField('merchant', merchant);
    const amountError = validateField('amount', amount);
    const dateError = validateField('date', date);

    const newErrors = {
      merchant: merchantError,
      amount: amountError,
      date: dateError,
    };

    setErrors(newErrors);
    setTouched({ merchant: true, amount: true, date: true });

    // Check if there are any errors
    if (Object.values(newErrors).some((error) => error !== '')) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      // Upload receipt if one was selected
      let receiptUrl: string | null = null;
      if (receiptImage) {
        try {
          receiptUrl = await uploadReceipt(receiptImage);
        } catch (uploadError) {
          console.error('Error uploading receipt:', uploadError);
          // Continue saving expense even if receipt upload fails
          Alert.alert(
            'Warning',
            'Receipt photo could not be uploaded, but expense will be saved.',
            [{ text: 'OK' }]
          );
        }
      }

      const { error } = await supabase.from('expenses').insert({
        user_id: user.id,
        merchant: merchant.trim(),
        category: category || null,
        total: parseFloat(amount),
        date,
        is_tax_deductible: isTaxDeductible,
        notes: notes.trim() || null,
        receipt_url: receiptUrl,
      });

      if (error) throw error;

      Alert.alert('Success', 'Expense tracked successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', error.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Track Expense',
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.form}>
            {/* Merchant */}
            <View style={styles.field}>
              <Text style={styles.label}>Merchant *</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.merchant && errors.merchant && styles.inputError,
                ]}
                value={merchant}
                onChangeText={handleMerchantChange}
                onBlur={() => handleFieldBlur('merchant')}
                placeholder='e.g., Starbucks, Shell Gas'
                placeholderTextColor={COLORS.gray[400]}
              />
              {touched.merchant && errors.merchant && (
                <Text style={styles.errorText}>{errors.merchant}</Text>
              )}
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
                <Text
                  style={[
                    styles.pickerText,
                    !category && styles.placeholderText,
                  ]}>
                  {category || 'Select category'}
                </Text>
                <Ionicons
                  name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.gray[500]}
                />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.pickerOptions}>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={styles.pickerOption}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategoryPicker(false);
                      }}>
                      <Text
                        style={[
                          styles.pickerOptionText,
                          category === cat && styles.pickerOptionSelected,
                        ]}>
                        {cat}
                      </Text>
                      {category === cat && (
                        <Ionicons
                          name='checkmark'
                          size={20}
                          color={COLORS.accent[400]}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>Amount *</Text>
              <View
                style={[
                  styles.amountInput,
                  touched.amount && errors.amount && styles.inputError,
                ]}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountField}
                  value={amount}
                  onChangeText={handleAmountChange}
                  onBlur={() => handleFieldBlur('amount')}
                  placeholder='0.00'
                  placeholderTextColor={COLORS.gray[400]}
                  keyboardType='decimal-pad'
                />
              </View>
              {touched.amount && errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>

            {/* Date */}
            <DatePicker
              label='Date'
              value={date}
              onChange={setDate}
              required
            />

            {/* Tax Deductible */}
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.label}>Tax Deductible</Text>
                  <Text style={styles.helper}>
                    Mark if this is a business expense eligible for tax
                    deduction
                  </Text>
                </View>
                <Switch
                  value={isTaxDeductible}
                  onValueChange={setIsTaxDeductible}
                  trackColor={{
                    false: COLORS.gray[300],
                    true: COLORS.accent[300],
                  }}
                  thumbColor={
                    isTaxDeductible ? COLORS.accent[400] : COLORS.gray[100]
                  }
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder='Add any additional notes...'
                placeholderTextColor={COLORS.gray[400]}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Receipt Photo */}
            <View style={styles.field}>
              <Text style={styles.label}>Receipt Photo</Text>
              {receiptImage ? (
                <View style={styles.receiptContainer}>
                  <Image
                    source={{ uri: receiptImage }}
                    style={styles.receiptImage}
                    resizeMode='cover'
                  />
                  <TouchableOpacity
                    style={styles.removeReceiptButton}
                    onPress={removeReceipt}>
                    <Ionicons name='close-circle' size={28} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addReceiptButton}
                  onPress={showImagePickerOptions}
                  disabled={uploadingReceipt}>
                  {uploadingReceipt ? (
                    <ActivityIndicator color={COLORS.accent[400]} />
                  ) : (
                    <>
                      <Ionicons
                        name='camera-outline'
                        size={32}
                        color={COLORS.accent[400]}
                      />
                      <Text style={styles.addReceiptText}>Add Receipt Photo</Text>
                      <Text style={styles.addReceiptSubtext}>
                        Take a photo or choose from library
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  helper: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.gray[900],
  },
  placeholderText: {
    color: COLORS.gray[400],
  },
  pickerOptions: {
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    maxHeight: 250,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  pickerOptionText: {
    fontSize: 16,
    color: COLORS.gray[900],
  },
  pickerOptionSelected: {
    color: COLORS.accent[400],
    fontWeight: '600',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginRight: 8,
  },
  amountField: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    paddingVertical: 12,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.accent[400],
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  receiptContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeReceiptButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 14,
  },
  addReceiptButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.accent[200],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addReceiptText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent[400],
    marginTop: 12,
  },
  addReceiptSubtext: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 4,
    textAlign: 'center',
  },
});
