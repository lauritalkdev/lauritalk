import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../supabase';

const PaymentButton = () => {
  const [loading, setLoading] = React.useState(false);
  const navigation = useNavigation();

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to upgrade to premium');
        return;
      }

      Alert.alert(
        '💳 Choose Payment Method',
        'Select how you want to pay',
        [
          {
            text: '💰 Crypto Payment',
            onPress: () => showPlanSelection(user.id, 'crypto')
          },
          {
            text: '📱 Momo Payment',
            onPress: () => Alert.alert('Coming Soon', 'Momo payments will be available soon!')
          },
          {
            text: '💳 Card Payment', 
            onPress: () => Alert.alert('Coming Soon', 'Card payments will be available soon!'),
            style: 'default'
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to load payment options');
    } finally {
      setLoading(false);
    }
  };

  const showPlanSelection = (userId: string, method: string) => {
    Alert.alert(
      '🚀 Upgrade to Premium',
      'Get unlimited translations and premium features',
      [
        {
          text: 'Monthly - $7/month',
          onPress: () => {
            if (method === 'crypto') {
              showCryptoOptions(userId, 'monthly');
            }
          }
        },
        {
          text: 'Annual - $60/year (Save $24!)', 
          onPress: () => {
            if (method === 'crypto') {
              showCryptoOptions(userId, 'annual');
            }
          }
        },
        {
          text: 'Back',
          style: 'cancel'
        }
      ]
    );
  };

  const showCryptoOptions = (userId: string, planType: string) => {
    (navigation as any).navigate('CryptoSelection', { 
      userId: userId, 
      planType: planType 
    });
  };

  if (loading) {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          margin: 20,
          opacity: 0.7
        }}
        disabled
      >
        <ActivityIndicator color="white" />
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 5 }}>
          Preparing...
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={{
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        margin: 20
      }}
      onPress={handlePayment}
    >
      <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
        Upgrade to Premium
      </Text>
    </TouchableOpacity>
  );
};

export default PaymentButton;