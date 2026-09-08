// Shared, plain-data definitions for the course evaluation form. Imported by
// both the client form component and the server submit action so the item keys
// and text stay in sync between the rendered inputs and the DB rows.

export interface LikertItem {
  key: string;
  text: string;
}

/** Section A — Learning Objectives (item_key lo_1 … lo_5). */
export const LEARNING_OBJECTIVES: LikertItem[] = [
  {
    key: "lo_1",
    text: "I can differentiate sleep bruxism from awake bruxism and recognize their distinct clinical drivers.",
  },
  {
    key: "lo_2",
    text: "I can describe the central and multifactorial pathophysiology of bruxism.",
  },
  {
    key: "lo_3",
    text: "I can recognize the relationship between bruxism, temporomandibular disorders (TMD), stress, and sleep disorders.",
  },
  {
    key: "lo_4",
    text: "I can evaluate the limitations of clinical signs and traditional diagnostic markers when assessing current bruxism activity.",
  },
  {
    key: "lo_5",
    text: "I can apply a risk-based, prosthodontic approach to managing bruxism in restorative and implant dentistry.",
  },
];

/** Section B — Course Content & Speaker Evaluation (item_key cs_1 … cs_9). */
export const CONTENT_SPEAKER: LikertItem[] = [
  { key: "cs_1", text: "The course content was well organized and easy to follow." },
  { key: "cs_2", text: "The course content was relevant to my clinical practice." },
  { key: "cs_3", text: "The course content was based on sound scientific evidence." },
  { key: "cs_4", text: "The course fulfilled its stated learning objectives." },
  { key: "cs_5", text: "The speaker demonstrated expertise in the subject matter." },
  { key: "cs_6", text: "The speaker explained the material clearly and effectively." },
  {
    key: "cs_7",
    text: "The speaker effectively connected the scientific literature to clinical practice.",
  },
  { key: "cs_8", text: "The audiovisual presentation supported my learning." },
  {
    key: "cs_9",
    text: "The self-instructional video format was effective for this course.",
  },
];

export const LIKERT_SCALE: { value: number; label: string }[] = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

export const KNOWLEDGE_LEVELS: { value: string; label: string }[] = [
  { value: "none", label: "None" },
  { value: "novice", label: "Novice" },
  { value: "competent", label: "Competent" },
  { value: "proficient", label: "Proficient" },
];

export const SPEAKER_RATINGS: { value: string; label: string }[] = [
  { value: "poor", label: "Poor" },
  { value: "below_average", label: "Below Average" },
  { value: "average", label: "Average" },
  { value: "above_average", label: "Above Average" },
  { value: "excellent", label: "Excellent" },
];
