import { firebaseConfig, accountNames } from './firebase-config.js';
import { applyPatch } from './logic.js';

// One small document store with two backends: Firebase (accounts + sync) or this device only.
//   watch(path, cb, onError)  cb(data | null, fromCache, hasPendingWrites)
//   save(path, data)          replaces the document
//   update(path, patch)       changes only the fields in the patch (see applyPatch in logic.js)

const nameFromEmail = email => {
  const n = (email || '').split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim().split(' ')[0] || 'You';
  return n[0].toUpperCase() + n.slice(1).toLowerCase();
};

function localStore() {
  const watchers = new Map();
  const authCbs = [];
  const key = p => 'fit:' + p;
  const users = { michele: 'Michele', lucy: 'Lucy' };
  const current = () => {
    const uid = localStorage.getItem('fit.uid');
    return users[uid] ? { uid, name: users[uid] } : null;
  };
  const read = p => { try { return JSON.parse(localStorage.getItem(key(p)) || 'null'); } catch { return null; } };
  const write = (path, data) => {
    localStorage.setItem(key(path), JSON.stringify(data));
    [...(watchers.get(path) || [])].forEach(cb => cb(read(path), false, false));
  };
  return {
    mode: 'local',
    onAuth(cb) { authCbs.push(cb); cb(current()); },
    async signIn(uid) { localStorage.setItem('fit.uid', uid); authCbs.forEach(cb => cb(current())); },
    async signOut() { localStorage.removeItem('fit.uid'); authCbs.forEach(cb => cb(null)); },
    watch(path, cb) {
      if (!watchers.has(path)) watchers.set(path, new Set());
      watchers.get(path).add(cb);
      cb(read(path), false, false);
      return () => watchers.get(path).delete(cb);
    },
    save(path, data) { write(path, data); },
    update(path, patch) { write(path, applyPatch(read(path), patch)); },
    remove(path) {
      localStorage.removeItem(key(path));
      [...(watchers.get(path) || [])].forEach(cb => cb(null, false, false));
    },
  };
}

export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

export async function initStore() {
  // "?local" in the address forces local mode: used to test the app without touching the real data
  if (!firebaseConfig || !firebaseConfig.apiKey || new URLSearchParams(location.search).has('local')) return localStore();
  const [{ initializeApp }, A, F] = await Promise.all([
    import(FIREBASE_SDK + 'firebase-app.js'),
    import(FIREBASE_SDK + 'firebase-auth.js'),
    import(FIREBASE_SDK + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.initializeFirestore(app, {
    localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
  });
  const isMap = v => v && typeof v === 'object' && !Array.isArray(v);
  // patch → Firestore: the array/delete markers become field transforms
  const toFirestore = v => !isMap(v) ? v
    : v.__op === 'del' ? F.deleteField()
    : v.__op === 'union' ? F.arrayUnion(...v.v)
    : v.__op === 'remove' ? F.arrayRemove(...v.v)
    : Object.fromEntries(Object.entries(v).filter(([, x]) => !(isMap(x) && Array.isArray(x.v) && !x.v.length)).map(([k, x]) => [k, toFirestore(x)]));
  const failed = path => err => console.error('write failed', path, err);
  return {
    mode: 'cloud',
    onAuth: cb => A.onAuthStateChanged(auth, u => cb(u ? { uid: u.uid, name: accountNames?.[u.uid] || nameFromEmail(u.email) } : null)),
    signIn: (email, password) => A.signInWithEmailAndPassword(auth, email, password),
    signOut: () => A.signOut(auth),
    // metadata changes included: a document first answered from the cache fires again once the server
    // has answered, and again when a local write has been acknowledged
    watch: (path, cb, onError) => F.onSnapshot(
      F.doc(db, path),
      { includeMetadataChanges: true },
      s => cb(s.exists() ? s.data() : null, s.metadata.fromCache, s.metadata.hasPendingWrites),
      err => { console.error(path, err); onError?.(err); },
    ),
    save: (path, data) => { F.setDoc(F.doc(db, path), data).catch(failed(path)); },
    update: (path, patch) => { F.setDoc(F.doc(db, path), toFirestore(patch), { merge: true }).catch(failed(path)); },
    remove: path => { F.deleteDoc(F.doc(db, path)).catch(failed(path)); },
  };
}
