import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../theme';

interface FooterProps {
  onScrollToTop: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToTop }) => {
  return (
    <View style={styles.footerWrapper}>
      <View style={styles.footerContainer}>
        {/* Top Row */}
        <View style={styles.topRow}>
          <View style={styles.brandInfo}>
            <Text style={styles.footerBrand}>
              RMAA <Text style={styles.cyan}>HOLDINGS</Text>
            </Text>
            <Text style={styles.footerTagline}>
              Industrial Deep-Tech &amp; Autonomous AI Holding Vehicle • Rawalpindi, Pakistan
            </Text>
          </View>

          <Pressable onPress={onScrollToTop} style={styles.topButton}>
            <Text style={styles.topButtonText}>↑ Back to Top</Text>
          </Pressable>
        </View>

        {/* SEO Entity Anchor Row */}
        

        {/* Legal & Trademark Credentials */}
        <View style={styles.legalRow}>
          <Text style={styles.legalText}>
            © 2026 RMAA Holdings. All rights reserved.
          </Text>
          <Text style={styles.legalText}>
            FBR Form 181 Registered Sole Proprietorship (NTN: 3740522733567) • Registered Trademark: ALI CNC (IPO App: 890258).
          </Text>
          <Text style={styles.legalText}>
            Officially Registered with Pakistan Software Export Board (PSEB) • Dual TITANS of CNC
            Certified.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerWrapper: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    backgroundColor: '#07080C',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerContainer: {
    maxWidth: 1040,
    width: '100%',
    marginHorizontal: 'auto' as any,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 16,
  },
  brandInfo: {
    gap: 4,
  },
  footerBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  cyan: {
    color: theme.colors.cyan,
  },
  footerTagline: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  topButton: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.md,
    cursor: 'pointer' as any,
  },
  topButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.mono,
  },
  seoAnchorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  seoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
  },
  seoKeyword: {
    fontSize: 11,
    color: theme.colors.cyan,
    fontFamily: theme.fonts.mono,
  },
  seoDivider: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  legalRow: {
    gap: 4,
  },
  legalText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
});

