import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../theme';

export const YcDemoPage: React.FC = () => {
  // Machine Simulation State
  const [rpm, setRpm] = useState<number>(18000);
  const [flutes, setFlutes] = useState<number>(2);
  const [isChatter, setIsChatter] = useState<boolean>(false);
  const [feedRate, setFeedRate] = useState<number>(100);
  const [interventionTriggered, setInterventionTriggered] = useState<boolean>(false);
  const [interventionLatency, setInterventionLatency] = useState<number>(14.8);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [logEntries, setLogEntries] = useState<Array<{ time: string; text: string; type: 'info' | 'warn' | 'success' | 'alert' }>>([
    { time: '12:00:01', text: 'Forge AI Kernel Online. Spindle acoustic impedance monitoring armed.', type: 'info' },
    { time: '12:00:02', text: 'Baseline tooth-pass tracking at 18,000 RPM (ftp: 600 Hz nominal).', type: 'info' }
  ]);

  // Audio & Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const chatterOscRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Fundamental tooth-pass calculation: ftp = (RPM * Flutes) / 60
  const toothPassFreq = Math.round((rpm * flutes) / 60);

  // Audio Toggle
  const toggleAudio = () => {
    if (soundEnabled) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setSoundEnabled(false);
    } else {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtxClass();
        const mainGain = ctx.createGain();
        mainGain.gain.setValueAtTime(0.04, ctx.currentTime);
        mainGain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(toothPassFreq, ctx.currentTime);
        osc.connect(mainGain);
        osc.start();

        const chatterOsc = ctx.createOscillator();
        chatterOsc.type = 'square';
        chatterOsc.frequency.setValueAtTime(2420, ctx.currentTime);

        const chatterGain = ctx.createGain();
        chatterGain.gain.setValueAtTime(isChatter && !interventionTriggered ? 0.08 : 0.0, ctx.currentTime);
        chatterOsc.connect(chatterGain);
        chatterGain.connect(ctx.destination);
        chatterOsc.start();

        audioCtxRef.current = ctx;
        oscRef.current = osc;
        chatterOscRef.current = chatterOsc;
        gainNodeRef.current = chatterGain;
        setSoundEnabled(true);
      } catch (err) {
        console.error('Audio init error:', err);
      }
    }
  };

  // Sync Audio Pitch
  useEffect(() => {
    if (oscRef.current && audioCtxRef.current) {
      oscRef.current.frequency.setValueAtTime(toothPassFreq, audioCtxRef.current.currentTime);
    }
  }, [toothPassFreq]);

  // Sync Chatter Audio
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        isChatter && !interventionTriggered ? 0.08 : 0.0,
        audioCtxRef.current.currentTime
      );
    }
  }, [isChatter, interventionTriggered]);

  // Trigger Chatter & Automatic <15ms Sentinel Intervention
  const triggerChatter = () => {
    setIsChatter(true);
    setInterventionTriggered(false);
    const now = new Date().toLocaleTimeString();
    const simulatedLatency = Number((12 + Math.random() * 4).toFixed(1));
    setInterventionLatency(simulatedLatency);

    setLogEntries((prev) => [
      { time: now, text: '⚠️ HARMONIC RESONANCE SPIKE: 2.42 kHz acoustic anomaly detected (>1.82g RMS).', type: 'warn' },
      ...prev.slice(0, 7)
    ]);

    // Sub-30ms automated intervention simulation
    setTimeout(() => {
      const actTime = new Date().toLocaleTimeString();
      setInterventionTriggered(true);
      setFeedRate(25);
      setLogEntries((prev) => [
        { time: actTime, text: `⚡ SENTINEL INTERVENTION (${simulatedLatency}ms): Dispatched hardware feed-hold & optical E-Stop override. Feed reduced to 25%.`, type: 'alert' },
        { time: actTime, text: '✅ TOOL SAVED: Dynamic deflection dampened. Carbide bit intact, raw stock preserved.', type: 'success' },
        ...prev.slice(0, 7)
      ]);
    }, 450);
  };

  const resetCut = () => {
    setIsChatter(false);
    setInterventionTriggered(false);
    setFeedRate(100);
    const now = new Date().toLocaleTimeString();
    setLogEntries((prev) => [
      { time: now, text: `🔄 Spindle stabilized at ${rpm.toLocaleString()} RPM. Full 100% feed restored.`, type: 'info' },
      ...prev.slice(0, 7)
    ]);
  };

  // Waveform rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.fillStyle = '#090A0F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Waveform
      const centerY = canvas.height / 2;
      ctx.beginPath();
      ctx.lineWidth = 2.5;

      if (isChatter && !interventionTriggered) {
        ctx.strokeStyle = '#EF4444'; // Red danger
      } else if (interventionTriggered) {
        ctx.strokeStyle = '#10B981'; // Green stabilized
      } else {
        ctx.strokeStyle = '#38BDF8'; // Blue normal
      }

      const wavelength = 50000 / (toothPassFreq || 1);

      for (let x = 0; x < canvas.width; x++) {
        const fundamental = Math.sin(x / wavelength + phase) * 24;
        let harmonic = Math.sin((x / wavelength) * 2 + phase * 2) * 6;
        let chatter = 0;

        if (isChatter && !interventionTriggered) {
          // Destructive chatter harmonics (2.4 kHz)
          chatter = (Math.sin(x / 3.8 + phase * 4) + (Math.random() - 0.5) * 0.8) * 38;
        } else if (interventionTriggered) {
          // Dampened & clamped
          chatter = Math.sin(x / 14 + phase) * 4;
        }

        const y = centerY + fundamental + harmonic + chatter;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Top text indicators on canvas
      ctx.font = '11px monospace';
      if (isChatter && !interventionTriggered) {
        ctx.fillStyle = '#EF4444';
        ctx.fillText('🔴 CRITICAL: 2.42 kHz REGENERATIVE CHATTER SPIKE DETECTED', 16, 24);
      } else if (interventionTriggered) {
        ctx.fillStyle = '#10B981';
        ctx.fillText(`⚡ OPTICAL FEED-HOLD ENGAGED (${interventionLatency}ms) — TOOL DEFLECTION STABILIZED`, 16, 24);
      } else {
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(`🟢 NOMINAL HARMONIC: ftp = ${toothPassFreq} Hz | 0.18g RMS VIBRATION`, 16, 24);
      }

      phase += 0.08 * (feedRate / 100);
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [toothPassFreq, isChatter, interventionTriggered, feedRate, interventionLatency]);

  return (
    <ScrollView style={styles.scrollRoot} contentContainerStyle={styles.container}>
      {/* Top YC Partner Banner */}
      <View style={styles.partnerBanner}>
        <View style={styles.badgeRow}>
          <View style={styles.ycBadge}>
            <Text style={styles.ycBadgeText}>Y COMBINATOR WINTER 2027 REVIEW</Text>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>⏱️ 30-SECOND INTERACTIVE DEMO</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>AI Tool Breakage Protection for CNCs</Text>
        <Text style={styles.heroSub}>
          Sub-$10 magnetic sensor pod on the spindle housing. Detects structural acoustic chatter &amp; deflection in{' '}
          <Text style={{ color: '#10B981', fontWeight: 'bold' }}>&lt; 30ms</Text> to halt machine feed before carbide bits snap or stock is ruined.
        </Text>
      </View>

      {/* Main Interactive Demo Box */}
      <View style={styles.demoCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardSectionTag}>LIVE SHOP-FLOOR TELEMETRY SENTINEL</Text>
            <Text style={styles.cardTitle}>Spindle Acoustic Impedance &amp; Fast E-Stop</Text>
          </View>
          <View style={styles.actionButtons}>
            <Pressable onPress={toggleAudio} style={[styles.btnSecondary, soundEnabled && styles.btnActive]}>
              <Text style={styles.btnSecondaryText}>
                {soundEnabled ? '🔊 Sound Muted' : '🔈 Spindle Audio'}
              </Text>
            </Pressable>

            {!isChatter ? (
              <Pressable onPress={triggerChatter} style={styles.btnDanger}>
                <Text style={styles.btnDangerText}>⚠️ Trigger Regenerative Chatter</Text>
              </Pressable>
            ) : (
              <Pressable onPress={resetCut} style={styles.btnSuccess}>
                <Text style={styles.btnSuccessText}>🔄 Reset Spindle to 100%</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Live Canvas Waveform */}
        <View style={styles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            width={780}
            height={200}
            style={{ width: '100%', height: '200px', display: 'block' }}
          />
        </View>

        {/* Live Sensor Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>SPINDLE SPEED</Text>
            <Text style={styles.metricValue}>{rpm.toLocaleString()} RPM</Text>
            <Text style={styles.metricSub}>Tooth-Pass fundamental: {toothPassFreq} Hz</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>VIBRATION ACCEL (RMS)</Text>
            <Text style={[styles.metricValue, { color: isChatter && !interventionTriggered ? '#EF4444' : '#10B981' }]}>
              {isChatter && !interventionTriggered ? '1.84 g 🚨' : '0.18 g ✅'}
            </Text>
            <Text style={styles.metricSub}>Trigger threshold: &gt; 1.20 g</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>NC CONTROLLER FEED</Text>
            <Text style={[styles.metricValue, { color: feedRate < 100 ? '#F59E0B' : '#10B981' }]}>
              {feedRate}%
            </Text>
            <Text style={styles.metricSub}>
              {interventionTriggered ? `Throttled in ${interventionLatency}ms` : 'Nominal chip-load rate'}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>HARDWARE INTERVENTION</Text>
            <Text style={[styles.metricValue, { color: interventionTriggered ? '#10B981' : isChatter ? '#EF4444' : '#38BDF8' }]}>
              {interventionTriggered ? '< 15ms' : isChatter ? 'ANOMALY' : 'ARMED'}
            </Text>
            <Text style={styles.metricSub}>Optical feed-hold loop</Text>
          </View>
        </View>

        {/* Real-time Hardware Event Log */}
        <View style={styles.logContainer}>
          <Text style={styles.logHeader}>SENTINEL EVENT LOG (STORE &amp; FORWARD STREAM):</Text>
          {logEntries.map((entry, idx) => (
            <View key={idx} style={styles.logLine}>
              <Text style={styles.logTime}>[{entry.time}]</Text>
              <Text
                style={[
                  styles.logText,
                  entry.type === 'warn' && { color: '#F59E0B' },
                  entry.type === 'alert' && { color: '#38BDF8', fontWeight: 'bold' },
                  entry.type === 'success' && { color: '#10B981', fontWeight: 'bold' },
                ]}
              >
                {entry.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 4 Essential Application Pillars */}
      <View style={styles.pillarsGrid}>
        {/* Pillar 1: The Problem & The $10 Pod */}
        <View style={styles.pillarCard}>
          <Text style={styles.pillarTag}>01 • THE HARDWARE ARCHITECTURE</Text>
          <Text style={styles.pillarTitle}>Sub-$10 Spindle Pod</Text>
          <Text style={styles.pillarBody}>
            Legacy vibration systems (Siemens, Montronix, Artis) cost $5,000–$15,000+ per machine with invasive electrical installs. 
            We use an ESP32-S3 microcontroller coupled with an industrial piezo acoustic transducer inside a magnetic housing. 
            Mounts directly onto any spindle in 30 seconds.
          </Text>
          <View style={styles.keyVal}>
            <Text style={styles.keyText}>Hardware BOM:</Text>
            <Text style={styles.valText}>Sub-$10 ($19 alpha kit)</Text>
          </View>
          <View style={styles.keyVal}>
            <Text style={styles.keyText}>Install Time:</Text>
            <Text style={styles.valText}>30 seconds (magnetic mount)</Text>
          </View>
        </View>

        {/* Pillar 2: The Tuned Mass Damper Hack */}
        <View style={styles.pillarCard}>
          <Text style={styles.pillarTag}>02 • FOUNDER GROUND TRUTH HACK</Text>
          <Text style={styles.pillarTitle}>The Tuned-Mass Damper</Text>
          <Text style={styles.pillarBody}>
            When imported carbide bits suffered 3-week customs delays in Pakistan, uncalibrated router gantries snapped tools on dense hardwood. 
            Instead of cutting feed rates by 50% (which burns timber and halves throughput), founder Ali engineered a tuned-mass damper on the gantry using scrap pulleys, bearing sleeves, and lead shot. Eliminated chatter spikes and boosted feeds 1.8x with zero breakage.
          </Text>
          <View style={styles.keyVal}>
            <Text style={styles.keyText}>Chatter Elimination:</Text>
            <Text style={styles.valText}>100% vibration peak absorbed</Text>
          </View>
          <View style={styles.keyVal}>
            <Text style={styles.keyText}>Feed Speed Increase:</Text>
            <Text style={styles.valText}>1.8x without tool fracture</Text>
          </View>
        </View>

        {/* Pillar 3: Dual Aerospace CAD/CAM Certifications */}
        <View style={styles.pillarCard}>
          <Text style={styles.pillarTag}>03 • TECHNICAL QUALIFICATION</Text>
          <Text style={styles.pillarTitle}>TITANS of CNC Certified</Text>
          <Text style={styles.pillarBody}>
            Self-taught programmer and machinist from age 5 operating on low-spec hardware without formal engineering school. 
            Earned dual aerospace-grade certifications from the global TITANS of CNC Academy covering high-precision tolerances and feeds/speeds:
          </Text>
          <View style={styles.certRow}>
            <View style={styles.certBadge}>
              <Text style={styles.certTitle}>TITAN-2M CAD/CAM</Text>
              <Text style={styles.certId}>ID: 6074cf11</Text>
            </View>
            <View style={styles.certBadge}>
              <Text style={styles.certTitle}>TITAN-3M CAD/CAM</Text>
              <Text style={styles.certId}>ID: 6fe6283d</Text>
            </View>
          </View>
          <Text style={[styles.pillarBody, { marginTop: 10 }]}>
            Over 400 commercial production relief files, parametric G-code toolpaths, and custom automation scripts deployed.
          </Text>
        </View>

        {/* Pillar 4: Business Model & Uncopyable Moat */}
        <View style={styles.pillarCard}>
          <Text style={styles.pillarTag}>04 • BUSINESS MODEL &amp; DATA MOAT</Text>
          <Text style={styles.pillarTitle}>B2B SaaS &amp; Data Moat</Text>
          <Text style={styles.pillarBody}>
            <Text style={{ fontWeight: 'bold', color: '#fff' }}>Economics:</Text> $30–$50/mo per active spindle SaaS. 25,000 active machines = <Text style={{ color: '#10B981', fontWeight: 'bold' }}>$12M ARR</Text> with 85%+ software margins.
          </Text>
          <Text style={[styles.pillarBody, { marginTop: 8 }]}>
            <Text style={{ fontWeight: 'bold', color: '#fff' }}>The Uncopyable Moat:</Text> Every connected spindle streams real-world cutting harmonics (material hardness, feed speed, tooth wear curves). We turn distributed workshops into an autonomous fabrication dataset for physical lights-out manufacturing.
          </Text>
          <View style={styles.keyVal}>
            <Text style={styles.keyText}>Target Pricing:</Text>
            <Text style={styles.valText}>$30–$50 / month / machine</Text>
          </View>
          <View style={styles.keyVal}>
            <Text style={styles.keyText}>Distribution:</Text>
            <Text style={styles.valText}>Bundled with CAD/CAM relief catalog</Text>
          </View>
        </View>
      </View>

      {/* Founder Direct Contact Footer */}
      <View style={styles.contactFooter}>
        <Text style={styles.contactTitle}>Direct Founder Line</Text>
        <Text style={styles.contactSub}>
          Raja Muhammad Ali Asghar • Founder &amp; CEO (100% Equity) • Rawalpindi, Pakistan
        </Text>
        <View style={styles.contactButtons}>
          <a
            href="mailto:say@rmaa.pk?subject=YC%20Winter%202027%20-%20Ali%20CNC%20Demo"
            style={{ textDecoration: 'none' }}
          >
            <View style={styles.contactBtnPrimary}>
              <Text style={styles.contactBtnPrimaryText}>✉️ say@rmaa.pk</Text>
            </View>
          </a>
          <a
            href="https://wa.me/923440708494?text=Hi%20Ali,%20watching%20the%20Forge%20AI%20YC%20Demo."
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <View style={styles.contactBtnSecondary}>
              <Text style={styles.contactBtnSecondaryText}>📱 WhatsApp: +92 344 0708494</Text>
            </View>
          </a>
          <a
            href="https://github.com/thealidev"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <View style={styles.contactBtnSecondary}>
              <Text style={styles.contactBtnSecondaryText}>💻 github.com/thealidev</Text>
            </View>
          </a>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollRoot: {
    flex: 1,
    backgroundColor: '#090A0F',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 80,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  partnerBanner: {
    marginBottom: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  ycBadge: {
    backgroundColor: 'rgba(235, 94, 40, 0.15)',
    borderColor: '#eb5e28',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ycBadgeText: {
    color: '#eb5e28',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: theme.fonts.mono,
    letterSpacing: 0.5,
  },
  timeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: theme.fonts.mono,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F9FAFB',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
    maxWidth: 780,
  },
  demoCard: {
    backgroundColor: '#11131B',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 24,
    marginBottom: 32,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 18,
  },
  cardSectionTag: {
    color: '#38BDF8',
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardTitle: {
    color: '#F3F4F6',
    fontSize: 20,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  btnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8',
  },
  btnSecondaryText: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDanger: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  btnDangerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  btnSuccess: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  btnSuccessText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  canvasWrapper: {
    backgroundColor: '#090A0F',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#0D0F16',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  metricLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricValue: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  metricSub: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  logContainer: {
    backgroundColor: '#090A0F',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  logHeader: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    marginBottom: 8,
  },
  logLine: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  logTime: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: theme.fonts.mono,
  },
  logText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: theme.fonts.mono,
    flex: 1,
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  pillarCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#11131B',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  pillarTag: {
    color: '#eb5e28',
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  pillarTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  pillarBody: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  keyVal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
  },
  keyText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  valText: {
    color: '#F3F4F6',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: theme.fonts.mono,
  },
  certRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  certBadge: {
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  certTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  certId: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: theme.fonts.mono,
  },
  contactFooter: {
    backgroundColor: '#11131B',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    textAlign: 'center' as any,
    alignItems: 'center',
  },
  contactTitle: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  contactSub: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 18,
    textAlign: 'center',
  },
  contactButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  contactBtnPrimary: {
    backgroundColor: '#eb5e28',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  contactBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  contactBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  contactBtnSecondaryText: {
    color: '#D1D5DB',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default YcDemoPage;

