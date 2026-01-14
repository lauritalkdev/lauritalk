import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const { width, height } = Dimensions.get("window");

type RootStackParamList = {
  Settings: undefined;
};

type PrivacyPolicyScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<PrivacyPolicyScreenNavigationProp>();

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#D4AF37" />
          </TouchableOpacity>
          <Text style={styles.title}>Privacy Policy</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.titleUnderline} />

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentContainer}>
            <View style={styles.effectiveDateContainer}>
              <Text style={styles.effectiveDate}>Effective Date: {currentDate}</Text>
            </View>

            <Text style={styles.introText}>
              Luminix ("we", "us", or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, disclose, and protect information when you use Lauritalk, including our mobile applications, website, and related services (collectively, the "Services").
              {"\n\n"}
              By using the Services, you agree to the collection and use of information in accordance with this Privacy Policy.
            </Text>

            <Text style={styles.sectionTitle}>1. COMPANY INFORMATION</Text>
            <Text style={styles.text}>
              Company Name: Luminix{"\n"}
              Country of Registration: Cameroon{"\n"}
              Business Address: Buea, Cameroon{"\n"}
              Product: Lauritalk{"\n"}
              Contact Emails:{"\n"}
              • contact@lauritalk.com{"\n"}
              • contact@luminix.com
            </Text>

            <Text style={styles.sectionTitle}>2. INFORMATION WE COLLECT</Text>
            <Text style={styles.text}>
              We collect the following categories of information:{"\n\n"}
              <Text style={styles.subSectionTitle}>a. Account Information</Text>
              • Email address{"\n"}
              • Wallet address{"\n"}
              • Account identifiers{"\n"}
              • Login metadata{"\n\n"}
              <Text style={styles.subSectionTitle}>b. User-Generated Content</Text>
              • Text entered for translation{"\n"}
              • Chat messages submitted for translation{"\n"}
              • Queries submitted to the AI chatbot{"\n\n"}
              User-generated content may be temporarily stored and logged for system operation, analytics, and AI improvement.{"\n\n"}
              <Text style={styles.subSectionTitle}>c. Voice Data</Text>
              • Voice inputs used for voice-to-text or voice-to-voice translation{"\n"}
              Voice recordings are:{"\n"}
              • Processed temporarily{"\n"}
              • Not permanently stored{"\n"}
              • Deleted after processing unless required for system diagnostics{"\n\n"}
              <Text style={styles.subSectionTitle}>d. Usage & Technical Data</Text>
              • Device type and operating system{"\n"}
              • App version{"\n"}
              • IP address{"\n"}
              • Language preferences{"\n"}
              • Usage patterns and interaction logs{"\n\n"}
              <Text style={styles.subSectionTitle}>e. Payment & Subscription Data</Text>
              • Subscription status{"\n"}
              • Payment confirmation (crypto transaction references only){"\n\n"}
              We do not store private keys or sensitive crypto wallet credentials.
            </Text>

            <Text style={styles.sectionTitle}>3. HOW WE USE YOUR INFORMATION</Text>
            <Text style={styles.text}>
              We use collected information to:{"\n"}
              • Provide and maintain the Services{"\n"}
              • Process translations, voice inputs, and chatbot interactions{"\n"}
              • Manage user accounts and authentication{"\n"}
              • Administer subscriptions and premium access{"\n"}
              • Calculate word-based rewards and payouts{"\n"}
              • Detect fraud, abuse, or prohibited activity{"\n"}
              • Improve AI models and system performance{"\n"}
              • Communicate updates, notices, and service-related information{"\n"}
              • Comply with legal obligations
            </Text>

            <Text style={styles.sectionTitle}>4. AI & AUTOMATED PROCESSING</Text>
            <Text style={styles.text}>
              Lauritalk uses artificial intelligence and automated systems to:{"\n"}
              • Generate translations{"\n"}
              • Process voice data{"\n"}
              • Respond via chatbot features{"\n\n"}
              These systems:{"\n"}
              • Do not guarantee accuracy{"\n"}
              • May learn from anonymized or aggregated usage data{"\n"}
              • Do not make legal, medical, or governmental decisions
            </Text>

            <Text style={styles.sectionTitle}>5. THIRD-PARTY SERVICES</Text>
            <Text style={styles.text}>
              We may use trusted third-party service providers for:{"\n"}
              • AI processing{"\n"}
              • Cloud infrastructure{"\n"}
              • Analytics{"\n"}
              • Payment verification{"\n\n"}
              These providers are authorized to process data only as necessary to provide their services to us and are subject to confidentiality obligations.
            </Text>

            <Text style={styles.sectionTitle}>6. DATA RETENTION</Text>
            <Text style={styles.text}>
              • Account data is retained while your account remains active{"\n"}
              • User-generated text may be retained temporarily for system improvement{"\n"}
              • Voice data is deleted after processing{"\n"}
              • Reward and transaction records are retained for auditing and compliance{"\n\n"}
              We may retain certain data longer where required by law or for legitimate business purposes.
            </Text>

            <Text style={styles.sectionTitle}>7. DATA SHARING & DISCLOSURE</Text>
            <Text style={styles.text}>
              We do not sell your personal data.{"\n\n"}
              We may share data:{"\n"}
              • With service providers under contractual safeguards{"\n"}
              • To comply with legal obligations{"\n"}
              • To protect the rights, safety, and integrity of Luminix and users{"\n"}
              • In connection with a merger, acquisition, or restructuring
            </Text>

            <Text style={styles.sectionTitle}>8. INTERNATIONAL DATA TRANSFERS</Text>
            <Text style={styles.text}>
              Your data may be processed or stored on servers located outside Cameroon, depending on infrastructure and service providers.{"\n\n"}
              By using the Services, you consent to such transfers, subject to appropriate security measures.
            </Text>

            <Text style={styles.sectionTitle}>9. USER RESPONSIBILITIES</Text>
            <Text style={styles.text}>
              You are responsible for:{"\n"}
              • Ensuring the legality of content you submit{"\n"}
              • Avoiding the upload or translation of sensitive personal data{"\n"}
              • Maintaining the confidentiality of your account credentials{"\n\n"}
              Luminix is not responsible for content voluntarily shared by users.
            </Text>

            <Text style={styles.sectionTitle}>10. CHILDREN'S PRIVACY</Text>
            <Text style={styles.text}>
              Lauritalk is available to users 6 years and above.{"\n\n"}
              We do not knowingly collect unnecessary personal data from children.{"\n\n"}
              If a parent or guardian believes a child has provided personal data improperly, they may contact us for review or deletion.
            </Text>

            <Text style={styles.sectionTitle}>11. SECURITY MEASURES</Text>
            <Text style={styles.text}>
              We implement reasonable technical and organizational safeguards to protect data, including:{"\n"}
              • Secure servers{"\n"}
              • Access controls{"\n"}
              • Encrypted communications where applicable{"\n\n"}
              However, no system is 100% secure, and we cannot guarantee absolute security.
            </Text>

            <Text style={styles.sectionTitle}>12. ACCOUNT TERMINATION & DATA LOSS</Text>
            <Text style={styles.text}>
              If your account is suspended or terminated:{"\n"}
              • Access to Services will cease{"\n"}
              • Unpaid rewards and active subscriptions are forfeited{"\n"}
              • Certain data may be permanently deleted{"\n\n"}
              This action is irreversible.
            </Text>

            <Text style={styles.sectionTitle}>13. YOUR RIGHTS</Text>
            <Text style={styles.text}>
              Depending on applicable laws, you may have the right to:{"\n"}
              • Access your personal data{"\n"}
              • Request correction of inaccurate data{"\n"}
              • Request deletion of your account{"\n"}
              • Withdraw consent where applicable{"\n\n"}
              Requests may be subject to verification and legal limitations.
            </Text>

            <Text style={styles.sectionTitle}>14. LIMITATION OF LIABILITY</Text>
            <Text style={styles.text}>
              Luminix shall not be liable for:{"\n"}
              • Decisions made based on translated content{"\n"}
              • Data loss due to user actions{"\n"}
              • Unauthorized access beyond reasonable control{"\n\n"}
              Use of the Services is at your own risk.
            </Text>

            <Text style={styles.sectionTitle}>15. GOVERNING LAW</Text>
            <Text style={styles.text}>
              This Privacy Policy shall be governed by and interpreted in accordance with the laws of the Republic of Cameroon.
            </Text>

            <Text style={styles.sectionTitle}>16. CHANGES TO THIS PRIVACY POLICY</Text>
            <Text style={styles.text}>
              We may update this Privacy Policy at any time.{"\n\n"}
              Users will be notified via:{"\n"}
              • In-app notifications{"\n"}
              • Email{"\n"}
              • Website notices{"\n\n"}
              Continued use of the Services constitutes acceptance of the updated policy.
            </Text>

            <Text style={styles.sectionTitle}>17. CONTACT US</Text>
            <Text style={styles.text}>
              For privacy-related questions or requests, contact:{"\n"}
              📧 contact@lauritalk.com{"\n"}
              📧 contact@luminix.space
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Luminix | Protecting Your Privacy
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
  effectiveDateContainer: {
    backgroundColor: "rgba(46, 139, 87, 0.1)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(46, 139, 87, 0.3)",
    marginBottom: 20,
    alignItems: "center",
  },
  effectiveDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E8B57",
    textAlign: "center",
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
    marginBottom: 25,
    fontStyle: "italic",
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
  subSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4ECDC4",
    marginTop: 10,
    marginBottom: 5,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
    marginBottom: 15,
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