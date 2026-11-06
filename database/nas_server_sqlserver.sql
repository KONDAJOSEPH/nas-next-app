-- NAS Transaction Company: central database (SQL Server, Juba)
-- Same tables as the local SQLite database, plus columns that help sync.

IF OBJECT_ID('dbo.Places') IS NULL
CREATE TABLE dbo.Places (                              -- South Kordofan localities and towns (used for Village)
  Code  NVARCHAR(30)  NOT NULL CONSTRAINT PK_Places PRIMARY KEY,
  Name  NVARCHAR(60)  NOT NULL,
  Type  NVARCHAR(10)  NOT NULL CONSTRAINT CK_Places_Type CHECK (Type IN (N'Locality', N'Town'))
);

IF OBJECT_ID('dbo.Agents') IS NULL
CREATE TABLE dbo.Agents (
  AgentId       INT IDENTITY(1,1) CONSTRAINT PK_Agents PRIMARY KEY,
  AgentCode     NVARCHAR(20)  NOT NULL CONSTRAINT UQ_Agents_Code UNIQUE,
  Name          NVARCHAR(120) NOT NULL,
  Location      NVARCHAR(60)  NOT NULL,
  FloatBalance  DECIMAL(18,2) NOT NULL CONSTRAINT DF_Agents_Float DEFAULT 0 CONSTRAINT CK_Agents_Float CHECK (FloatBalance >= 0),
  Commission    DECIMAL(18,2) NOT NULL CONSTRAINT DF_Agents_Comm  DEFAULT 0 CONSTRAINT CK_Agents_Comm  CHECK (Commission  >= 0)
);

IF OBJECT_ID('dbo.Customers') IS NULL
CREATE TABLE dbo.Customers (
  Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Customers PRIMARY KEY,
  FullName         NVARCHAR(120) NOT NULL,
  Phone            NVARCHAR(20)  NOT NULL CONSTRAINT UQ_Customers_Phone UNIQUE,
  Village          NVARCHAR(30)  NOT NULL CONSTRAINT FK_Customers_Village REFERENCES dbo.Places(Code),
  PhotoPath        NVARCHAR(400) NULL,
  FingerprintPath  NVARCHAR(400) NULL,
  SignaturePath    NVARCHAR(400) NULL,
  CreatedAt        DATETIME2(0)  NOT NULL,
  IsSynced         BIT           NOT NULL CONSTRAINT DF_Customers_Synced DEFAULT 1,   -- always 1 on the server
  SyncedAt         DATETIME2(0)  NOT NULL CONSTRAINT DF_Customers_SyncedAt DEFAULT SYSUTCDATETIME(),
  RowVer           ROWVERSION                                                        -- devices pull changes after their last RowVer
);

IF OBJECT_ID('dbo.Transactions') IS NULL
CREATE TABLE dbo.Transactions (
  Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Transactions PRIMARY KEY,  -- same GUID the device made, so a retry cannot duplicate
  TransactionCode  NVARCHAR(30)  NOT NULL,                                            -- e.g. NAS-TRAN-001
  SenderPhone      NVARCHAR(20)  NOT NULL,
  ReceiverPhone    NVARCHAR(20)  NOT NULL,
  Amount           DECIMAL(18,2) NOT NULL CONSTRAINT CK_Tx_Amount CHECK (Amount > 0),
  Fee              DECIMAL(18,2) NOT NULL,
  Total            DECIMAL(18,2) NOT NULL,
  AgentId          INT           NOT NULL CONSTRAINT FK_Tx_Agent  REFERENCES dbo.Agents(AgentId),
  [Date]           DATETIME2(0)  NOT NULL,
  GpsLat           DECIMAL(9,6)  NULL,
  GpsLng           DECIMAL(9,6)  NULL,
  Status           NVARCHAR(10)  NOT NULL CONSTRAINT DF_Tx_Status DEFAULT N'Synced' CONSTRAINT CK_Tx_Status CHECK (Status IN (N'Pending', N'Synced')),
  Signature        NVARCHAR(400) NULL,
  PaidAt           DATETIME2(0)  NULL,
  PaidByAgentId    INT           NULL CONSTRAINT FK_Tx_PaidBy REFERENCES dbo.Agents(AgentId),
  SyncedAt         DATETIME2(0)  NOT NULL CONSTRAINT DF_Tx_SyncedAt DEFAULT SYSUTCDATETIME(),
  RowVer           ROWVERSION,
  CONSTRAINT UQ_Tx_AgentCode UNIQUE (AgentId, TransactionCode),
  CONSTRAINT CK_Tx_Phones    CHECK (SenderPhone <> ReceiverPhone),
  CONSTRAINT CK_Tx_Fee       CHECK (ABS(Fee   - Amount * 0.05)  < 0.005),
  CONSTRAINT CK_Tx_Total     CHECK (ABS(Total - (Amount + Fee)) < 0.005)
);

