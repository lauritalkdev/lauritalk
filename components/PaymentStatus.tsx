import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../supabase';

const PaymentStatus = () => {
  const [activeSubscription, setActiveSubscription] = useState(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has active subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (data) {
        setActiveSubscription(data);
      }
    } catch (error) {
      console.log('No active subscription found');
    }
  };

  // Only show badge if user has active subscription
  if (!activeSubscription) {
    return null; // Don't show anything if no subscription
  }

  return (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeText}>🎉 PREMIUM</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#047857',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default PaymentStatus;