import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../theme';

export const LeadershipSection: React.FC = () => {
  return (
    <View style={styles.sectionWrapper} id="leadership">
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.pillText}>EXECUTIVE LEADERSHIP &amp; FOUNDER</Text>
              <Text style={styles.nameTitle}>Raja Muhammad Ali Asghar</Text>
              <Text style={styles.roleSub}>Founder &amp; Managing Partner, RMAA Holdings</Text>
            </View>
            <View style={styles.legalBadge}>
              <Text style={styles.legalText}>NTN: 3740522733567</Text>
              <Text style={styles.legalSub}>FBR Registered Sole Proprietorship</Text>
            </View>
          </View>

          <Text style={styles.statementText}>
            "RMAA Holdings was architected around a single uncompromising principle: real-world physics 
            and computation must converge at millisecond scale. Whether writing high-speed C++ kernels 
            for CNC controllers, training distributed neural acoustic sentinels, or managing 24,000 RPM 
            industrial machinery on the factory floor in Rawalpindi, our companies build tangible, 
            zero-overhead technologies designed for raw industrial execution."
          </Text>

                    <View style={styles.credentialRow}>
            <View style={styles.credItem}>
              <Text style={styles.credVal}>Remote / Home Office</Text>
              <Text style={styles.credLbl}>Base of Operations (Rawalpindi)</Text>
            </View>
            <View style={styles.credItem}>
              <Text style={styles.credVal}>NTN: 3740522733567</Text>
              <Text style={styles.credLbl}>FBR Registered</Text>
            </View>
            <View style={styles.credItem}>
              <Text style={styles.credVal}>say@rmaa.pk</Text>
              <Text style={styles.credLbl}>Direct Line</Text>
            </View>
          </View>

          <View style={styles.footerNote}>
            <Text style={styles.footerNoteText}>
              Official legal registration on record with FBR Pakistan under Registration No: 3740522733567. 
              Holding vehicle operating Forge AI, Ali CNC, VectorVision, SVGV, AliPact, and the RMAA Labs.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    paddingVertical: 70,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  container: {
    width: '100%',
    maxWidth: 1100,
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  pillText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '800',
    fontFamily: theme.fonts.mono,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  nameTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  roleSub: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  legalBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  legalText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 13,
    fontFamily: theme.fonts.mono,
  },
  legalSub: {
    color: '#6EE7B7',
    fontSize: 11,
    marginTop: 2,
  },
  statementText: {
    fontSize: 15,
    lineHeight: 26,
    color: '#E2E8F0',
    fontStyle: 'italic',
    marginBottom: 28,
  },
  credentialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  credItem: {
    flex: 1,
    minWidth: 150,
  },
  credVal: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  credLbl: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
    fontFamily: theme.fonts.mono,
    textTransform: 'uppercase',
  },
  footerNote: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 8,
  },
  footerNoteText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 18,
    fontFamily: theme.fonts.mono,
  },
});
