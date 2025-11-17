import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';

const cryptoList = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH' },
  { id: 'usdttrc20', name: 'USDT TRC20', symbol: 'USDT' },
  { id: 'usdtbep20', name: 'USDT BEP20', symbol: 'USDT' }, // Maps to usdtbsc in backend
  { id: 'bnb', name: 'BNB', symbol: 'BNB' }, // Maps to bnbbsc in backend
  { id: 'xrp', name: 'XRP', symbol: 'XRP' },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC' },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'ada', name: 'Cardano', symbol: 'ADA' },
  { id: 'sol', name: 'Solana', symbol: 'SOL' },
];

const CryptoSelectionScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, planType } = route.params as any;

  const handleCryptoSelect = async (cryptoId: string) => {
    console.log('Creating payment:', cryptoId, 'for plan:', planType);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Error', 'Please log in again');
        return;
      }

      const response = await fetch('https://cvdvqxxgbjvoplslnewj.supabase.co/functions/v1/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          plan_id: planType,
          user_id: userId,
          payment_currency: cryptoId
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.payment && result.payment.pay_address) {
          await Clipboard.setStringAsync(result.payment.pay_address);
          console.log('Payment created successfully!');
          
          // 🟢 PASS PAYMENT DATA DIRECTLY TO QR SCREEN (No blinking)
          (navigation as any).navigate('QRPayment', { 
            paymentData: result.payment 
          });
          return;
        } else {
          Alert.alert('Error', 'Payment initialization failed');
        }
      } else {
        const error = await response.text();
        Alert.alert('Error', `Payment failed: ${error}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Payment connection failed');
    }
    
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Cryptocurrency</Text>
      <Text style={styles.subtitle}>
        Plan: <Text style={styles.highlight}>{planType}</Text> | User: <Text style={styles.highlight}>{userId?.substring(0, 8)}...</Text>
      </Text>
      
      <FlatList
        data={cryptoList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.cryptoItem}
            onPress={() => handleCryptoSelect(item.id)}
          >
            <View style={styles.cryptoContent}>
              <Text style={styles.cryptoName}>{item.name}</Text>
              <Text style={styles.cryptoSymbol}>{item.symbol}</Text>
            </View>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000000', // Black background
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FFD700', // Gold color
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#FFFFFF', // White text
    textAlign: 'center',
  },
  highlight: {
    color: '#FFD700', // Gold highlight
    fontWeight: '600',
  },
  cryptoItem: {
    padding: 20,
    backgroundColor: '#1A1A1A', // Dark gray background for items
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#228B22', // Forest green accent border
    shadowColor: '#FFD700', // Gold shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cryptoContent: {
    flex: 1,
  },
  cryptoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF', // White text
    marginBottom: 4,
  },
  cryptoSymbol: {
    fontSize: 14,
    color: '#FFD700', // Gold color
    fontWeight: '600',
  },
  arrowContainer: {
    backgroundColor: '#228B22', // Forest green background
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#FFFFFF', // White arrow
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CryptoSelectionScreen;