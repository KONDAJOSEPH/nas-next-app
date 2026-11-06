-- NAS Transaction Company: local database (SQLite, on the agent's device)
-- Dates are UTC ISO-8601 text. IDs created offline are GUIDs (TEXT).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Places (                   -- South Kordofan localities and towns (used for Village)
  Code  TEXT PRIMARY KEY,                             -- no spaces, used inside receipt codes
  Name  TEXT NOT NULL,
  Type  TEXT NOT NULL CHECK (Type IN ('Locality', 'Town'))
);

CREATE TABLE IF NOT EXISTS Agents (
  AgentId       INTEGER PRIMARY KEY AUTOINCREMENT,
  AgentCode     TEXT    NOT NULL UNIQUE,              -- e.g. AG-001
  Name          TEXT    NOT NULL,
  Location      TEXT    NOT NULL,
  FloatBalance  REAL    NOT NULL DEFAULT 0 CHECK (FloatBalance >= 0),
  Commission    REAL    NOT NULL DEFAULT 0 CHECK (Commission  >= 0)
);

CREATE TABLE IF NOT EXISTS Customers (
  Id               TEXT PRIMARY KEY,                  -- GUID
  FullName         TEXT NOT NULL,
  Phone            TEXT NOT NULL UNIQUE,
  Village          TEXT NOT NULL REFERENCES Places(Code),
  PhotoPath        TEXT,
  FingerprintPath  TEXT,                              -- added: captured in Module 1
  SignaturePath    TEXT,                              -- added: captured in Module 1
  CreatedAt        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  IsSynced         INTEGER NOT NULL DEFAULT 0 CHECK (IsSynced IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Transactions (
  Id               TEXT PRIMARY KEY,                  -- GUID, the real identity
  TransactionCode  TEXT NOT NULL,                     -- e.g. NAS-TRAN-001
  SenderPhone      TEXT NOT NULL,
  ReceiverPhone    TEXT NOT NULL,
  Amount           REAL NOT NULL CHECK (Amount > 0),
  Fee              REAL NOT NULL,                     -- 5% of Amount
  Total            REAL NOT NULL,                     -- Amount + Fee
  AgentId          INTEGER NOT NULL REFERENCES Agents(AgentId),
  "Date"           TEXT NOT NULL,
  GpsLat           REAL,
  GpsLng           REAL,
  Status           TEXT NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Synced')),
  Signature        TEXT,                              -- receiver signature, taken at cash-out
  PaidAt           TEXT,                              -- added: set at cash-out
  PaidByAgentId    INTEGER REFERENCES Agents(AgentId),
  UNIQUE (AgentId, TransactionCode),
  CHECK (SenderPhone <> ReceiverPhone),
  CHECK (ABS(Fee   - Amount * 0.05)   < 0.005),
  CHECK (ABS(Total - (Amount + Fee))  < 0.005)
);

CREATE TABLE IF NOT EXISTS FloatLedger (              -- added: audit trail behind FloatBalance and Commission
  Id                TEXT PRIMARY KEY,                 -- GUID
  AgentId           INTEGER NOT NULL REFERENCES Agents(AgentId),
  EntryType         TEXT NOT NULL CHECK (EntryType IN ('send', 'cashout', 'topup', 'redeem')),
  Reference         TEXT,
  FloatChange       REAL NOT NULL,
  CommissionChange  REAL NOT NULL DEFAULT 0,
  CreatedAt         TEXT NOT NULL,
  IsSynced          INTEGER NOT NULL DEFAULT 0 CHECK (IsSynced IN (0, 1))
);

CREATE INDEX IF NOT EXISTS IX_Transactions_Status   ON Transactions (Status);
CREATE INDEX IF NOT EXISTS IX_Transactions_Sender   ON Transactions (SenderPhone);
CREATE INDEX IF NOT EXISTS IX_Transactions_Receiver ON Transactions (ReceiverPhone);
CREATE INDEX IF NOT EXISTS IX_Transactions_Date     ON Transactions ("Date");
CREATE INDEX IF NOT EXISTS IX_Customers_IsSynced    ON Customers (IsSynced);
CREATE INDEX IF NOT EXISTS IX_FloatLedger_Agent     ON FloatLedger (AgentId, CreatedAt);

INSERT OR IGNORE INTO Places (Code, Name, Type) VALUES
  ('Abassiya', 'Abassiya', 'Locality'),
  ('AbuJubayhah', 'Abu Jubayhah', 'Locality'),
  ('AbuKershola', 'Abu Kershola', 'Locality'),
  ('AlBuram', 'Al Buram', 'Locality'),
  ('AlLeri', 'Al Leri', 'Locality'),
  ('AlQuoz', 'Al Quoz', 'Locality'),
  ('AtTadamon', 'At Tadamon', 'Locality'),
  ('Delami', 'Delami', 'Locality'),
  ('Dilling', 'Dilling', 'Locality'),
  ('Ghadeer', 'Ghadeer', 'Locality'),
  ('Habila', 'Habila', 'Locality'),
  ('Heiban', 'Heiban', 'Locality'),
  ('Kadugli', 'Kadugli', 'Locality'),
  ('Kalogi', 'Kalogi', 'Town'),
  ('Kauda', 'Kauda', 'Town'),
  ('Rashad', 'Rashad', 'Locality'),
  ('ReifAshargi', 'Reif Ashargi', 'Locality'),
  ('Talodi', 'Talodi', 'Locality'),
  ('UmmDurein', 'Umm Durein', 'Locality');

-- Starting agent (matches Module 4: float 500,000 SSP, commission 15,000 SSP)
INSERT OR IGNORE INTO Agents (AgentCode, Name, Location, FloatBalance, Commission)
VALUES ('AG-001', 'Demo Agent', 'Kauda', 500000, 15000);
