export class AnalyticsService {
  static async getSummaryTotal(period = 'Day') {
    return {
      period,
      totalInfants: 24,
      breakdown: [
        { label: 'In Observation', count: 12, color: '#F59E0B', percentage: 50 },
        { label: 'In Phototherapy', count: 8, color: '#8B5CF6', percentage: 33 },
        { label: 'Critical', count: 4, color: '#EF4444', percentage: 17 },
      ],
      admitsBreakdown: [
        { label: 'Discharged', count: 500, color: '#10B981', percentage: 83 },
        { label: 'Under Treatment', count: 100, color: '#1E1B4B', percentage: 17 },
      ],
    };
  }

  static async getStoryInsights() {
    return [
      {
        id: 'story_1',
        title: 'This Month',
        mainText: 'Vacant phototherapy stations',
        mainValue: 2,
        cardTitle: 'Report for increasing Station',
        badge: 'Equipment Report',
        badgeValue: 2,
        themeColor: '#EF4444',
      },
      {
        id: 'story_2',
        title: 'This Month',
        mainText: 'Healthy Kiddos Sent',
        mainValue: 500,
        cardTitle: 'Share The Report',
        badge: 'Discharge Discharge',
        badgeValue: 500,
        themeColor: '#10B981',
      },
      {
        id: 'story_3',
        title: 'This Month',
        mainText: '2 of 12 Critical Babies were sent for transfusion',
        mainValue: '2/12',
        cardTitle: 'Send Reports',
        badge: 'Clinical Review',
        badgeValue: 'Actioned',
        themeColor: '#7C3AED',
      },
    ];
  }

  static async generateExportCsv(dataType = 'All', dateRange = 'Last 30 days') {
    const headers = 'UHID,Name,DOB,AssignedDoctor,SeverityState,LatestBilirubin,Unit,Status,Timestamp\n';
    const rows = [
      'M1A2N3S4I5,Baby 1,2026-11-15,Dr. XYZ,critical,18.0,mg/dL,under_treatment,2026-11-16 10:00:00',
      'B2C3D4E5F6,Baby 2,2026-11-14,Dr. XYZ,normal,8.5,mg/dL,in_observation,2026-11-16 10:00:00',
      'G7H8I9J0K1,Baby 3,2026-11-15,Dr. XYZ,critical,12.5,mg/dL,under_treatment,2026-11-16 07:30:00',
      'D4E5F6G7H8,Baby 4,2026-11-10,Dr. ABC,discharged,5.0,mg/dL,discharged,2026-11-15 14:00:00',
    ];
    return headers + rows.join('\n');
  }
}
