// Short execution videos for the default exercises (YouTube ids, checked to allow embedding).
// An exercise's own "Video link" (set in the workout plan editor) wins over these.
const VIDEO = {
  'bb-squat': 'rrJIyZGlK8c', 'single-leg-press': 'sxF9BcDt-yY', 'goblet-squat': 'XJJQu6Uc7kU', 'leg-ext': '4ZDm5EbiFI8', 'calf-raise': 'eMTy3qylqnE',
  'bench': 'CjHIKDQ4RQo', 'incline-press': 'MtlHy8hvHDs', 'overhead-ext': 'YM8iX9BJWjA', 'tri-pushdown': 'LXkCrxn3caQ', 'machine-fly': 'eGjt4lk6g34', 'pushups': 'WDIpL0pjun0',
  'hip-thrust': 'pF17m_CXfL0', 'split-squat': 'vgn7bSXkgkA', 'hip-abductor': 'G_8LItOiZ0Q', 'glute-leg-press': 'UT1U-iGl2Uc',
  'bicep-curl': 'MtXdEcW3Eog', 'hammer-curl': 'P5sXHLmXmBM', 'lat-pulldown': 'JGeRYIZdojU', 'cable-row': 'lJoozxC0Rns', 'pullups': 'PHdHnZcbsB8',
  'rdl': '7j-2w4-P14I', 'ham-curl': '5xR8tvg4-yM', 'reverse-lunge': 'xrPteyQLGAo', 'hip-adductor': 'CjAVezAggkI',
  'db-ohp': 'Did01dFR3Lk', 'front-raise': 'zkP0MsTcIVU', 'lat-raise': 'XPPfnSEATJA', 'face-pull': 'ya16Y_CbEBk', 'rear-delt': 'nlkF7_2O_Lw',
};

// The 11-character id out of any usual YouTube address (watch, youtu.be, shorts, embed), or '' if there is none.
export function youtubeId(link) {
  const m = String(link || '').trim().match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})(?![\w-])/);
  return m ? m[1] : '';
}
export const exerciseVideo = ex => youtubeId(ex.video) || VIDEO[ex.id] || '';
export const youtubeSearch = name => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`how to ${name} proper form`);
