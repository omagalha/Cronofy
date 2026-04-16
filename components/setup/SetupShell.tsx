import React, { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SetupShellProps = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  primaryDisabled?: boolean;
  footerHint?: string;
  scrollable?: boolean;
};

export default function SetupShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  primaryLabel = 'Continuar',
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  primaryDisabled = false,
  footerHint,
  scrollable = true,
}: SetupShellProps) {
  const progress = Math.max(0, Math.min(step / totalSteps, 1));

  const content = (
    <>
      <View style={styles.heroCard}>
        <View style={styles.topRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              PASSO {step} DE {totalSteps}
            </Text>
          </View>

          <Text style={styles.stepCounter}>
            {step}/{totalSteps}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.contentCard}>{children}</View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.nonScrollableContent}>{content}</View>
      )}

      <View style={styles.footer}>
        <Pressable
          onPress={onPrimaryPress}
          disabled={primaryDisabled}
          style={({ pressed }) => [
            styles.primaryButton,
            primaryDisabled && styles.primaryButtonDisabled,
            pressed && !primaryDisabled && styles.buttonPressed,
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              primaryDisabled && styles.primaryButtonTextDisabled,
            ]}
          >
            {primaryLabel}
          </Text>
        </Pressable>

        {secondaryLabel && onSecondaryPress ? (
          <Pressable
            onPress={onSecondaryPress}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}

        {footerHint ? <Text style={styles.footerHint}>{footerHint}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071120',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 180,
  },
  nonScrollableContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 180,
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepBadge: {
    backgroundColor: 'rgba(125,183,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(125,183,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  stepBadgeText: {
    color: '#B7D7FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  stepCounter: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#4DA1FF',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 22,
  },
  contentCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCEBFF',
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(7,17,32,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 14,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  primaryButtonText: {
    color: '#071120',
    fontSize: 16,
    fontWeight: '800',
  },
  primaryButtonTextDisabled: {
    color: 'rgba(255,255,255,0.56)',
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerHint: {
    marginTop: 10,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.50)',
    fontSize: 12,
    lineHeight: 18,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
