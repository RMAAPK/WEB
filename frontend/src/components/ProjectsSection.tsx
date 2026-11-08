import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../theme';

export const ProjectsSection: React.FC = () => {
  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const holdingProjects = [
    {
      name: 'Forge AI NcStudio Sentinel',
      tag: 'Micro-Acoustic Defense Kernel',
      badge: 'Production Deployed',
      badgeColor: '#10B981',
      desc: '17 KB zero-dependency Win32 sentinel executing alongside CNC motion controllers. Listens to high-frequency spindle excitation harmonics and executes emergency E-stop intervention before carbide tool breakage occurs.',
      tech: ['17 KB C++ Win32 Sentinel', 'Sub-30ms FFT Anomaly Detector', 'Weihong NCStudio Hook', 'Shop Floor Hardened'],
      actions: [
        { label: 'Explore Architecture', url: 'https://alicnc.rmaa.pk/#forgeai' },
      ],
    },
    {
      name: 'Global Acoustic Ground-Truth RAG',
      tag: '48 GB Excitation Database',
      badge: 'Cloud Harvester Active',
      badgeColor: '#A855F7',
      desc: 'Distributed multi-worker harvester across Kaggle and Hugging Face. Processes 8,000 categories into 1,500 temporal states and 2,000 linear frequency bins, stripping vocal timbres to yield an invariant mathematical acoustic primitive.',
      tech: ['Dual NVIDIA T4 GPU Cluster', 'Zero Local Storage Footprint', 'Demucs Stem Separation', 'Hugging Face Dataset API'],
      actions: [
        { label: 'Dataset Bucket (rmaapk/music)', url: 'https://huggingface.co/datasets/rmaapk/music' },
      ],
    },
    {
      name: 'GK (Gemini Killer) Sentinel',
      tag: 'Mobile Native Interface',
      badge: 'Active Android App',
      badgeColor: '#38BDF8',
      desc: 'Ultra-lightweight Android assistant engine replacing bloated Google Quick Search Box with a full-screen Material 3 interface, instant hot-reloading hooks, camera multimodal pipelines, and permanent hardware RAM-lock.',
      tech: ['com.rmaa.gk', 'Release Signed Key', 'ZRAM Optimization Hook', 'Zero Telemetry Overhead'],
      actions: [
        { label: 'GitHub Repository', url: 'https://github.com/RMAAPK/gk' },
      ],
    },
    {
      name: 'Ali CNC Automated Machining Core',
      tag: 'High-Speed CNC Manufacturing',
      badge: 'Operational Facility',
      badgeColor: '#38BDF8',
      desc: 'High-speed automated fabrication facility operating 24,000 RPM precision spindles with sub-millimeter tolerances across Sheesham hardwoods, architectural paneling, non-ferrous aluminum, and precision acrylics.',
      tech: ['24,000 RPM Spindles', 'High-Feed Solid Carbide Tooling', 'Vacuum Bed Fixturing', 'Sub-Millimeter QC'],
      actions: [
        { label: 'Visit alicnc.rmaa.pk ↗', url: 'https://alicnc.rmaa.pk' },
        { label: 'View Shop Catalog', url: 'https://alicnc.rmaa.pk/catalog' },
      ],
    },
    {
      name: 'AliPact High-Throughput Harvester',
      tag: 'Distributed Proxy Network',
      badge: 'Enterprise Infrastructure',
      badgeColor: '#06B6D4',
      desc: 'Multi-datacenter proxy rotation network routing asynchronous data pipelines with zero downtime, automated IP failovers, and rigorous byte-level audit logging.',
      tech: ['DataImpulse Datacenter Transit', 'Asyncio Python Workers', 'Fault-Tolerant Retries', 'Zero-Loss Telemetry'],
      actions: [
        { label: 'Infrastructure Specs', url: 'mailto:say@rmaa.pk' },
      ],
    },
    {
      name: 'RMAA Autonomous Quantitative Sentinel',
      tag: 'Algorithmic Market Intelligence',
      badge: 'Internal System',
      badgeColor: '#F59E0B',
      desc: 'Low-latency market surveillance engine analyzing order-flow imbalances, whale wallet flows, and macroeconomic signals with automated risk enforcement.',
      tech: ['WebSocket Data Streaming', 'Real-time Signal Arbitrage', 'SQLite Ledger', 'Autonomous Workers'],
      actions: [
        { label: 'Contact Group Desk', url: 'mailto:say@rmaa.pk' },
      ],
    },
  ];

  return (
    <View style={styles.sectionWrapper} id="projects">
      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <Text style={styles.sectionPill}>R&amp;D LABS &amp; DEPLOYED ENGINES</Text>
          <Text style={styles.sectionTitle}>
            Core Technology <Text style={styles.highlightText}>Arsenal</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>
            Autonomous software engines, hardware-adjacent sentinels, and industrial infrastructure 
            developed and actively deployed across RMAA Holdings entities.
          </Text>
        </View>

        <View style={styles.grid}>
          {holdingProjects.map((p, idx) => (
            <View key={idx} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tagText}>{p.tag.toUpperCase()}</Text>
                  <Text style={styles.cardTitle}>{p.name}</Text>
                </View>
                <View style={[styles.badge, { borderColor: p.badgeColor, backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                  <Text style={[styles.badgeText, { color: p.badgeColor }]}>{p.badge}</Text>
                </View>
              </View>

              <Text style={styles.descText}>{p.desc}</Text>

              <View style={styles.techWrap}>
                {p.tech.map((t, tIdx) => (
                  <View key={tIdx} style={styles.techPill}>
                    <Text style={styles.techText}>{t}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionsWrap}>
                {p.actions.map((act, aIdx) => (
                  <Pressable key={aIdx} onPress={() => openUrl(act.url)} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>{act.label}</Text>
                  </Pressable>
                ))}
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
    paddingVertical: 80,
    paddingHorizontal: 20,
    backgroundColor: '#090A0F',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  container: {
    width: '100%',
    maxWidth: 1100,
  },
  headerBlock: {
    marginBottom: 44,
  },
  sectionPill: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: theme.fonts.mono,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  highlightText: {
    color: '#38BDF8',
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
    maxWidth: 750,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    flex: 1,
    minWidth: 320,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 24,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badge: {
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: theme.fonts.mono,
  },
  descText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 18,
  },
  techWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  techPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  techText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: theme.fonts.mono,
  },
  actionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
});
