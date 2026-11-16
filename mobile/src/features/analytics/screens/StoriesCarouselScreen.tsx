import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { X, ShoppingBag, Banknote, Send } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';

const { width } = Dimensions.get('window');

interface StoriesCarouselScreenProps {
  onClose: () => void;
  onNavigateAction?: (actionType: string) => void;
}

export const StoriesCarouselScreen: React.FC<StoriesCarouselScreenProps> = ({
  onClose,
  onNavigateAction,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 0,
      bgColor: '#EF4444', // Red/Coral from frame 32
      period: 'This Month',
      mainTitle: 'Vacant phototherapy\nstations',
      mainValue: '2',
      cardTitle: 'Report for increasing\nStation',
      pillIcon: ShoppingBag,
      pillText: 'Equipment Report',
      pillCount: '2',
    },
    {
      id: 1,
      bgColor: '#059669', // Emerald Green from frame 35
      period: 'This Month',
      mainTitle: 'Healthy Kiddos Sent',
      mainValue: '500',
      cardTitle: 'Share The Report',
      pillIcon: Banknote,
      pillText: 'Discharge Discharge',
      pillCount: '500',
    },
    {
      id: 2,
      bgColor: '#7C3AED', // Purple from frame 38
      period: 'This Month',
      mainTitle: '2 of 12 Critical Babies\nwere sent for\ntransfusion',
      mainValue: null,
      cardTitle: null,
      pillIcon: Send,
      pillText: 'Send Reports',
      pillCount: null,
    },
  ];

  const slide = slides[currentSlide];
  const PillIcon = slide.pillIcon;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: slide.bgColor }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Progress Segmented Indicators from Frame 32/35/38 */}
        <View style={styles.progressRow}>
          {slides.map((s, idx) => (
            <View key={s.id} style={styles.segmentBackground}>
              <View
                style={[
                  styles.segmentFill,
                  idx <= currentSlide && styles.segmentActive,
                ]}
              />
            </View>
          ))}
        </View>

        {/* Top Bar with Close */}
        <View style={styles.topBar}>
          <Text style={styles.periodText}>{slide.period}</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Touch zones for story navigation */}
        <View style={styles.touchContainer}>
          <TouchableOpacity style={styles.touchLeft} onPress={handlePrev} />
          <TouchableOpacity style={styles.touchRight} onPress={handleNext} />
        </View>

        {/* Center Main Text and Big Value */}
        <View style={styles.centerContainer}>
          <Text style={styles.mainTitle}>{slide.mainTitle}</Text>
          {slide.mainValue && <Text style={styles.mainValue}>{slide.mainValue}</Text>}
        </View>

        {/* Bottom Card Area */}
        <View style={styles.bottomCardContainer}>
          {slide.cardTitle ? (
            <View style={styles.whiteCard}>
              <Text style={styles.cardTitle}>{slide.cardTitle}</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onNavigateAction?.(slide.pillText)}
                style={styles.pillButton}
              >
                <View style={styles.iconSquare}>
                  <PillIcon size={18} color="#D97706" />
                </View>
                <Text style={styles.pillButtonText}>{slide.pillText}</Text>
              </TouchableOpacity>

              {slide.pillCount && <Text style={styles.cardCount}>{slide.pillCount}</Text>}
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigateAction?.(slide.pillText)}
              style={styles.floatingPillButton}
            >
              <View style={styles.iconSquare}>
                <PillIcon size={18} color="#D97706" />
              </View>
              <Text style={styles.pillButtonText}>{slide.pillText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  segmentBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  segmentFill: {
    width: '0%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  segmentActive: {
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  periodText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  touchContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1,
  },
  touchLeft: {
    flex: 0.35,
  },
  touchRight: {
    flex: 0.65,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 44,
  },
  mainValue: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: '800',
    marginTop: 18,
  },
  bottomCardContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    zIndex: 2,
  },
  whiteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginVertical: 10,
  },
  floatingPillButton: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  iconSquare: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pillButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardCount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
});
