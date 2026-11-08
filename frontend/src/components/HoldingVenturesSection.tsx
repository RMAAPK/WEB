import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../theme';

export const HoldingVenturesSection: React.FC = () => {
  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const subsidiaries = [
    {
      name: 'Forge AI',
      category: 'ACOUSTIC DEFENSE SENTINEL',
      tagline: '< 10ms Spindle Vibration Defense for Industrial CNC',
      status: 'Live Deployment',
      statusColor: theme.colors.emerald,
      desc: 'Zero-overhead acoustic anomaly detection running adjacent to CNC controllers. Listens to high-frequency spindle excitation harmonics and executes emergency E-stop intervention in < 10ms before carbide tool fracture occurs.',
      highlights: [
        'Standalone 17 KB Win32 C# Sentinel (ForgeAI_NcStudio_Defense.exe) hooking NcStudio.exe in < 5ms',
        'Tooth-pass frequency DSP filter isolating 600 Hz fundamental from 2.4 kHz chatter spikes',
        'Direct Weihong PCIMC-3D / CH365 PCI bus driver integration with zero false-positive cutoffs',
      ],
      primaryAction: { label: 'Explore Forge AI Defense', url: 'https://alicnc.rmaa.pk/#forgeai' },
    },
    {
      name: 'Ali CNC',
      category: 'PRECISION CNC & CAD/CAM ENGINEERING',
      tagline: '24,000 RPM Precision CAD/CAM & High-Speed CNC Engineering',
      status: 'Operational Subsidiary',
      statusColor: theme.colors.cyan,
      desc: 'High-precision digital CAD/CAM design engineering, automated CNC toolpath optimization, and architectural manufacturing systems running 24,000 RPM spindles.',
      highlights: [
        'Custom CAD/CAM Digital Blueprinting & parametric relief carving',
        'Zero-waste sheet nesting algorithms reducing hardwood/MDF scrap by 15% - 30%',
        'Official domain redirect cluster: alicnc.pk & alicnc.online -> alicnc.rmaa.pk',
      ],
      primaryAction: { label: 'Visit alicnc.rmaa.pk ↗', url: 'https://alicnc.rmaa.pk' },
    },
  ];

  return (
    <View style={styles.sectionWrapper} id="ventures">
      <View style={styles.container}>
        <View style={styles.headerArea}>
          <Text style={styles.sectionTag}>HOLDING PORTFOLIO &amp; OPERATING ENTITIES</Text>
          <Text style={styles.sectionTitle}>
            Autonomous Engineering at <Text style={styles.highlight}>Industrial Scale</Text>
          </Text>
          <Text style={styles.sectionDesc}>
            RMAA Holdings operates focused, vertically integrated technological capabilities across 
            physical machining, real-time edge telemetry, and CAD/CAM automation.
          </Text>
        </View>

        <View style={styles.projectsGrid}>
          {subsidiaries.map((sub, idx) => (
            <View key={idx} style={styles.projectCard}>
              <View style={styles.cardTop}>
                <View style={styles.titleGroup}>
                  <Text style={styles.repoTag}>{sub.category}</Text>
                  <Text style={styles.projectTitle}>{sub.name}</Text>
                </View>
                <View style={[styles.statusBadge, { borderColor: sub.statusColor }]}>
                  <Text style={[styles.statusBadgeText, { color: sub.statusColor }]}>{sub.status}</Text>
                </View>
              </View>

              <Text style={styles.tagline}>{sub.tagline}</Text>
              <Text style={styles.projectDesc}>{sub.desc}</Text>

              <View style={styles.highlightsBox}>
                <Text style={styles.highlightsHeader}>SYSTEM CAPABILITIES:</Text>
                {sub.highlights.map((h, hIdx) => (
                  <View key={hIdx} style={styles.highlightBullet}>
                    <Text style={styles.bulletDot}>▸</Text>
                    <Text style={styles.bulletText}>{h}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionsRow}>
                <Pressable onPress={() => openUrl(sub.primaryAction.url)} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>{sub.primaryAction.label}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    paddingVertical: 60,
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
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 14,
  },
  highlight: {
    color: theme.colors.cyan,
  },
  sectionDesc: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    maxWidth: 720,
    lineHeight: 24,
  },
  projectsGrid: {
    gap: 24,
    marginBottom: 12,
  },
  projectCard: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: 24,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 12,
  },
  titleGroup: {
    flex: 1,
    minWidth: 260,
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  repoTag: {
    fontSize: 11,
    color: theme.colors.cyan,
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: theme.fonts.mono,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.cyan,
    marginBottom: 10,
  },
  projectDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  highlightsBox: {
    backgroundColor: 'rgba(9, 10, 15, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.radii.md,
    padding: 14,
    marginBottom: 18,
  },
  highlightsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  highlightBullet: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bulletDot: {
    color: theme.colors.cyan,
    fontSize: 12,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    cursor: 'pointer' as any,
  },
  actionButtonText: {
    color: theme.colors.cyan,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: theme.fonts.mono,
  },
});
