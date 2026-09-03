# CAP V1 - perdas por hora e vozes

Implementação preparada sobre o projeto `biw_bordero`.

## O que foi implementado

### 1. Limite de perda por hora

O endpoint existente `/cap/producao` agora:

1. consulta os dados de `cap.cap_get_prod_and_losses_cars($1, $2)`;
2. consulta o `tc_target` da linha de referência `SCC` em `tc.dim_line`;
3. calcula `JPH máximo = FLOOR(3600 / tc_target)`;
4. agrupa as perdas pela hora de `ts_inicio`;
5. limita a soma das perdas da hora ao JPH máximo;
6. mantém a produção `REALIZADO` fora do limite;
7. registra `valor_original`, `jph_max` e `perda_limitada` para auditoria.

Quando uma hora tem, por exemplo, 69 perdas e o JPH máximo da SCC é 45, a soma das perdas retornada pelo backend fica em 45.

A distribuição do limite entre várias categorias é proporcional e inteira, para não ultrapassar o limite.

### 2. Voz / tipo de perda

Foi criado `api/usecases/cap/utils/cap.lossVoices.js` com todas as categorias do documento CAP:

- New Product/Process -> Induced Dow Time
- Cycle time losses -> Loss of time cycle
- Quality lock (exped/Delivery) -> Quality Loss
- Line Stoppages -> Operating Loss
- Functional stops -> Functional stops
- Saturation -> Induced Dow Time
- Breakdown time -> Equipment failures
- Missing part - Supplier -> Losses Product/Process
- Missing Body -> Induced Dow Time
- Energy / IT -> Induced Dow Time
- Kitting stoppages -> Induced Dow Time
- Missing Part - Internal Log -> Induced Dow Time
- Unspecified losses -> Unspecified losses

Regra explícita do documento:

`PPA + Quebras/Breakdown -> Missing Body`

A produção `REALIZADO` não recebe voz.

### 3. Banco

Foi preparada `back-end/database/migrations/001_cap_vozes.sql` para criar `cap.dim_voz_perda` e cadastrar o quadro de vozes.

**Importante:** o ZIP do projeto não contém o DDL da tabela física que alimenta `cap.cap_get_prod_and_losses_cars`. Por isso, não foi inventado um nome de tabela para adicionar fisicamente a coluna `voz`. A tabela de configuração está pronta; a coluna física deve ser adicionada quando o nome/DDL da origem for confirmado no PostgreSQL.

## Arquivos alterados

- `back-end/api/usecases/cap/cap.pgQueries.js`
- `back-end/api/usecases/cap/cap.pgService.js`
- `back-end/api/usecases/cap/utils/cap.lossVoices.js` (novo)
- `back-end/api/usecases/cap/utils/cap.lossLimit.js` (novo)
- `back-end/database/migrations/001_cap_vozes.sql` (novo)
- `back-end/test/cap.lossVoices.test.js` (novo)
- `back-end/package.json` (script `npm test`)

## Teste local

Executado:

```bash
npm test
```

Resultado: 3 testes aprovados.

Também foi executado `node --check` nos arquivos JavaScript alterados.

## Próximo passo no banco real

Executar primeiro a migration de `cap.dim_voz_perda`.
Depois, consultar a definição de `cap.cap_get_prod_and_losses_cars` e da tabela/view de origem para adicionar a coluna física `voz` sem quebrar o CAP.
