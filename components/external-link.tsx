import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { GestureResponderEvent, Platform, Pressable } from 'react-native';

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
}

export function ExternalLink({ href, children }: ExternalLinkProps) {
  const handlePress = async (event: GestureResponderEvent) => {
    if (Platform.OS !== 'web') {
      // Prevent default behavior on native
      event.preventDefault();
      // Open the link in an in-app browser
      await WebBrowser.openBrowserAsync(href);
    } else {
      // On web, use window.open
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Pressable onPress={handlePress}>
      {children}
    </Pressable>
  );
}