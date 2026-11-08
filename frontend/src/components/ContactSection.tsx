import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import confetti from 'canvas-confetti';
import { theme } from '../theme';

export const ContactSection: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyEmail = () => {
    navigator.clipboard.writeText('say@rmaa.pk');
    setCopied(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#38BDF8', '#10B981', '#A855F7'],
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <View style={styles.sectionWrapper} id="contact">
      <View style={styles.container}>
        {/* Section Heading */}
        <View style={styles.headerArea}>
          <Text style={styles.sectionTag}>DIRECT COMMUNICATION</Text>
          <Text style={styles.sectionTitle}>
            RMAA Holdings <Text style={styles.highlight}>Executive Desk</Text>
          </Text>
          <Text style={styles.sectionDesc}>
            Direct communication channels for institutional inquiries, Forge AI deployments, and engineering partnerships.
          </Text>
        </View>

        {/* Big Email Action Card */}
        <View style={styles.emailCard}>
          <Text style={styles.emailCardLabel}>DIRECT INBOX</Text>
          <Text style={styles.emailAddress}>say@rmaa.pk</Text>
          <Text style={styles.emailSub}>
            Direct line to Raja Muhammad Ali Asghar. PGP encrypted transmissions welcome.
          </Text>

          <View style={styles.emailActions}>
            <Pressable onPress={() => (window.location.href = 'mailto:say@rmaa.pk')} style={styles.mailButton}>
              <Text style={styles.mailButtonText}>✉ Open Email Client</Text>
            </Pressable>
            <Pressable onPress={copyEmail} style={styles.copyButton}>
              <Text style={styles.copyButtonText}>{copied ? '✓ Copied Address' : '📋 Copy Address'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Clean Contact Channels */}
        <View style={styles.channelsGrid}>
          <View style={styles.channelItem}>
            <Text style={styles.channelLabel}>PRIMARY BUSINESS LINE</Text>
            <Text style={styles.channelValue}>+92 344 0708494</Text>
            <Text style={styles.channelSub}>Official RMAA Holdings voice &amp; WhatsApp</Text>
          </View>

          <View style={styles.channelItem}>
            <Text style={styles.channelLabel}>FOUNDER PROFILE</Text>
            <Text style={styles.channelValue}>@thealidev</Text>
            <Text style={styles.channelSub}>GitHub, X / Twitter &amp; Matrix</Text>
          </View>

          <View style={styles.channelItem}>
            <Text style={styles.channelLabel}>BASE OF OPERATIONS</Text>
            <Text style={styles.channelValue}>Rawalpindi, Pakistan</Text>
            <Text style={styles.channelSub}>Remote / Home Office</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    paddingVertical: 64,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  container: {
    maxWidth: 1040,
    width: '100%',
    marginHorizontal: 'auto' as any,
  },
  headerArea: {
    alignItems: 'center',
    textAlign: 'center' as any,
    marginBottom: 44,
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.cyan,
    fontFamily: theme.fonts.mono,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 12,
  },
  highlight: {
    color: theme.colors.cyan,
  },
  sectionDesc: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    maxWidth: 680,
    lineHeight: 24,
  },
  emailCard: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: theme.radii.lg,
    padding: 36,
    alignItems: 'center',
    textAlign: 'center' as any,
    marginBottom: 32,
  },
  emailCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.cyan,
    fontFamily: theme.fonts.mono,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  emailAddress: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.mono,
    marginBottom: 12,
  },
  emailSub: {
    fontSize: 14,
    color: theme.colors.textMuted,
    maxWidth: 520,
    lineHeight: 20,
    marginBottom: 24,
  },
  emailActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  mailButton: {
    backgroundColor: theme.colors.cyan,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: theme.radii.sm,
    cursor: 'pointer' as any,
  },
  mailButtonText: {
    color: '#090a0f',
    fontSize: 13,
    fontWeight: '800',
  },
  copyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.radii.sm,
    cursor: 'pointer' as any,
  },
  copyButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: theme.fonts.mono,
  },
  channelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  channelItem: {
    flex: 1,
    minWidth: 260,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: 24,
  },
  channelLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.cyan,
    fontFamily: theme.fonts.mono,
    letterSpacing: 1,
    marginBottom: 8,
  },
  channelValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.mono,
    marginBottom: 6,
  },
  channelSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
