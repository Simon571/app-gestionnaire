export const dynamic = "force-static";
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { readPublisherUsers } from '@/lib/publisher-users-store';
import type { Person } from '@/app/personnes/page';

/**
 * Endpoint pour synchroniser les utilisateurs Publisher App vers la liste des personnes
 * GET /api/sync-publisher-users-to-people
 * Retourne les utilisateurs Publisher App au format Person[] pour import dans localStorage
 */
export async function GET() {
  try {
    const publisherUsers = await readPublisherUsers();
    
    // Convertir les utilisateurs Publisher App en format Person
    const people: Person[] = publisherUsers.map((user) => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      
      return {
        id: String(user.id),
        firstName: String(user.firstName || ''),
        middleName: '',
        lastName: String(user.lastName || ''),
        suffix: '',
        displayName: fullName,
        homePhone: '',
        mobilePhone: '',
        workPhone: '',
        address: '',
        linkFamily: false,
        latitude: '',
        longitude: '',
        email1: String(user.email || ''),
        email2: '',
        pin: user.pin ? String(user.pin) : undefined,
        gender: null,
        familyId: null,
        isHeadOfFamily: false,
        other: false,
        child: false,
        otherInfo: '',
        agedOrInfirm: false,
        deaf: false,
        blind: false,
        incarcerated: false,
        disableAppAccess: false,
        deletePersonalInfo: false,
        notes: '',
        absences: [],
        departed: false,
        activity: Array.isArray(user.activity) ? user.activity : [],
        emergency: {
          personName: '',
          notes: '',
          disasterAccommodations: false,
          contacts: [],
        },
        spiritual: {
          group: user.preachingGroup ? String(user.preachingGroup) : null,
          groupName: null,
          roleInGroup: 'member',
          function: 'publisher',
          active: true,
          regular: true,
          tgPaper: false,
          cvmPaper: false,
          anointed: false,
          kingdomHallKey: null,
          otherInfo1: '',
          otherInfo2: '',
          otherInfo3: '',
          directReports: false,
          noLocalReport: false,
          isDeleted: false,
          pioneer: {
            status: null,
            sfl: false,
          },
        },
        assignments: {
          gems: {
            president: false,
            prayers: false,
            spiritualGems: false,
            secondaryRoomCounselor: false,
            talks: false,
            bibleReading: false,
          },
          ministry: {
            student: false,
            firstContact: false,
            returnVisit: false,
            bibleStudy: false,
            explainBeliefs: false,
            hall: '',
            interlocutor: false,
            discourse: false,
            languageGroupOnly: false,
            engageConversation: false,
            maintainInterest: false,
            makeDisciples: false,
          },
          christianLife: {
            interventions: false,
            congregationBibleStudy: false,
            reader: false,
          },
          weekendMeeting: {
            localSpeaker: false,
            externalSpeaker: false,
            discourseNumbers: '',
            frequency: '',
            president: false,
            finalPrayer: false,
            hospitality: false,
            wtReader: false,
            orateur2: false,
            groupLangueUniquement: false,
          },
          preaching: {
            publicWitnessing: false,
            leadMeetings: false,
            substituteDriver: '',
            keyPerson: false,
            meetingPrayers: false,
          },
          services: {
            meeting: '',
            attendanceCount: false,
            doorAttendant: false,
            soundSystem: false,
            rovingMic: false,
            stageMic: false,
            sanitary: false,
            hallAttendant: false,
            mainDoorAttendant: false,
            customService1: false,
            customService1Label: '',
            maintenance: false,
            doorAttendantAlt: false,
            stageMicAlt: false,
            hallAttendantAlt: false,
            mainDoorAttendantAlt: false,
          },
          otherPrivileges: {
            hospitalLiason: false,
            accounts: false,
            careForTelephone: false,
            meetingChairman: false,
            literatureCounter: false,
            kingdomHallCleaning: false,
            kingdomHallRepairs: false,
            territoryMaps: false,
            notes: '',
          },
          cleaning: {
            hallCleaning: false,
            hallCleaningAfterMeeting: false,
            customCleaning1: false,
            customCleaning1Label: '',
            customCleaning2: false,
            customCleaning2Label: '',
            greenSpaces: false,
            lawn: false,
          },
          emergencyContacts: user.emergencyContacts || [],
        },
      };
    });
    
    return NextResponse.json({ 
      success: true,
      count: people.length,
      people 
    });
  } catch (error) {
    console.error('Error syncing publisher users to people:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync users' },
      { status: 500 }
    );
  }
}
