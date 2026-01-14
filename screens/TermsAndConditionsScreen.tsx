import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
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

type TermsAndConditionsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function TermsAndConditionsScreen() {
  const navigation = useNavigation<TermsAndConditionsScreenNavigationProp>();

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#D4AF37" />
          </TouchableOpacity>
          <Text style={styles.title}>Terms & Conditions</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.titleUnderline} />

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>1. COMPANY INFORMATION</Text>
            <Text style={styles.text}>
              Legal Name: Luminix{"\n"}
              Country of Registration: Cameroon{"\n"}
              Business Address: Buea, Cameroon{"\n"}
              Contact Emails:{"\n"}
              • contact@lauritalk.com{"\n"}
              • contact@luminix.com{"\n\n"}
              Lauritalk is a product owned and operated by Luminix.
            </Text>

            <Text style={styles.sectionTitle}>2. SCOPE OF SERVICES</Text>
            <Text style={styles.text}>
              Lauritalk is an AI-powered language translation and communication platform that provides, among other features:{"\n"}
              • Text-to-text translation across international languages and local dialects{"\n"}
              • Dialect-to-dialect translation{"\n"}
              • Voice-to-voice and voice-to-text translation{"\n"}
              • Real-time multilingual chat translation{"\n"}
              • AI chatbot responses across diverse subject areas{"\n"}
              • A word-based reward system for eligible users{"\n"}
              • Web-based account management, subscriptions, and premium access{"\n\n"}
              The Services are accessible through:{"\n"}
              • Android applications{"\n"}
              • iOS applications{"\n"}
              • Official website and user portal (
              <Text style={styles.link} onPress={() => openLink("https://www.lauritalk.com")}>
                https://www.lauritalk.com
              </Text>
              ){"\n"}
              • Third-party app distribution platforms including Huawei Store, Xiaomi Store, and others
            </Text>

            <Text style={styles.sectionTitle}>3. USER ELIGIBILITY</Text>
            <Text style={styles.text}>
              The Services are available to users 6 years of age and above.{"\n\n"}
              By using the Services, you represent that you meet the minimum age requirement.{"\n\n"}
              If you are under the age of majority in your jurisdiction, you confirm that a parent or legal guardian has approved your use of the Services.
            </Text>

            <Text style={styles.sectionTitle}>4. USER ACCOUNTS</Text>
            <Text style={styles.text}>
              Users must create an account to access the Services.{"\n\n"}
              Account registration may be completed using:{"\n"}
              • Email address{"\n"}
              • Wallet address{"\n\n"}
              Each individual is permitted only one account.{"\n\n"}
              Users are responsible for maintaining the confidentiality of their login credentials.{"\n\n"}
              You are fully responsible for all activities that occur under your account.{"\n\n"}
              Luminix reserves the right to suspend or terminate accounts that violate these Terms.
            </Text>

            <Text style={styles.sectionTitle}>5. AI TRANSLATION & CHATBOT DISCLAIMER</Text>
            <Text style={styles.text}>
              Translations and chatbot responses are generated using artificial intelligence and may not be fully accurate or error-free.{"\n\n"}
              The Services are provided for general informational and communication purposes only.{"\n\n"}
              You must not rely on translations or chatbot outputs for:{"\n"}
              • Legal advice{"\n"}
              • Medical advice{"\n"}
              • Immigration matters{"\n"}
              • Government or official use{"\n\n"}
              User-generated text and translations may be temporarily stored and logged for system performance, analytics, and AI model improvement.
            </Text>

            <Text style={styles.sectionTitle}>6. VOICE DATA & THIRD-PARTY AI SERVICES</Text>
            <Text style={styles.text}>
              Voice recordings are processed temporarily and deleted after processing.{"\n\n"}
              Luminix uses third-party AI services and APIs to deliver certain features.{"\n\n"}
              By using the Services, you acknowledge that your content may be processed by such third-party systems solely for service delivery.{"\n\n"}
              You are solely responsible for all content you submit, speak, translate, or transmit through the Services.
            </Text>

            <Text style={styles.sectionTitle}>7. REWARD & MONETIZATION SYSTEM</Text>
            <Text style={styles.text}>
              Eligible users may earn rewards based on the number of words translated, subject to the rates, rules, and conditions displayed within the translation interface.{"\n\n"}
              Reward rates and conditions may be updated from time to time.{"\n\n"}
              Minimum payout threshold: USD $50{"\n"}
              Payout method: Cryptocurrency only{"\n"}
              Earnings are available to users in all countries.{"\n\n"}
              Luminix reserves the absolute right to:{"\n"}
              • Investigate suspected fraud, abuse, or manipulation{"\n"}
              • Suspend, withhold, or cancel rewards{"\n"}
              • Disqualify users from the reward system{"\n\n"}
              Decisions regarding rewards are final.
            </Text>

            <Text style={styles.sectionTitle}>8. SUBSCRIPTIONS & PAYMENTS</Text>
            <Text style={styles.text}>
              Premium subscriptions are offered through the Lauritalk website and are linked to the same user account used on the mobile applications.{"\n\n"}
              Subscriptions provide enhanced access and features across the Lauritalk ecosystem.{"\n\n"}
              Available Plans:{"\n"}
              • Monthly: USD $7{"\n"}
              • Six (6) Months: USD $40{"\n"}
              • Annual: USD $60{"\n\n"}
              These prices may be promotional, discounted, or subject to increase in future billing periods.{"\n\n"}
              Payment Details:{"\n"}
              • Payment method: Cryptocurrency{"\n"}
              • Subscription prices do not include taxes, which may apply depending on jurisdiction.{"\n\n"}
              Refund Policy:{"\n"}
              • Monthly subscriptions: Non-refundable{"\n"}
              • Six-month and annual subscriptions: Partial refunds only, under strict conditions and subject to penalties, as determined by Luminix.
            </Text>

            <Text style={styles.sectionTitle}>9. FREE VS PREMIUM ACCESS</Text>
            <Text style={styles.text}>
              Freemium Users:{"\n"}
              • Daily translation limit: 200 words{"\n"}
              • Monthly translation limit: 1,200 words{"\n"}
              • Advertisements displayed{"\n\n"}
              Premium Users:{"\n"}
              • Unlimited translations during the active subscription period{"\n"}
              • Priority access to Services{"\n"}
              • No advertisements{"\n"}
              • Unlimited eligible word count for rewards{"\n"}
              • Referral ranking and bonus earnings from referrals' subscriptions
            </Text>

            <Text style={styles.sectionTitle}>10. PROHIBITED USE</Text>
            <Text style={styles.text}>
              You agree not to use the Services to:{"\n"}
              • Engage in illegal activities{"\n"}
              • Generate or distribute hate speech or harmful content{"\n"}
              • Commit fraud, deception, or abuse{"\n"}
              • Send spam or unsolicited messages{"\n"}
              • Use automated scripts, bots, or scraping tools{"\n"}
              • Reverse engineer, copy, or exploit the Services{"\n"}
              • Interfere with system security or integrity{"\n\n"}
              Violation of this section may result in immediate account termination.
            </Text>

            <Text style={styles.sectionTitle}>11. INTELLECTUAL PROPERTY</Text>
            <Text style={styles.text}>
              All intellectual property rights in the Services, including software, AI models, branding, and content, belong exclusively to Luminix.{"\n\n"}
              Luminix was founded by Ebong Eric Etoe (
              <Text style={styles.link} onPress={() => openLink("https://www.ebongeric.com")}>
                https://www.ebongeric.com
              </Text>
              ).{"\n\n"}
              Users retain ownership of their submitted text and content but grant Luminix a non-exclusive, worldwide license to store, process, and use such content for service delivery and improvement.
            </Text>

            <Text style={styles.sectionTitle}>12. ACCOUNT SUSPENSION & TERMINATION</Text>
            <Text style={styles.text}>
              Luminix reserves the right to:{"\n"}
              • Suspend or permanently terminate accounts without prior notice for violations of these Terms{"\n"}
              • Permanently forfeit:{"\n"}
              • Unpaid earnings{"\n"}
              • Active subscriptions{"\n"}
              • Associated account benefits{"\n\n"}
              Termination decisions are final.
            </Text>

            <Text style={styles.sectionTitle}>13. LIMITATION OF LIABILITY</Text>
            <Text style={styles.text}>
              To the fullest extent permitted by law, Luminix shall not be liable for:{"\n"}
              • Inaccurate translations or chatbot responses{"\n"}
              • Loss of earnings, data, or business opportunities{"\n"}
              • Service interruptions or technical failures{"\n"}
              • Actions taken based on translated content{"\n\n"}
              Use of the Services is at your own risk.
            </Text>

            <Text style={styles.sectionTitle}>14. GOVERNING LAW & JURISDICTION</Text>
            <Text style={styles.text}>
              These Terms shall be governed by and interpreted in accordance with the laws of the Republic of Cameroon.{"\n\n"}
              Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of Cameroonian courts.
            </Text>

            <Text style={styles.sectionTitle}>15. CHANGES TO TERMS</Text>
            <Text style={styles.text}>
              Luminix may update these Terms at any time.{"\n\n"}
              Users will be notified of material changes through:{"\n"}
              • In-app notifications{"\n"}
              • Email{"\n"}
              • Website announcements{"\n\n"}
              Continued use of the Services after updates constitutes acceptance of the revised Terms.
            </Text>

            <Text style={styles.sectionTitle}>16. CONTACT</Text>
            <Text style={styles.text}>
              For questions or legal inquiries, contact:{"\n"}
              📧 contact@lauritalk.com{"\n"}
              📧 contact@luminix.space
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Last Updated: {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
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
    fontSize: 24, 
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D4AF37",
    marginTop: 20,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#2E8B57",
    paddingLeft: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
    marginBottom: 15,
  },
  link: {
    color: "#4ECDC4",
    textDecorationLine: "underline",
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.3)",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(212, 175, 55, 0.7)",
    fontStyle: "italic",
  },
});