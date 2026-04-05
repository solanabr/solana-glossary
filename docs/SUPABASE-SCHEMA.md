# Schema Supabase — Solana Glossary Games

> Ambos os jogos (Escape Room + Jogo da Vida) compartilham o mesmo projeto Supabase.
> O login e por wallet Solana. Nao ha senha ou email.

---

## Tabela: profiles

Perfil do jogador, criado no primeiro login via wallet.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL DEFAULT 'Anon',
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indice para busca por wallet
CREATE INDEX idx_profiles_wallet ON profiles (wallet_address);
```

## Tabela: leaderboard_escape

Pontuacao do Escape Room por tema e nivel.

```sql
CREATE TABLE leaderboard_escape (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  theme TEXT NOT NULL,        -- 'genesis', 'defi', 'lab'
  level TEXT NOT NULL,        -- 'surface', 'confirmation', 'finality', 'consensus'
  score INTEGER NOT NULL DEFAULT 0,
  time_seconds INTEGER,       -- tempo gasto em segundos
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lb_escape_score ON leaderboard_escape (score DESC);
CREATE INDEX idx_lb_escape_profile ON leaderboard_escape (profile_id);
```

## Tabela: leaderboard_vida

Pontuacao do Jogo da Vida por tabuleiro.

```sql
CREATE TABLE leaderboard_vida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  board TEXT NOT NULL,        -- 'normie', 'startup', 'timeline'
  score INTEGER NOT NULL DEFAULT 0,
  position INTEGER,           -- casa final
  players_count INTEGER,      -- quantos jogaram na partida
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lb_vida_score ON leaderboard_vida (score DESC);
CREATE INDEX idx_lb_vida_profile ON leaderboard_vida (profile_id);
```

## Tabela: multiplayer_rooms

Salas de jogo multiplayer para o Jogo da Vida.

```sql
CREATE TABLE multiplayer_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,  -- codigo curto para convite (ex: 'ABC123')
  board TEXT NOT NULL,        -- 'normie', 'startup', 'timeline'
  host_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  max_players INTEGER NOT NULL DEFAULT 8,
  game_state JSONB,           -- estado do jogo serializado
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rooms_code ON multiplayer_rooms (code);
CREATE INDEX idx_rooms_status ON multiplayer_rooms (status);
```

## Tabela: room_players

Jogadores em cada sala multiplayer.

```sql
CREATE TABLE room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  turn_order INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rp_room ON room_players (room_id);
CREATE UNIQUE INDEX idx_rp_room_profile ON room_players (room_id, profile_id);
```

## View: leaderboard_geral

Ranking combinado somando pontos dos dois jogos.

```sql
CREATE VIEW leaderboard_geral AS
SELECT
  p.id,
  p.wallet_address,
  p.nickname,
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
```

## RLS (Row Level Security)

```sql
-- Profiles: qualquer um le, so o dono edita
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles visíveis" ON profiles FOR SELECT USING (true);
CREATE POLICY "Editar proprio perfil" ON profiles FOR UPDATE
  USING (wallet_address = current_setting('app.wallet_address'));

-- Leaderboards: qualquer um le, insercao autenticada
ALTER TABLE leaderboard_escape ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard escape visivel" ON leaderboard_escape FOR SELECT USING (true);
CREATE POLICY "Inserir propria pontuacao escape" ON leaderboard_escape FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE wallet_address = current_setting('app.wallet_address')));

ALTER TABLE leaderboard_vida ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard vida visivel" ON leaderboard_vida FOR SELECT USING (true);
CREATE POLICY "Inserir propria pontuacao vida" ON leaderboard_vida FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE wallet_address = current_setting('app.wallet_address')));

-- Rooms: qualquer um le, host gerencia
ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rooms visiveis" ON multiplayer_rooms FOR SELECT USING (true);
CREATE POLICY "Host gerencia room" ON multiplayer_rooms FOR ALL
  USING (host_id IN (SELECT id FROM profiles WHERE wallet_address = current_setting('app.wallet_address')));

-- Room players: qualquer um le, jogador gerencia proprio
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room players visiveis" ON room_players FOR SELECT USING (true);
```

## Realtime

Habilitar Realtime nas tabelas de multiplayer:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
```

---

## Variaveis de Ambiente (.env)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```
