import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PaymentModalProps = {
  visible: boolean;
  onClose: () => void;
  paymentData: {
    pay_amount: number;
    pay_currency: string;
    pay_address: string;
  };
};

const PaymentModal = ({ visible, onClose, paymentData }: PaymentModalProps) => {
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(paymentData.pay_address);
    Alert.alert('Copied!', 'Wallet address copied to clipboard');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>✅ Payment Initialized</Text>
          
          <Text style={styles.instruction}>
            Send {paymentData.pay_amount} {paymentData.pay_currency.toUpperCase()} to:
          </Text>

          {/* QR Code Placeholder - We'll add real QR later */}
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>QR Code</Text>
            <Text style={styles.qrSubtext}>(QR functionality coming soon)</Text>
          </View>

          <TouchableOpacity onPress={copyToClipboard} style={styles.addressContainer}>
            <Text style={styles.addressText} selectable>
              {paymentData.pay_address}
            </Text>
            <Text style={styles.copyText}>Tap to copy</Text>
          </TouchableOpacity>

          <Text style={styles.timer}>⏰ Time remaining: 45:00</Text>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 20,
  },
  qrText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  qrSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
  },
  addressContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 5,
  },
  copyText: {
    fontSize: 12,
    color: '#007AFF',
  },
  timer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentModal;