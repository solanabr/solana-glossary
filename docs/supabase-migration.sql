-- ============================================================================
-- Migracao Supabase — Solana Glossary Games
-- Execute este arquivo inteiro no SQL Editor do Supabase Dashboard.
-- Projeto: Solana Glossary — Tokenfy.me (@lg_lucas)
-- ============================================================================

-- ─── Tabela: profiles ──────────────────────────────────────────────────────
-- Perfil do jogador, criado no primeiro login via wallet.

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Anon',
  avatar_url TEXT,
  preferred_lang TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles (wallet_address);

-- ─── Tabela: leaderboard_escape ────────────────────────────────────────────
-- Pontuacao do Escape Room por tema e nivel.

CREATE TABLE IF NOT EXISTS leaderboard_escape (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  theme TEXT NOT NULL,
  level TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  time_seconds INTEGER,
  hints_used INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lb_escape_score ON leaderboard_escape (score DESC);
CREATE INDEX IF NOT EXISTS idx_lb_escape_profile ON leaderboard_escape (profile_id);

-- ─── Tabela: leaderboard_vida ──────────────────────────────────────────────
-- Pontuacao do Jogo da Vida por tabuleiro.

CREATE TABLE IF NOT EXISTS leaderboard_vida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  board TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  position INTEGER,
  players_count INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lb_vida_score ON leaderboard_vida (score DESC);
CREATE INDEX IF NOT EXISTS idx_lb_vida_profile ON leaderboard_vida (profile_id);

-- ─── Tabela: multiplayer_rooms ─────────────────────────────────────────────
-- Salas de jogo multiplayer para o Jogo da Vida.

CREATE TABLE IF NOT EXISTS multiplayer_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  board TEXT NOT NULL,
  host_wallet TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  max_players INTEGER NOT NULL DEFAULT 8,
  game_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON multiplayer_rooms (code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON multiplayer_rooms (status);

-- ─── Tabela: room_players ──────────────────────────────────────────────────
-- Jogadores em cada sala multiplayer.

CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT 'Anon',
  avatar TEXT,
  color TEXT NOT NULL DEFAULT '#9945FF',
  is_host BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rp_room ON room_players (room_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rp_room_wallet ON room_players (room_id, wallet_address);

-- ─── View: leaderboard_geral ───────────────────────────────────────────────
-- Ranking combinado somando pontos dos dois jogos.

CREATE OR REPLACE VIEW leaderboard_geral AS
SELECT
  p.id,
  p.wallet_address,
  p.display_name,
  p.avatar_url,
  COALESCE(escape.total, 0) AS escape_score,
  COALESCE(vida.total, 0) AS vida_score,
  COALESCE(escape.total, 0) + COALESCE(vida.total, 0) AS total_score
FROM profiles p
LEFT JOIN (
  SELECT profile_id, SUM(score) AS total
  FROM leaderboard_escape
  GROUP BY profile_id
) escape ON escape.profile_id = p.id
LEFT JOIN (
  SELECT profile_id, SUM(score) AS total
  FROM leaderboard_vida
  GROUP BY profile_id
) vida ON vida.profile_id = p.id
ORDER BY total_score DESC;

-- ─── RLS (Row Level Security) ──────────────────────────────────────────────
-- Leitura publica, escrita liberada via anon key (jogo educacional).

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);

ALTER TABLE leaderboard_escape ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lb_escape_select" ON leaderboard_escape FOR SELECT USING (true);
CREATE POLICY "lb_escape_insert" ON leaderboard_escape FOR INSERT WITH CHECK (true);

ALTER TABLE leaderboard_vida ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lb_vida_select" ON leaderboard_vida FOR SELECT USING (true);
CREATE POLICY "lb_vida_insert" ON leaderboard_vida FOR INSERT WITH CHECK (true);

ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select" ON multiplayer_rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON multiplayer_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update" ON multiplayer_rooms FOR UPDATE USING (true);

ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp_select" ON room_players FOR SELECT USING (true);
CREATE POLICY "rp_insert" ON room_players FOR INSERT WITH CHECK (true);
CREATE POLICY "rp_update" ON room_players FOR UPDATE USING (true);
CREATE POLICY "rp_delete" ON room_players FOR DELETE USING (true);

-- ─── Realtime ──────────────────────────────────────────────────────────────
-- Habilita Realtime para salas e jogadores (atualizacoes em tempo real).

ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;

-- ============================================================================
-- Pronto! Todas as tabelas, indices, views, RLS e Realtime configurados.
-- ============================================================================
