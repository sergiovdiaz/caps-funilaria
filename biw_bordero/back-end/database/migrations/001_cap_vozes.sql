-- CAP - classificação das perdas / vozes
-- Base: documento "demandas do CAP".
-- Execute esta migration no PostgreSQL do CAP.
--
-- Esta tabela guarda a regra de classificação para o backend.
-- A coluna "voz" deve ser adicionada na tabela física que armazena as perdas
-- quando o nome dessa tabela for confirmado no banco de produção, pois no
-- projeto entregue ela é acessada por funções/views PostgreSQL e não existe
-- o DDL da tabela de origem no repositório.

CREATE TABLE IF NOT EXISTS cap.dim_voz_perda (
    id BIGSERIAL PRIMARY KEY,
    grupo VARCHAR(100) NOT NULL UNIQUE,
    voz VARCHAR(100) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO cap.dim_voz_perda (grupo, voz) VALUES
('New Product/Process', 'Induced Dow Time'),
('Cycle time losses', 'Loss of time cycle'),
('Quality lock (exped/Delivery)', 'Quality Loss'),
('Line Stoppages', 'Operating Loss'),
('Functional stops', 'Functional stops'),
('Saturation', 'Induced Dow Time'),
('Breakdown time', 'Equipment failures'),
('Missing part - Supplier', 'Losses Product/Process'),
('Missing Body', 'Induced Dow Time'),
('Energy / IT', 'Induced Dow Time'),
('Kitting stoppages', 'Induced Dow Time'),
('Missing Part - Internal Log', 'Induced Dow Time'),
('Unspecified losses', 'Unspecified losses')
ON CONFLICT (grupo) DO UPDATE SET
    voz = EXCLUDED.voz,
    updated_at = NOW();

-- Regra específica do documento:
-- PPA + quebra => Missing Body.
-- Essa exceção é aplicada pelo backend em cap.lossVoices.js.
