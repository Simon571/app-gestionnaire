
import { JoyeauxData, MinistryAssignment, ChristianLifePart, CongregationBibleStudy, FinalPrayer } from "@/components/vcm/FullMeetingBlock";

// Helper to shuffle an array
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Helper to pick one person from a pool
function pickOne(pool: any[], usedIds: Set<string>): any | null {
    for (const person of pool) {
        if (!usedIds.has(person.id)) {
            usedIds.add(person.id);
            return person;
        }
    }
    return null; // No available person in the pool
}

export function assignPeopleToMeeting(people: any[], currentJoyeaux: JoyeauxData, currentMinistry: MinistryAssignment[], currentMinistry2: MinistryAssignment[], currentChristianLife: ChristianLifePart[], currentBibleStudy: CongregationBibleStudy, currentFinalPrayer: FinalPrayer) {
    
    const usedIds = new Set<string>();

    // --- Define pools of qualified people ---
    const presidents = shuffle(people.filter(p => p.spiritual?.function === 'elder'));
    const orateurs = shuffle(people.filter(p => p.spiritual?.function === 'elder' || p.spiritual?.function === 'servant'));
    const prayerBrothers = shuffle(people.filter(p => p.gender === 'male' && p.assignments?.preaching?.meetingPrayers));
    const gemsConductors = shuffle(people.filter(p => (p.spiritual?.function === 'elder' || p.spiritual?.function === 'servant') && p.assignments?.gems?.spiritualGems));
    const bibleReaders = shuffle(people.filter(p => p.assignments?.gems?.bibleReading));
    const students = shuffle(people.filter(p => p.assignments?.ministry?.student));
    const christianLifeParticipants = shuffle(people.filter(p => p.assignments?.christianLife?.interventions));
    const bibleStudyConductors = shuffle(people.filter(p => p.assignments?.christianLife?.congregationBibleStudy));
    const bibleStudyReaders = shuffle(people.filter(p => p.assignments?.christianLife?.reader));
    const partners = shuffle(people.filter(p => p.spiritual?.function)); // Any publisher can be a partner

    // --- Fallback pools if no one is explicitly flagged ---
    const christianLifeParticipantsPool = christianLifeParticipants.length > 0
        ? christianLifeParticipants
        : shuffle(people.filter(p => p.spiritual?.function)); // fallback: any publisher (brothers or sisters)

    const bibleStudyConductorsPool = bibleStudyConductors.length > 0
        ? bibleStudyConductors
        : shuffle(people.filter(p => p.spiritual?.function === 'elder' || p.spiritual?.function === 'servant')); // fallback: appointed brothers

    const bibleStudyReadersPool = bibleStudyReaders.length > 0
        ? bibleStudyReaders
        : (bibleReaders.length > 0 ? bibleReaders : shuffle(people.filter(p => p.spiritual?.function))); // fallback: gems readers, then any publisher

    // --- Create new state objects ---
    const newJoyeaux: JoyeauxData = { ...currentJoyeaux };
    const newMinistry: MinistryAssignment[] = [...currentMinistry];
    const newMinistry2: MinistryAssignment[] = [...currentMinistry2];
    const newChristianLife: ChristianLifePart[] = [...currentChristianLife];
    const newBibleStudy: CongregationBibleStudy = { ...currentBibleStudy };
    const newFinalPrayer: FinalPrayer = { ...currentFinalPrayer };

    // --- Assign Joyeaux Section ---
    const president = pickOne(presidents, usedIds);
    if (president) newJoyeaux.presidentId = president.id;

    const prayerBrother = pickOne(prayerBrothers, usedIds);
    if (prayerBrother) newJoyeaux.prayerId = prayerBrother.id;

    if (newJoyeaux.discours) {
        const speaker = pickOne(orateurs, usedIds);
        if (speaker) newJoyeaux.discours.speakerId = speaker.id;
    }

    if (newJoyeaux.pearls) {
        const conductor = pickOne(gemsConductors, usedIds);
        if (conductor) newJoyeaux.pearls.conductorId = conductor.id;
    }

    if (newJoyeaux.bible) {
        const reader = pickOne(bibleReaders, usedIds);
        if (reader) newJoyeaux.bible.readerId = reader.id;
    }
    if (newJoyeaux.bible2) {
        const reader2 = pickOne(bibleReaders, usedIds);
        if (reader2) newJoyeaux.bible2.readerId = reader2.id;
    }

    // --- Assign Ministry Section (Salle 1) ---
    newMinistry.forEach(assignment => {
        const student = pickOne(students, usedIds);
        if (student) assignment.studentId = student.id;
        
        // Ensure partner is not the same as the student
        const partner = pickOne(partners.filter(p => p.id !== student?.id), usedIds);
        if (partner) assignment.partnerId = partner.id;
    });

    // --- Assign Ministry Section (Salle 2) ---
    newMinistry2.forEach(assignment => {
        const student = pickOne(students, usedIds);
        if (student) assignment.studentId = student.id;
        
        const partner = pickOne(partners.filter(p => p.id !== student?.id), usedIds);
        if (partner) assignment.partnerId = partner.id;
    });

    // --- Assign Christian Life Section ---
    newChristianLife.forEach(part => {
        const participant = pickOne(christianLifeParticipantsPool, usedIds);
        if (participant) part.participantId = participant.id;
    });

    const bsConductor = pickOne(bibleStudyConductorsPool, usedIds);
    if (bsConductor) newBibleStudy.conductorId = bsConductor.id;

    const bsReader = pickOne(bibleStudyReadersPool, usedIds);
    if (bsReader) newBibleStudy.readerId = bsReader.id;

    const finalPrayerBrother = pickOne(prayerBrothers, usedIds);
    if (finalPrayerBrother) newFinalPrayer.brotherId = finalPrayerBrother.id;

    return {
        joyeauxData: newJoyeaux,
        ministryAssignments: newMinistry,
        ministryAssignments2: newMinistry2,
        christianLifeParts: newChristianLife,
        bibleStudy: newBibleStudy,
        finalPrayer: newFinalPrayer,
    };
}
