// src/lib/db.js
// All Firestore read/write operations

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, orderBy, onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Players ────────────────────────────────────────────────────────────────

export async function createPlayer(nickname) {
  const id = `${nickname.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
  const ref = doc(db, 'players', id)
  await setDoc(ref, {
    id,
    nickname,
    totalPoints: 0,
    createdAt: serverTimestamp()
  })
  return id
}

export async function getPlayer(id) {
  const snap = await getDoc(doc(db, 'players', id))
  return snap.exists() ? snap.data() : null
}

export function subscribeLeaderboard(callback) {
  const q = query(collection(db, 'players'), orderBy('totalPoints', 'desc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => d.data())))
}

// ─── Predictions ─────────────────────────────────────────────────────────────

export async function savePrediction(playerId, fixtureId, predictionData) {
  const ref = doc(db, 'predictions', `${playerId}_${fixtureId}`)
  await setDoc(ref, {
    playerId,
    fixtureId,
    ...predictionData,
    updatedAt: serverTimestamp()
  }, { merge: true })
}

export async function getPlayerPredictions(playerId) {
  const snap = await getDocs(collection(db, 'predictions'))
  return snap.docs
    .map(d => d.data())
    .filter(p => p.playerId === playerId)
}

export async function saveTournamentPrediction(playerId, data) {
  const ref = doc(db, 'tournamentPredictions', playerId)
  await setDoc(ref, { playerId, ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function getTournamentPrediction(playerId) {
  const snap = await getDoc(doc(db, 'tournamentPredictions', playerId))
  return snap.exists() ? snap.data() : null
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

export async function saveFixtures(fixtures) {
  const batch = writeBatch(db)
  for (const f of fixtures) {
    batch.set(doc(db, 'fixtures', f.id), f)
  }
  await batch.commit()
}

export async function getFixtures() {
  const snap = await getDocs(query(collection(db, 'fixtures'), orderBy('date', 'asc')))
  return snap.docs.map(d => d.data())
}

export function subscribeFixtures(callback) {
  const q = query(collection(db, 'fixtures'), orderBy('date', 'asc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => d.data())))
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export async function savePlayerMatchScore(playerId, fixtureId, points, breakdown) {
  const ref = doc(db, 'matchScores', `${playerId}_${fixtureId}`)
  await setDoc(ref, { playerId, fixtureId, points, breakdown, updatedAt: serverTimestamp() })
}

export async function updatePlayerTotalPoints(playerId, totalPoints) {
  await updateDoc(doc(db, 'players', playerId), { totalPoints })
}

// ─── Tournament outcomes (admin sets these) ────────────────────────────────

export async function saveTournamentOutcomes(data) {
  await setDoc(doc(db, 'meta', 'tournamentOutcomes'), { ...data, updatedAt: serverTimestamp() })
}

export async function getTournamentOutcomes() {
  const snap = await getDoc(doc(db, 'meta', 'tournamentOutcomes'))
  return snap.exists() ? snap.data() : {}
}

// ─── Deadline ────────────────────────────────────────────────────────────────

export async function getDeadline() {
  const snap = await getDoc(doc(db, 'meta', 'config'))
  return snap.exists() ? snap.data().deadline : null
}

export async function saveConfig(config) {
  await setDoc(doc(db, 'meta', 'config'), config, { merge: true })
}
