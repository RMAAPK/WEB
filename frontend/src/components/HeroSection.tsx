import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { theme } from '../theme';
import logoUrl from '../assets/rmaa_holdings_transparent.png';

interface HeroSectionProps {
  onExplore: () => void;
  onOpenEmail: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExplore, onOpenEmail }) => {
  return (
    <View style={styles.sectionWrapper} id="hero">
      <View style={styles.container}>
        {/* Brand Bar / Header Badge */}
        <View style={styles.brandRow}>
          <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
          <View>
            <Text style={styles.brandTag}>PARENT HOLDING VEHICLE</Text>
            <Text style={styles.brandTitle}>
              RMAA <Text style={styles.cyan}>HOLDINGS</Text>
            </Text>
          </View>
        </View>

        <Text style={styles.heroLead}>
          Operating vehicle for <Text style={styles.boldWhite}>Forge AI</Text> (sub-10ms acoustic spindle defense) 
          and <Text style={styles.boldWhite}>Ali CNC</Text> (24,000 RPM precision CAD/CAM &amp; automated manufacturing).
        </Text>

        {/* Trade dress action buttons */}
        <View style={styles.actionsRow}>
          <Pressable onPress={() => window.open('https://alicnc.rmaa.pk', '_blank')} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}></Text>
          </Pressable>
          <Pressable onPress={() => {
            const el = document.getElementById('ventures');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Holdings Portfolio ↓</Text>
          </Pressable>
          <Pressable onPress={onOpenEmail} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>say@rmaa.pk ✉</Text>
          </Pressable>
        </View>

        {/* Credentials / Spec Bar - matching Engineering trade dress */}
        <View style={styles.credsContainer}>
          <View style={styles.credItem}>
            <Text style={styles.statVal}>&lt; 10ms</Text>
            <Text style={styles.credLabel}>Acoustic Breakage Latency</Text>
          </View>
          <View style={styles.credItem}>
            <Text style={styles.statVal}>24,000</Text>
            <Text style={styles.credLabel}>Max Spindle RPM</Text>
          </View>
          <View style={styles.credItem}>
            <Text style={styles.statVal}>NTN: 3740522733567</Text>
            <Text style={styles.credLabel}>FBR Registered</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    paddingVertical: 56,
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  logoImage: {
    width: 64,
    height: 52,
  },
  brandTag: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.cyan,
    fontFamily: theme.fonts.mono,
    letterSpacing: 1.5,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  cyan: {
    color: theme.colors.cyan,
  },
  boldWhite: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  heroLead: {
    fontSize: 17,
    lineHeight: 26,
    color: theme.colors.textSecondary,
    maxWidth: 760,
    marginBottom: 28,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 36,
  },
  primaryBtn: {
    backgroundColor: theme.colors.cyan,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radii.sm,
    cursor: 'pointer' as any,
  },
  primaryBtnText: {
    color: '#090a0f',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.sm,
    cursor: 'pointer' as any,
  },
  secondaryBtnText: {
    color: theme.colors.cyan,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: theme.fonts.mono,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.sm,
    cursor: 'pointer' as any,
  },
  actionButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: theme.fonts.mono,
  },
  credsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: 20,
    gap: 20,
    justifyContent: 'space-between',
  },
  credItem: {
    flex: 1,
    minWidth: 180,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.cyan,
    fontFamily: theme.fonts.mono,
  },
  credLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
