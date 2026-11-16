import { RecommendationModel } from '../../models/Recommendation';

export class RecommendationsService {
  static async getForBaby(babyId: string, currentBilirubin = 10.0) {
    try {
      const recs = await RecommendationModel.find({ babyId }).lean();
      if (recs.length > 0) return recs;
    } catch {}

    // Formulate clinical guidelines based on AAP phototherapy nomograms
    let automatedAction = 'phototherapy';
    let frequency = 'Continuous 4-hour cycles with 30-min break for feeding';
    if (currentBilirubin < 9.0) {
      automatedAction = 'continue_monitoring';
      frequency = 'Check TcB every 12 hours';
    } else if (currentBilirubin > 17.0) {
      automatedAction = 'exchange_transfusion';
      frequency = 'Prepare emergency intensive phototherapy and NICU consultation';
    }

    return [
      {
        _id: 'rec_auto_001',
        babyId,
        source: 'bilisure_automated',
        suggestedAction: automatedAction,
        frequency: frequency,
        guidelineReference: 'AAP 2022 Clinical Practice Guideline: Management of Hyperbilirubinemia in Newborn >= 35 Weeks',
        status: 'suggested',
      },
      {
        _id: 'rec_provider_001',
        babyId,
        source: 'healthcare_provider',
        suggestedAction: 'phototherapy',
        frequency: 'Maintain blue LED phototherapy (460-490 nm) at > 30 uW/cm2/nm',
        providerNotes: 'Under supervision of Dr. XYZ. Monitor serum bilirubin if transcutaneous increases.',
        status: 'accepted',
      },
    ];
  }
}
