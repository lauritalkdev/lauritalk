import { useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const QRPaymentScreen = () => {
  const route = useRoute();
  const { paymentData } = route.params as any;
  const [countdown, setCountdown] = useState(2700); // 45 minutes in seconds

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Format time function
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async () => {
    if (paymentData?.pay_address) {
      await Clipboard.setStringAsync(paymentData.pay_address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    }
  };

  // Create payment URI for QR code
  const getPaymentURI = () => {
    if (!paymentData) return '';
    
    const currency = paymentData.pay_currency?.toLowerCase();
    const amount = paymentData.pay_amount;
    const address = paymentData.pay_address;

    if (currency === 'btc') {
      return `bitcoin:${address}?amount=${amount}`;
    } else if (currency === 'eth') {
      return `ethereum:${address}`;
    } else if (currency === 'usdttrc20') {
      return address;
    }
    return address;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Payment Initialized</Text>
      
      <Text style={styles.instruction}>
        Send {paymentData?.pay_amount || '0'} {paymentData?.pay_currency?.toUpperCase() || 'CRYPTO'}
      </Text>

      {/* Real QR Code */}
      <View style={styles.qrContainer}>
        <QRCode
          value={getPaymentURI()}
          size={180}
          backgroundColor="white"
          color="black"
        />
      </View>

      <Text style={styles.scanText}>Scan QR code or copy address below</Text>

      <TouchableOpacity onPress={copyToClipboard} style={styles.addressContainer}>
        <Text style={styles.addressText}>{paymentData?.pay_address || 'Loading...'}</Text>
        <Text style={styles.copyText}>Tap to copy address</Text>
      </TouchableOpacity>

      {/* 🟢 UPDATED: Live countdown timer */}
      <Text style={styles.timer}>⏰ Time remaining: {formatTime(countdown)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
    alignSelf: 'center',
  },
  scanText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
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
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default QRPaymentScreen;