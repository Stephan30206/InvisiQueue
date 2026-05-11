import { getThemeColors, useTheme } from "@/lib/theme-provider";
import { useLanguage } from "@/lib/use-language";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

export default function HelpCenterScreen() {
  const { colorScheme } = useTheme();
  const colors = getThemeColors(colorScheme);
  const router = useRouter();
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqs: FAQItem[] = [
    {
      id: "personal-info",
      question: t("faqPersonalInfo"),
      answer: t("faqPersonalInfoAnswer"),
    },
    {
      id: "keyboard-input",
      question: t("faqKeyboardInput"),
      answer: t("faqKeyboardInputAnswer"),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
          {t("helpCenter")}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 20 }}>
            {t("helpCenterSub")}
          </Text>
        </View>

        {/* FAQ Items */}
        <View style={{ paddingHorizontal: 20, gap: 12, marginBottom: 32 }}>
          {faqs.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
              style={{
                backgroundColor: colors.surfaceLight,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              {/* Question */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <Feather
                    name="help-circle"
                    size={18}
                    color={colors.text}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.text,
                      lineHeight: 20,
                    }}
                  >
                    {item.question}
                  </Text>
                </View>
                <Feather
                  name={expandedId === item.id ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textMuted}
                />
              </View>

              {/* Answer */}
              {expandedId === item.id && (
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    padding: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textMuted,
                      lineHeight: 20,
                    }}
                  >
                    {item.answer}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Support */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 32,
            backgroundColor: colors.surfaceLight,
            borderRadius: 12,
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
            Besoin d'aide supplémentaire ?
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 20 }}>
            Si vous ne trouvez pas la réponse à votre question, n'hésitez pas à
            nous contacter via le formulaire de support dans votre profil.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
