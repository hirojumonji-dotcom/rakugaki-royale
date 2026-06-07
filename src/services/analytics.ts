import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import app from './firebase/config';

const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// ============================================================
// イベント定義
// ============================================================

export const EVENTS = {
  // --- セッション ---
  APP_OPEN: 'app_open',

  // --- ルーム ---
  ROOM_CREATE: 'room_create',
  ROOM_JOIN: 'room_join',
  ROOM_LEAVE: 'room_leave',
  ROOM_READY: 'room_ready',

  // --- ゲーム進行 ---
  GAME_START: 'game_start',
  ROUND_START: 'round_start',
  DRAW_START: 'draw_start',
  DRAW_COMPLETE: 'draw_complete',
  VOTE_START: 'vote_start',
  VOTE_COMPLETE: 'vote_complete',
  RESULT_VIEW: 'result_view',
  GAME_END: 'game_end',

  // --- 再戦 ---
  REMATCH_START: 'rematch_start',

  // --- 離脱 ---
  DROP_LOBBY: 'drop_lobby',
  DROP_DRAWING: 'drop_drawing',
  DROP_VOTING: 'drop_voting',
  DROP_RESULT: 'drop_result',

  // --- エンゲージメント ---
  DRAWING_CLEAR: 'drawing_clear',
  COLOR_CHANGE: 'color_change',
  SIZE_CHANGE: 'size_change',
} as const;

// ============================================================
// イベント送信関数
// ============================================================

export function trackEvent(event: string, params?: Record<string, any>) {
  if (!analytics) return;
  logEvent(analytics, event, params);
}

export function setUser(uid: string) {
  if (!analytics) return;
  setUserId(analytics, uid);
}

export function setUserProps(props: Record<string, string>) {
  if (!analytics) return;
  setUserProperties(analytics, props);
}

// ============================================================
// 具体的なトラッキング関数
// ============================================================

/** アプリ起動 */
export function trackAppOpen() {
  trackEvent(EVENTS.APP_OPEN, { timestamp: Date.now() });
}

/** ルーム作成 */
export function trackRoomCreate(settings: { drawTime: number; roundCount: number; topicMode: string }) {
  trackEvent(EVENTS.ROOM_CREATE, {
    draw_time: settings.drawTime,
    round_count: settings.roundCount,
    topic_mode: settings.topicMode,
  });
}

/** ルーム参加 */
export function trackRoomJoin(playerCount: number) {
  trackEvent(EVENTS.ROOM_JOIN, { player_count: playerCount });
}

/** READY押下 */
export function trackReady() {
  trackEvent(EVENTS.ROOM_READY);
}

/** ゲーム開始 */
export function trackGameStart(playerCount: number, settings: { drawTime: number; roundCount: number }) {
  trackEvent(EVENTS.GAME_START, {
    player_count: playerCount,
    draw_time: settings.drawTime,
    round_count: settings.roundCount,
  });
}

/** ラウンド開始 */
export function trackRoundStart(round: number, topic: string) {
  trackEvent(EVENTS.ROUND_START, { round, topic });
}

/** 描画開始 */
export function trackDrawStart(round: number) {
  trackEvent(EVENTS.DRAW_START, { round, start_time: Date.now() });
}

/** 描画完了（時間内に何か描いたか） */
export function trackDrawComplete(round: number, hasContent: boolean, strokeCount: number) {
  trackEvent(EVENTS.DRAW_COMPLETE, {
    round,
    has_content: hasContent,
    stroke_count: strokeCount,
  });
}

/** 投票画面表示 */
export function trackVoteStart(round: number, drawingCount: number) {
  trackEvent(EVENTS.VOTE_START, { round, drawing_count: drawingCount });
}

/** 投票完了 */
export function trackVoteComplete(round: number, timeToVoteMs: number) {
  trackEvent(EVENTS.VOTE_COMPLETE, { round, time_to_vote_ms: timeToVoteMs });
}

/** 結果閲覧 */
export function trackResultView(round: number, myRank: number, totalPlayers: number) {
  trackEvent(EVENTS.RESULT_VIEW, { round, my_rank: myRank, total_players: totalPlayers });
}

/** ゲーム終了 */
export function trackGameEnd(totalRounds: number, finalRank: number, totalPlayers: number) {
  trackEvent(EVENTS.GAME_END, {
    total_rounds: totalRounds,
    final_rank: finalRank,
    total_players: totalPlayers,
    session_complete: true,
  });
}

/** 再戦 */
export function trackRematch() {
  trackEvent(EVENTS.REMATCH_START);
}

/** 離脱トラッキング（どの画面で離脱したか） */
export function trackDrop(phase: 'lobby' | 'drawing' | 'voting' | 'result') {
  const eventMap = {
    lobby: EVENTS.DROP_LOBBY,
    drawing: EVENTS.DROP_DRAWING,
    voting: EVENTS.DROP_VOTING,
    result: EVENTS.DROP_RESULT,
  };
  trackEvent(eventMap[phase]);
}

/** 色変更 */
export function trackColorChange(color: string) {
  trackEvent(EVENTS.COLOR_CHANGE, { color });
}

/** 全消し */
export function trackDrawingClear(round: number) {
  trackEvent(EVENTS.DRAWING_CLEAR, { round });
}
