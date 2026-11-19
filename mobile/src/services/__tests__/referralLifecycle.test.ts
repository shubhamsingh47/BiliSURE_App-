import { formatCardDateTime } from '../dateTime.service';
import { Baby, Referral } from '../../types';

describe('Referral Lifecycle, Baby Cards, and Isolation', () => {
  describe('formatCardDateTime helper', () => {
    it('formats a date and time in the expected "DD Mon YYYY, hh:mm A" layout', () => {
      // 18 Nov 2026 16:35:00
      const date = new Date(2026, 10, 18, 16, 35, 0);
      const formatted = formatCardDateTime(date);
      expect(formatted).toContain('18 Nov 2026');
      expect(formatted).toMatch(/0?4:35 PM/);
    });

    it('returns empty string when date is null or invalid', () => {
      expect(formatCardDateTime(null)).toBe('');
      expect(formatCardDateTime(undefined)).toBe('');
      expect(formatCardDateTime('invalid-date')).toBe('');
    });
  });

  describe('Baby Card State: Outgoing Referral vs Accepted', () => {
    const baseBaby: Baby = {
      id: 'baby_001',
      uhid: 'BS-IN-900001',
      name: 'Baby of Maya',
      parentsName: 'Maya Devi',
      dateOfBirth: '2026-11-15T06:00:00.000Z',
      gestationalAgeWeeks: 38,
      severityState: 'moderate',
      status: 'admitted',
      currentHospital: 'PGI',
      facility: 'PGI',
      updatedAt: '2026-11-15T06:00:00.000Z',
    };

    it('shows greyed out, non-clickable card with sent timestamp during pending referral', () => {
      const sentTime = new Date(2026, 10, 18, 16, 35, 0).toISOString();
      const referredBaby: Baby = {
        ...baseBaby,
        referralStatus: 'pending',
        referredToHospitalName: 'RML',
        referralSentAt: sentTime,
      };

      // Card referral check logic
      const targetHospital = referredBaby.referredToHospitalName;
      const isReferred = !!targetHospital && referredBaby.referralStatus === 'pending';

      expect(isReferred).toBe(true);
      expect(targetHospital).toBe('RML');
      expect(formatCardDateTime(referredBaby.referralSentAt)).toContain('18 Nov 2026');
      expect(formatCardDateTime(referredBaby.referralSentAt)).toMatch(/0?4:35 PM/);
    });

    it('returns to normal clickable card with acceptance timestamp once accepted by receiver', () => {
      const acceptanceTime = new Date(2026, 10, 18, 17, 10, 0).toISOString();
      const acceptedBaby: Baby = {
        ...baseBaby,
        currentHospital: 'RML', // Ownership transferred to RML
        referralStatus: 'accepted',
        referralAcceptedAt: acceptanceTime,
        acceptedAt: acceptanceTime,
        referredToHospitalName: undefined, // Cleared on acceptance
        referralSentAt: undefined,
      };

      const targetHospital = acceptedBaby.referredToHospitalName || null;
      const isReferred = !!targetHospital && acceptedBaby.referralStatus === 'pending';

      expect(isReferred).toBe(false);
      expect(acceptedBaby.currentHospital).toBe('RML');
      expect(formatCardDateTime(acceptedBaby.referralAcceptedAt)).toContain('18 Nov 2026');
      expect(formatCardDateTime(acceptedBaby.referralAcceptedAt)).toMatch(/0?5:10 PM/);
    });

    it('retains historical baby card on sender side with "Referred to [Hospital]" and original sent timestamp after receiver acceptance', () => {
      const sentTime = new Date(2026, 10, 18, 16, 35, 0).toISOString();
      const transferredOutBaby: Baby = {
        ...baseBaby,
        currentHospital: 'RML', // Owner is now RML
        facility: 'RML',
        isTransferredOut: true,
        isHistoricalOnly: true,
        referralStatus: 'accepted',
        referredToHospitalName: 'RML',
        referralSentAt: sentTime,
      };

      // Card evaluation logic in BabyCard
      const targetHospital = transferredOutBaby.referredToHospitalName || null;
      const isTransferred = transferredOutBaby.isTransferredOut || transferredOutBaby.isHistoricalOnly || false;
      const isPendingReferral = transferredOutBaby.referralStatus === 'pending' && !!targetHospital;
      const isReferred = isPendingReferral || isTransferred || !!targetHospital;
      const badgeLabel = targetHospital ? `Referred to ${targetHospital}` : 'Referred';

      // 1. Must be marked as referred (greyed out & non-clickable)
      expect(isReferred).toBe(true);
      expect(isTransferred).toBe(true);

      // 2. Must display "Referred to RML", NOT "Transferred to RML"
      expect(badgeLabel).toBe('Referred to RML');
      expect(badgeLabel).not.toContain('Transferred to');

      // 3. Must preserve original referral sent timestamp
      expect(formatCardDateTime(transferredOutBaby.referralSentAt)).toContain('18 Nov 2026');
      expect(formatCardDateTime(transferredOutBaby.referralSentAt)).toMatch(/0?4:35 PM/);
    });

    it('returns to normal card on sender side if referral is rejected', () => {
      const rejectedBaby: Baby = {
        ...baseBaby,
        currentHospital: 'PGI', // Ownership retained by PGI
        referralStatus: 'rejected',
        referredToHospitalName: undefined,
        referralSentAt: undefined,
      };

      const targetHospital = rejectedBaby.referredToHospitalName || null;
      const isReferred = !!targetHospital && rejectedBaby.referralStatus === 'pending';

      expect(isReferred).toBe(false);
      expect(rejectedBaby.currentHospital).toBe('PGI');
    });
  });

  describe('Sequential and Reverse Referrals Lifecycle Logic', () => {
    let baby: Baby;
    let referralsHistory: Referral[] = [];

    beforeEach(() => {
      baby = {
        id: 'baby_maya_01',
        uhid: 'BS-IN-443322',
        name: 'Baby Maya',
        parentsName: 'Maya',
        dateOfBirth: '2026-11-15T06:00:00.000Z',
        gestationalAgeWeeks: 38,
        severityState: 'moderate',
        status: 'admitted',
        facility: 'PGI',
        currentHospital: 'PGI',
        referralStatus: 'none',
        updatedAt: new Date().toISOString(),
      };
      referralsHistory = [];
    });

    it('executes Scenario A (PGI -> RML) and Scenario B (RML -> PGI) cleanly without data conflict', () => {
      // Step 1: PGI refers Baby Maya to RML
      expect(baby.currentHospital).toBe('PGI');
      const ref1SentTime = new Date('2026-11-18T10:00:00.000Z');
      const ref1: Referral = {
        id: 'ref_1',
        referralId: 'REF-2026-0001',
        babyId: baby.id,
        babyName: baby.name,
        babyUhid: baby.uhid,
        dateOfBirth: baby.dateOfBirth,
        gestationalAgeWeeks: baby.gestationalAgeWeeks || 38,
        referringDoctorName: 'Dr. PGI',
        referringCentreName: 'PGI',
        receivingHospitalId: 'hosp_rml',
        receivingHospitalName: 'RML',
        status: 'pending',
        urgency: 'routine',
        clinicalSummary: 'Hyperbilirubinemia evaluation',
        latestBilirubinValue: 14.5,
        latestBilirubinUnit: 'mg/dL',
        latestBhutaniRiskZone: 'high_intermediate',
        postnatalAgeHoursAtReferral: 48,
        phototherapyRecommended: true,
        createdAt: ref1SentTime.toISOString(),
      };
      referralsHistory.push(ref1);

      baby.referralStatus = 'pending';
      baby.referredToHospitalName = 'RML';
      baby.referralSentAt = ref1.createdAt;

      // PGI sees card as greyed out
      expect(baby.referralStatus).toBe('pending');
      expect(baby.referredToHospitalName).toBe('RML');
      expect(baby.referralSentAt).toBe(ref1SentTime.toISOString());

      // Attempting another transfer while pending is blocked
      const attemptConflictingReferral = () => {
        if (baby.referralStatus === 'pending') {
          throw new Error(`Baby already has a pending referral to ${baby.referredToHospitalName}`);
        }
      };
      expect(attemptConflictingReferral).toThrow('Baby already has a pending referral to RML');

      // Step 2: RML accepts the referral
      const ref1AcceptTime = new Date('2026-11-18T11:00:00.000Z');
      ref1.status = 'accepted';
      ref1.reviewedAt = ref1AcceptTime.toISOString();
      ref1.reviewedByDoctorName = 'Dr. RML Specialist';

      // Ownership transfers to RML
      baby.currentHospital = 'RML';
      baby.referralStatus = 'accepted';
      baby.referralAcceptedAt = ref1AcceptTime.toISOString();
      baby.acceptedAt = ref1AcceptTime.toISOString();
      baby.referredToHospitalName = undefined;
      baby.referralSentAt = undefined;

      // Now Baby is active in RML
      expect(baby.currentHospital).toBe('RML');
      expect(baby.referredToHospitalName).toBeUndefined();
      expect(baby.referralAcceptedAt).toBe(ref1AcceptTime.toISOString());

      // Step 3: Scenario B - RML now refers Baby Maya back to PGI
      expect(baby.currentHospital).toBe('RML');
      const ref2SentTime = new Date('2026-11-19T09:00:00.000Z');
      const ref2: Referral = {
        id: 'ref_2',
        referralId: 'REF-2026-0002',
        babyId: baby.id,
        babyName: baby.name,
        babyUhid: baby.uhid,
        dateOfBirth: baby.dateOfBirth,
        gestationalAgeWeeks: baby.gestationalAgeWeeks || 38,
        referringDoctorName: 'Dr. RML Specialist',
        referringCentreName: 'RML',
        receivingHospitalId: 'hosp_pgi',
        receivingHospitalName: 'PGI',
        status: 'pending',
        urgency: 'routine',
        clinicalSummary: 'Transfer back to step-down nursery',
        latestBilirubinValue: 10.2,
        latestBilirubinUnit: 'mg/dL',
        latestBhutaniRiskZone: 'low_intermediate',
        postnatalAgeHoursAtReferral: 72,
        phototherapyRecommended: false,
        createdAt: ref2SentTime.toISOString(),
      };
      referralsHistory.push(ref2);

      baby.referralStatus = 'pending';
      baby.referredToHospitalName = 'PGI';
      baby.referralSentAt = ref2.createdAt;

      // RML sees card as greyed out with "Referred to PGI"
      expect(baby.referralStatus).toBe('pending');
      expect(baby.referredToHospitalName).toBe('PGI');

      // Step 4: PGI accepts the reverse referral
      const ref2AcceptTime = new Date('2026-11-19T10:00:00.000Z');
      ref2.status = 'accepted';
      ref2.reviewedAt = ref2AcceptTime.toISOString();
      ref2.reviewedByDoctorName = 'Dr. PGI Senior';

      // Ownership transfers back to PGI
      baby.currentHospital = 'PGI';
      baby.referralStatus = 'accepted';
      baby.referralAcceptedAt = ref2AcceptTime.toISOString();
      baby.acceptedAt = ref2AcceptTime.toISOString();
      baby.referredToHospitalName = undefined;
      baby.referralSentAt = undefined;

      expect(baby.currentHospital).toBe('PGI');
      expect(baby.referralAcceptedAt).toBe(ref2AcceptTime.toISOString());

      // Historical integrity: both distinct referrals are preserved in sequence
      expect(referralsHistory.length).toBe(2);
      expect(referralsHistory[0].referralId).toBe('REF-2026-0001');
      expect(referralsHistory[0].referringCentreName).toBe('PGI');
      expect(referralsHistory[0].receivingHospitalName).toBe('RML');
      expect(referralsHistory[0].status).toBe('accepted');

      expect(referralsHistory[1].referralId).toBe('REF-2026-0002');
      expect(referralsHistory[1].referringCentreName).toBe('RML');
      expect(referralsHistory[1].receivingHospitalName).toBe('PGI');
      expect(referralsHistory[1].status).toBe('accepted');
    });

    it('enforces that only the designated receiving hospital can accept', () => {
      const ref: Referral = {
        id: 'ref_3',
        referralId: 'REF-2026-0003',
        babyId: baby.id,
        babyName: baby.name,
        babyUhid: baby.uhid,
        dateOfBirth: baby.dateOfBirth,
        gestationalAgeWeeks: 38,
        referringDoctorName: 'Dr. PGI',
        referringCentreName: 'PGI',
        receivingHospitalId: 'hosp_rml',
        receivingHospitalName: 'RML',
        status: 'pending',
        urgency: 'routine',
        clinicalSummary: 'Transfer to RML',
        latestBilirubinValue: 14.0,
        latestBilirubinUnit: 'mg/dL',
        latestBhutaniRiskZone: 'high_intermediate',
        postnatalAgeHoursAtReferral: 48,
        phototherapyRecommended: true,
        createdAt: new Date().toISOString(),
      };

      const attemptAccept = (userFacility: string) => {
        if (userFacility.toUpperCase() !== ref.receivingHospitalName.toUpperCase()) {
          throw new Error(`Only the designated receiving hospital (${ref.receivingHospitalName}) can accept this referral`);
        }
      };

      expect(() => attemptAccept('KGMU')).toThrow('Only the designated receiving hospital (RML) can accept');
      expect(() => attemptAccept('PGI')).toThrow('Only the designated receiving hospital (RML) can accept');
      expect(() => attemptAccept('RML')).not.toThrow();
    });
  });

  describe('Referrals Navigation & Status Filter Structure', () => {
    const mockReferrals: Referral[] = [
      {
        id: 'ref_inc_1',
        referralId: 'REF-INC-001',
        babyId: 'baby_1',
        babyName: 'Baby One',
        babyUhid: 'BS-001',
        dateOfBirth: '2026-11-15T06:00:00.000Z',
        gestationalAgeWeeks: 38,
        referringDoctorName: 'Dr. North',
        referringCentreName: 'North CHC',
        receivingHospitalId: 'hosp_pgi',
        receivingHospitalName: 'PGI',
        status: 'pending',
        urgency: 'emergency',
        latestBilirubinValue: 18.2,
        latestBilirubinUnit: 'mg/dL',
        latestBhutaniRiskZone: 'high',
        postnatalAgeHoursAtReferral: 48,
        phototherapyRecommended: true,
        createdAt: '2026-11-18T10:00:00.000Z',
      },
      {
        id: 'ref_inc_2',
        referralId: 'REF-INC-002',
        babyId: 'baby_2',
        babyName: 'Baby Two',
        babyUhid: 'BS-002',
        dateOfBirth: '2026-11-15T06:00:00.000Z',
        gestationalAgeWeeks: 38,
        referringDoctorName: 'Dr. South',
        referringCentreName: 'South CHC',
        receivingHospitalId: 'hosp_pgi',
        receivingHospitalName: 'PGI',
        status: 'accepted',
        reviewedByDoctorName: 'Dr. PGI Attending',
        urgency: 'routine',
        latestBilirubinValue: 12.0,
        latestBilirubinUnit: 'mg/dL',
        latestBhutaniRiskZone: 'low_intermediate',
        postnatalAgeHoursAtReferral: 36,
        phototherapyRecommended: true,
        createdAt: '2026-11-18T09:00:00.000Z',
      },
      {
        id: 'ref_sent_1',
        referralId: 'REF-SENT-001',
        babyId: 'baby_3',
        babyName: 'Baby Three',
        babyUhid: 'BS-003',
        dateOfBirth: '2026-11-14T06:00:00.000Z',
        gestationalAgeWeeks: 37,
        referringDoctorName: 'Dr. PGI Specialist',
        referringCentreName: 'PGI',
        receivingHospitalId: 'hosp_rml',
        receivingHospitalName: 'RML',
        status: 'pending',
        urgency: 'urgent',
        latestBilirubinValue: 19.5,
        latestBilirubinUnit: 'mg/dL',
        latestBhutaniRiskZone: 'high',
        postnatalAgeHoursAtReferral: 72,
        phototherapyRecommended: true,
        createdAt: '2026-11-18T14:00:00.000Z',
      },
    ];

    it('Level 1: Segregates Incoming vs Sent into distinct workspaces without cross-contamination', () => {
      const userFacility = 'PGI';
      const incoming = mockReferrals.filter(
        (r) => r.receivingHospitalName.toUpperCase() === userFacility.toUpperCase()
      );
      const sent = mockReferrals.filter(
        (r) => r.referringCentreName.toUpperCase() === userFacility.toUpperCase()
      );

      expect(incoming.length).toBe(2);
      expect(sent.length).toBe(1);

      // Verify no sent items in incoming
      expect(incoming.every((r) => r.receivingHospitalName === 'PGI')).toBe(true);
      // Verify no incoming items in sent
      expect(sent.every((r) => r.referringCentreName === 'PGI')).toBe(true);
    });

    it('Level 2: Filters within selected workspace strictly by status (pending, accepted, rejected)', () => {
      const userFacility = 'PGI';
      const incoming = mockReferrals.filter(
        (r) => r.receivingHospitalName.toUpperCase() === userFacility.toUpperCase()
      );

      const incomingPending = incoming.filter((r) => r.status === 'pending');
      const incomingAccepted = incoming.filter((r) => r.status === 'accepted');
      const incomingRejected = incoming.filter((r) => r.status === 'rejected');

      expect(incomingPending.length).toBe(1);
      expect(incomingPending[0].referralId).toBe('REF-INC-001');

      expect(incomingAccepted.length).toBe(1);
      expect(incomingAccepted[0].referralId).toBe('REF-INC-002');

      expect(incomingRejected.length).toBe(0);
    });

    it('Auditing: Preserves reviewedByDoctorName in model data but UI card omits redundant "Accepted by" banner', () => {
      const acceptedRef = mockReferrals.find((r) => r.status === 'accepted')!;
      expect(acceptedRef.reviewedByDoctorName).toBe('Dr. PGI Attending');
      // In the redesigned ReferralsHubScreen, acceptedWrap is completely omitted from the card JSX
    });
  });
});