IF OBJECT_ID('dbo.FloatLedger') IS NULL
CREATE TABLE dbo.FloatLedger (
  Id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_FloatLedger PRIMARY KEY,
  AgentId           INT           NOT NULL CONSTRAINT FK_Ledger_Agent REFERENCES dbo.Agents(AgentId),
  EntryType         NVARCHAR(10)  NOT NULL CONSTRAINT CK_Ledger_Type CHECK (EntryType IN (N'send', N'cashout', N'topup', N'redeem')),
  Reference         NVARCHAR(60)  NULL,
  FloatChange       DECIMAL(18,2) NOT NULL,
  CommissionChange  DECIMAL(18,2) NOT NULL CONSTRAINT DF_Ledger_Comm DEFAULT 0,
  CreatedAt         DATETIME2(0)  NOT NULL,
  RowVer            ROWVERSION
);

CREATE INDEX IX_Tx_Sender    ON dbo.Transactions (SenderPhone);
CREATE INDEX IX_Tx_Receiver  ON dbo.Transactions (ReceiverPhone);
CREATE INDEX IX_Tx_Date      ON dbo.Transactions ([Date]);
CREATE INDEX IX_Tx_Status    ON dbo.Transactions (Status);
CREATE INDEX IX_Ledger_Agent ON dbo.FloatLedger (AgentId, CreatedAt);

INSERT INTO dbo.Places (Code, Name, Type)
SELECT v.Code, v.Name, v.Type FROM (VALUES
  (N'Abassiya', N'Abassiya', N'Locality'),
  (N'AbuJubayhah', N'Abu Jubayhah', N'Locality'),
  (N'AbuKershola', N'Abu Kershola', N'Locality'),
  (N'AlBuram', N'Al Buram', N'Locality'),
  (N'AlLeri', N'Al Leri', N'Locality'),
  (N'AlQuoz', N'Al Quoz', N'Locality'),
  (N'AtTadamon', N'At Tadamon', N'Locality'),
  (N'Delami', N'Delami', N'Locality'),
  (N'Dilling', N'Dilling', N'Locality'),
  (N'Ghadeer', N'Ghadeer', N'Locality'),
  (N'Habila', N'Habila', N'Locality'),
  (N'Heiban', N'Heiban', N'Locality'),
  (N'Kadugli', N'Kadugli', N'Locality'),
  (N'Kalogi', N'Kalogi', N'Town'),
  (N'Kauda', N'Kauda', N'Town'),
  (N'Rashad', N'Rashad', N'Locality'),
  (N'ReifAshargi', N'Reif Ashargi', N'Locality'),
  (N'Talodi', N'Talodi', N'Locality'),
  (N'UmmDurein', N'Umm Durein', N'Locality')
) AS v (Code, Name, Type)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Places p WHERE p.Code = v.Code);

IF NOT EXISTS (SELECT 1 FROM dbo.Agents WHERE AgentCode = N'AG-001')
INSERT INTO dbo.Agents (AgentCode, Name, Location, FloatBalance, Commission)
VALUES (N'AG-001', N'Demo Agent', N'Kauda', 500000, 15000);
