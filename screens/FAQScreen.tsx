import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
    Dimensions,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

type RootStackParamList = {
  Settings: undefined;
};

type FAQScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQScreen() {
  const navigation = useNavigation<FAQScreenNavigationProp>();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  const faqData: FAQItem[] = [
    {
      question: "1. What is Lauritalk?",
      answer: "Lauritalk is an AI-powered language translation platform by Luminix that enables text, voice, and chat translation across 150+ international languages and local dialects."
    },
    {
      question: "2. Who owns Lauritalk?",
      answer: "Lauritalk is a product owned and operated by Luminix, a company registered in Cameroon."
    },
    {
      question: "3. Which platforms is Lauritalk available on?",
      answer: "Lauritalk is available on:\n• Android\n• iOS\n• Web (www.lauritalk.com)\n• Third-party app stores such as Huawei Store and Xiaomi Store"
    },
    {
      question: "4. Do I need an account to use Lauritalk?",
      answer: "Yes. You must create an account to use Lauritalk features.\nSign-up is available using email or wallet address. Only one account per user is allowed."
    },
    {
      question: "5. What is the minimum age to use Lauritalk?",
      answer: "Lauritalk is available to users 6 years and above.\nIf you are under the legal age in your country, parental or guardian approval is required."
    },
    {
      question: "6. How accurate are the translations?",
      answer: "Lauritalk uses artificial intelligence, and while translations are highly advanced, they may not be 100% accurate.\nTranslations should not be used for legal, medical, immigration, or official government purposes."
    },
    {
      question: "7. Does Lauritalk store my text or voice data?",
      answer: "• Text and chat inputs may be temporarily stored to improve system performance and AI models.\n• Voice recordings are processed temporarily and deleted after use.\n• We do not permanently store voice data."
    },
    {
      question: "8. Are third-party AI services used?",
      answer: "Yes. Lauritalk uses trusted third-party AI services to power translations and voice processing. These services operate under strict confidentiality obligations."
    },
    {
      question: "9. Can I earn money using Lauritalk?",
      answer: "Yes. Eligible users can earn rewards based on the number of words translated, subject to the rates and conditions shown in the app.\n\nMinimum payout: $50\nPayout method: Cryptocurrency only\nAvailable globally\n\nLuminix reserves the right to suspend rewards in cases of fraud or abuse."
    },
    {
      question: "10. Is Lauritalk free to use?",
      answer: "Yes. Lauritalk offers a freemium plan.\n\nFree users:\n• 200 words per day\n• 1,200 words per month\n• Ads included"
    },
    {
      question: "11. What do premium subscribers get?",
      answer: "Premium users enjoy:\n• Unlimited translations during the subscription period\n• Priority access\n• No ads\n• Unlimited reward-eligible word count\n• Referral ranking and subscription bonus earnings"
    },
    {
      question: "12. Where do subscriptions happen?",
      answer: "Subscriptions are managed through the Lauritalk website and apply to your account across both the website and mobile apps."
    },
    {
      question: "13. What subscription plans are available?",
      answer: "• Monthly: $7\n• Six months: $40\n• Annual: $60\n\nPrices may change in future billing periods. Taxes are not included."
    },
    {
      question: "14. Are subscriptions refundable?",
      answer: "• Monthly plans: No refunds\n• Six-month and annual plans: Partial refunds only, under strict conditions and penalties"
    },
    {
      question: "15. Can my account be suspended?",
      answer: "Yes. Luminix may suspend or permanently terminate accounts that violate platform rules, including:\n• Fraud\n• Abuse\n• Automated or bot usage\n• Illegal or harmful content\n\nUnpaid earnings and active subscriptions are forfeited upon termination."
    },
    {
      question: "16. Who owns the content I translate?",
      answer: "You retain ownership of your content.\nHowever, you grant Luminix a license to store and process it solely to provide and improve the Services."
    },
    {
      question: "17. Is Lauritalk safe to use?",
      answer: "We apply reasonable technical and organizational security measures, but no system is 100% secure. Use the Services responsibly and protect your login details."
    },
    {
      question: "18. Which laws govern Lauritalk?",
      answer: "Lauritalk is governed by the laws of the Republic of Cameroon."
    },
    {
      question: "19. Can Lauritalk change its Terms or Privacy Policy?",
      answer: "Yes. Updates may be made at any time. Users will be notified via:\n• In-app notifications\n• Email\n• Website announcements"
    },
    {
      question: "20. How can I contact Lauritalk support?",
      answer: "📧 contact@lauritalk.com\n📧 contact@luminix.space"
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#D4AF37" />
          </TouchableOpacity>
          <Text style={styles.title}>Frequently Asked Questions</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.titleUnderline} />

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introContainer}>
            <Text style={styles.introText}>
              Find quick answers to common questions about Lauritalk. Tap on any question to expand and see the answer.
            </Text>
          </View>

          <View style={styles.faqContainer}>
            {faqData.map((item, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.questionContainer}
                  onPress={() => toggleExpand(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.questionText}>{item.question}</Text>
                  <Ionicons
                    name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#D4AF37"
                  />
                </TouchableOpacity>
                
                {expandedIndex === index && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                    {index === 2 && (
                      <Text 
                        style={styles.link}
                        onPress={() => openLink("https://www.lauritalk.com")}
                      >
                        Visit our website: https://www.lauritalk.com
                      </Text>
                    )}
                  </View>
                )}
                
                {index < faqData.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>

          <View style={styles.contactContainer}>
            <Text style={styles.contactTitle}>Still have questions?</Text>
            <Text style={styles.contactText}>
              Feel free to reach out to our support team at:{"\n"}
              <Text style={styles.email}>contact@lauritalk.com</Text> or{"\n"}
              <Text style={styles.email}>contact@luminix.space</Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  contentWrapper: {
    width: width * 0.95,
    height: height * 0.95,
    backgroundColor: "#000",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#D4AF37",
    overflow: "hidden",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  backButton: {
    padding: 8,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#D4AF37", 
    textAlign: "center", 
    flex: 1 
  },
  headerSpacer: { width: 40 },
  titleUnderline: {
    height: 3,
    backgroundColor: "#2E8B57",
    width: 60,
    alignSelf: "center",
    borderRadius: 2,
    marginBottom: 20,
  },
  scrollContainer: { 
    flex: 1 
  },
  scrollContent: { 
    paddingBottom: 30 
  },
  introContainer: {
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  introText: {
    fontSize: 14,
    color: "#D4AF37",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 18,
  },
  faqContainer: {
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 25,
  },
  faqItem: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 10,
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 5,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#E0E0E0",
    marginBottom: 10,
  },
  link: {
    color: "#4ECDC4",
    textDecorationLine: "underline",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    marginHorizontal: 20,
  },
  contactContainer: {
    backgroundColor: "rgba(46, 139, 87, 0.1)",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(46, 139, 87, 0.3)",
    marginHorizontal: 20,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E8B57",
    marginBottom: 10,
    textAlign: "center",
  },
  contactText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 20,
  },
  email: {
    color: "#4ECDC4",
    fontWeight: "500",
  },
});