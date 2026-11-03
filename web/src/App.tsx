import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import logoUrl from './assets/rmaa_holdings_transparent.png';

export const App: React.FC = () => {
  const [spindleRpm, setSpindleRpm] = useState(24000);
  const [statusActive, setStatusActive] = useState(true);
  const [sentinelLatency, setSentinelLatency] = useState(4.2);

  useEffect(() => {
    const timer = setInterval(() => {
      const variance = (Math.random() - 0.5) * 60;
      setSpindleRpm(Math.round(24000 + variance));
      setSentinelLatency(Number((3.8 + Math.random() * 0.9).toFixed(1)));
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.root}>
      {/* Precision Machinist Top Bar */}
      <View style={styles.topBanner}>
        <View style={styles.topBannerInner}>
          <View style={styles.indicatorGroup}>
            <View style={styles.pulseDot} />
            <Text style={styles.topBannerMono}>RMAA INDUSTRIAL OS // SPINDLE CLUSTER ACTIVE</Text>
          </View>
          <View style={styles.topBannerStats}>
            <Text style={styles.topBannerStatItem}>RPM: <Text style={styles.orange}>{spindleRpm.toLocaleString()}</Text></Text>
            <Text style={styles.topBannerStatDivider}>|</Text>
            <Text style={styles.topBannerStatItem}>DEFENSE: <Text style={styles.orange}>&lt; {sentinelLatency}ms</Text></Text>
            <Text style={styles.topBannerStatDivider}>|</Text>
            <Text style={styles.topBannerStatItem}>IPO APP: <Text style={styles.white}>890258</Text></Text>
          </View>
        </View>
      </View>

      {/* Main Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.brandName}>RMAA HOLDINGS</Text>
            <Text style={styles.brandTagline}>INDUSTRIAL DEEP-TECH &amp; AUTONOMOUS DEFENSE</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => window.location.href = '/accounts'} style={styles.accountsBtn}>
            <Text style={styles.accountsBtnText}>PORTAL SSO ↗</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Industrial Statement Section */}
        <View style={styles.heroSection}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>AUTONOMOUS SPINDLE DEFENSE &amp; CNC FABRICATION</Text>
          </View>
          
          <Text style={styles.heroTitle}>
            Engineering Zero-Failure <Text style={styles.heroHighlight}>Industrial Systems</Text> at the Mechanical Edge.
          </Text>

          <Text style={styles.heroSubtitle}>
            RMAA Holdings operates at the convergence of heavy precision CNC manufacturing, sub-10ms acoustic AI defense sentinels, and zero-overhead distributed systems.
          </Text>

          {/* Quick Hardware Spec Strip */}
          <View style={styles.specStrip}>
            <View style={styles.specBox}>
              <Text style={styles.specNum}>24,000</Text>
              <Text style={styles.specLabel}>SPINDLE RPM CAP</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specNum}>&lt; 10ms</Text>
              <Text style={styles.specLabel}>HARMONIC DEFENSE</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specNum}>17 KB</Text>
              <Text style={styles.specLabel}>WIN32 SENTINEL</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specNum}>C++20</Text>
              <Text style={styles.specLabel}>MICRO-GATEWAY</Text>
            </View>
          </View>
        </View>

        {/* Operating Units Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>OPERATING ENTITIES &amp; DIVISIONS</Text>
            <Text style={styles.sectionStatus}>2 UNITS DEPLOYED</Text>
          </View>

          {/* Forge AI Card */}
          <View style={styles.industrialCard}>
            <View style={styles.cardHeader}>
              <View>
                <View style={styles.unitBadgeRow}>
                  <Text style={styles.unitBadgeOrange}>DEFENSE SENTINEL</Text>
                  <Text style={styles.unitStatusDot}>● LIVE</Text>
                </View>
                <Text style={styles.unitTitle}>Forge AI</Text>
              </View>
              <Pressable onPress={() => window.location.href = '/forge'} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>ACCESS FORGE AI ↗</Text>
              </Pressable>
            </View>
            <Text style={styles.unitDesc}>
              Sub-10ms acoustic spindle vibration defense and predictive carbide tool breakage prevention for industrial CNC controllers. Isolates destructive tooth-pass harmonic deflection before catastrophic fractures.
            </Text>
            <View style={styles.unitMetaRow}>
              <Text style={styles.unitMetaItem}><Text style={styles.orange}>Target:</Text> Weihong PCIMC-3D / NcStudio / Mach3</Text>
              <Text style={styles.unitMetaItem}><Text style={styles.orange}>Latency:</Text> 3.8ms - 4.2ms DSP Loop</Text>
              <Text style={styles.unitMetaItem}><Text style={styles.orange}>Binary:</Text> Native Win32 C#</Text>
            </View>
          </View>

          {/* Ali CNC Card */}
          <View style={styles.industrialCard}>
            <View style={styles.cardHeader}>
              <View>
                <View style={styles.unitBadgeRow}>
                  <Text style={styles.unitBadgeOrange}>MANUFACTURING &amp; CAD/CAM</Text>
                  <Text style={styles.unitStatusDot}>● PRODUCTION</Text>
                </View>
                <Text style={styles.unitTitle}>Ali CNC</Text>
              </View>
              <Pressable onPress={() => window.location.href = '/alicnc'} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>ACCESS ALI CNC ↗</Text>
              </Pressable>
            </View>
            <Text style={styles.unitDesc}>
              Premier 24,000 RPM precision CNC manufacturing studio, parametric CAD/CAM drafting, 3D relief carving, and high-efficiency G-code toolpath engineering in Rawalpindi, Pakistan.
            </Text>
            <View style={styles.unitMetaRow}>
              <Text style={styles.unitMetaItem}><Text style={styles.orange}>Spindle:</Text> 3.2 kW Water-Cooled High-Torque</Text>
              <Text style={styles.unitMetaItem}><Text style={styles.orange}>Toolpaths:</Text> Vectric Aspire / AutoCAD / Onshape</Text>
              <Text style={styles.unitMetaItem}><Text style={styles.orange}>Trademark:</Text> IPO Application 890258</Text>
            </View>
          </View>
        </View>

        {/* Corporate & Executive Blueprint */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>CORPORATE &amp; STATUTORY RECORD</Text>
            <Text style={styles.sectionStatus}>FBR FORM 181</Text>
          </View>

          <View style={styles.recordGrid}>
            <View style={styles.recordBox}>
              <Text style={styles.recordLabel}>FOUNDER &amp; CHIEF ARCHITECT</Text>
              <Text style={styles.recordVal}>Raja Muhammad Ali Asghar</Text>
              <Text style={styles.recordSub}>Lead Spindle Operator &amp; Systems Engineer</Text>
            </View>

            <View style={styles.recordBox}>
              <Text style={styles.recordLabel}>STATUTORY REGISTRATION (FBR)</Text>
              <Text style={styles.recordVal}>NTN: 3740522733567</Text>
              <Text style={styles.recordSub}>Government of Pakistan Registered Tax Entity</Text>
            </View>

            <View style={styles.recordBox}>
              <Text style={styles.recordLabel}>TRADEMARK REGISTRY</Text>
              <Text style={styles.recordVal}>ALI CNC (IPO App: 890258)</Text>
              <Text style={styles.recordSub}>Class 42 Scientific &amp; Technological Services</Text>
            </View>

            <View style={styles.recordBox}>
              <Text style={styles.recordLabel}>HEADQUARTERS &amp; WORKS</Text>
              <Text style={styles.recordVal}>Rawalpindi, Punjab, Pakistan</Text>
              <Text style={styles.recordSub}>Industrial Sector, 46000</Text>
            </View>
          </View>
        </View>

        {/* Industrial Machinist Footer */}
        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={styles.footerBrand}>
              <Text style={styles.footerLogoText}>RMAA HOLDINGS</Text>
              <Text style={styles.footerSubText}>Industrial Deep-Tech • Autonomous Edge Defense • Precision Fabrication</Text>
            </View>

            <View style={styles.footerLinks}>
              <Text style={styles.footerLinkItem}>Direct: <Text style={styles.orange} onPress={() => window.location.href = 'mailto:say@rmaa.pk'}>say@rmaa.pk</Text></Text>
              <Text style={styles.footerLinkDivider}>//</Text>
              <Text style={styles.footerLinkItem}>Direct Dispatch: <Text style={styles.orange}>+92 344 0708494</Text></Text>
              <Text style={styles.footerLinkDivider}>//</Text>
              <Text style={styles.footerLinkItem}>GitHub: <Text style={styles.orange} onPress={() => window.open('https://github.com/thealidev', '_blank')}>@thealidev</Text></Text>
            </View>
          </View>

          <View style={styles.copyrightRow}>
            <Text style={styles.copyrightText}>© 2026 RMAA Holdings (Pvt.). All rights reserved. Zero-dependency sovereign edge computing.</Text>
            <Text style={styles.sysStatusText}>SYS: ONLINE | LATENCY: 0.8ms</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08090d',
    minHeight: '100vh' as any,
    color: '#e2e8f0',
  },
  topBanner: {
    backgroundColor: '#040508',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(235, 94, 40, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  topBannerInner: {
    maxWidth: 1100,
    width: '100%',
    marginHorizontal: 'auto' as any,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  indicatorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#eb5e28',
    boxShadow: '0 0 8px #eb5e28' as any,
  },
  topBannerMono: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#eb5e28',
    letterSpacing: 0.5,
  },
  topBannerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBannerStatItem: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#94a3b8',
  },
  topBannerStatDivider: {
    color: '#334155',
    fontSize: 11,
  },
  header: {
    maxWidth: 1100,
    width: '100%',
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    fontFamily: 'monospace',
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#eb5e28',
    letterSpacing: 1.2,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(235, 94, 40, 0.4)',
    borderRadius: 6,
    backgroundColor: 'rgba(235, 94, 40, 0.08)',
    cursor: 'pointer' as any,
  },
  accountsBtnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: '#eb5e28',
    letterSpacing: 0.5,
  },
  container: {
    maxWidth: 1100,
    width: '100%',
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 80,
  },
  heroSection: {
    marginBottom: 56,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(235, 94, 40, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(235, 94, 40, 0.3)',
    borderRadius: 9999,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  badgePillText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#eb5e28',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 48,
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 16,
    maxWidth: 880,
  },
  heroHighlight: {
    color: '#eb5e28',
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: '#94a3b8',
    maxWidth: 820,
    marginBottom: 36,
  },
  specStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  specBox: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#0d0f17',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#eb5e28',
  },
  specNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 56,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 36,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    color: '#eb5e28',
    letterSpacing: 1.5,
  },
  sectionStatus: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#64748b',
  },
  industrialCard: {
    backgroundColor: 'rgba(15, 18, 26, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 16,
    flexWrap: 'wrap',
  },
  unitBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  unitBadgeOrange: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
    color: '#eb5e28',
    letterSpacing: 1,
  },
  unitStatusDot: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  unitTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(235, 94, 40, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(235, 94, 40, 0.4)',
    borderRadius: 6,
    cursor: 'pointer' as any,
  },
  actionBtnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: '#eb5e28',
    letterSpacing: 0.5,
  },
  unitDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: '#94a3b8',
    marginBottom: 16,
  },
  unitMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  unitMetaItem: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#cbd5e1',
  },
  recordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  recordBox: {
    flex: 1,
    minWidth: 240,
    backgroundColor: 'rgba(15, 18, 26, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 20,
  },
  recordLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  recordVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  recordSub: {
    fontSize: 12,
    color: '#94a3b8',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 36,
    backgroundColor: '#040508',
    marginTop: 20,
  },
  footerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24,
  },
  footerBrand: {},
  footerLogoText: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '800',
    color: '#eb5e28',
    marginBottom: 4,
  },
  footerSubText: {
    fontSize: 12,
    color: '#64748b',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerLinkItem: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#94a3b8',
  },
  footerLinkDivider: {
    fontFamily: 'monospace',
    color: '#334155',
    fontSize: 11,
  },
  copyrightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  copyrightText: {
    fontSize: 11,
    color: '#475569',
  },
  sysStatusText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  orange: {
    color: '#eb5e28',
  },
  white: {
    color: '#ffffff',
  },
});

export default App;