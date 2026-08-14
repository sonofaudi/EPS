/**
 * Utility to map raw AI/Browser detections to strict MongoDB Violation schema enums.
 * File Path: client/js/monitor/aiViolationMapper.js
 */
const AIViolationMapper = {
    // Strict Schema Enum Mapping Dictionary
    MAP: {
        // Face & Candidate Presence
        'CANDIDATE_ABSENT': 'face_missing',
        'NO_FACE': 'face_missing',
        'FACE_MISSING': 'face_missing',
        'face_missing': 'face_missing',

        'MULTIPLE_PEOPLE': 'multiple_faces',
        'MULTIPLE_FACES': 'multiple_faces',
        'multiple_faces': 'multiple_faces',

        'LOOKING_AWAY': 'gaze_away',
        'GAZE_AWAY': 'gaze_away',
        'gaze_away': 'gaze_away',

        // Objects & Contraband
        'CONTRABAND_DETECTED': 'unauthorized_object',
        'BOOK_DETECTED': 'unauthorized_object',
        'PHONE_DETECTED': 'unauthorized_object',
        'UNAUTHORIZED_OBJECT': 'unauthorized_object',
        'unauthorized_object': 'unauthorized_object',

        // Browser Security Events
        'TAB_SWITCH': 'tab_switch',
        'tab_switch': 'tab_switch',
        'FULLSCREEN_EXIT': 'fullscreen_exit',
        'fullscreen_exit': 'fullscreen_exit'
    },

    /**
     * Normalizes raw event types to valid MongoDB enum values.
     * Rejects unmapped events to preserve audit trail integrity.
     * @param {string} rawType - Original detection string from AI or Browser listener
     * @returns {string|null} Mongoose-compliant schema enum or null if invalid
     */
    normalizeType(rawType) {
        if (!rawType) return null;
        
        const mapped = this.MAP[rawType] || this.MAP[String(rawType).toUpperCase()];
        if (!mapped) {
            console.warn(`⚠️ Unmapped AI event [${rawType}] rejected. No valid violation schema mapping exists.`);
            return null;
        }
        return mapped;
    }
};

window.AIViolationMapper = AIViolationMapper;