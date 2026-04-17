
# 📁 AprovAI — Estrutura do Projeto

Este documento descreve a estrutura do AprovAI, um sistema inteligente de preparação para concursos públicos.

A arquitetura foi pensada para:

- escalabilidade
- separação de responsabilidades
- evolução incremental
- clareza de domínio
- baixo acoplamento

---

# 🧠 Visão geral

O sistema é dividido em camadas principais:

- UI (app/)
- Contextos (context/)
- Domínio compartilhado (apps/shared/)
- Engines (utils/)
- Componentes (components/)
- Dados locais (data/)
- Infra de widgets (widgets/)

---

# 📱 Estrutura de diretórios

## app/

Responsável pelas telas e navegação (Expo Router)

```

app/
(tabs)/
_layout.tsx           # Tab bar principal

```
home.tsx              # Painel inteligente (centro do app)
schedule.tsx          # Cronograma e execução
practice.tsx          # Sessões de prática
insights.tsx          # Análises e métricas
profile.tsx           # Perfil do usuário
```

practice/
session.tsx           # Execução da prática (questões)
result.tsx            # Resultado da sessão

setup/
index.tsx             # Onboarding inicial

auth/
login.tsx             # Login (se aplicável)

```

---

## context/

Responsável pelo estado global e lógica de domínio

```

context/
AppProvider.tsx         # Composição de todos os providers
AppContext.tsx          # Fachada unificada

SetupContext.tsx        # Dados do usuário (objetivo, prova, etc)
ScheduleContext.tsx     # Cronograma + execução + adaptação
AIContext.tsx           # Análise comportamental
PracticeContext.tsx     # Sessões de prática e desempenho

```

---

## apps/shared/

Domínio compartilhado entre camadas

```

apps/
shared/
types/

```
  schedule.ts         # Tipos de cronograma
  practice.ts         # Tipos de prática
  review.ts           # Tipos de revisão
  intelligence.ts     # Tipos de IA

  questionBank.ts     # Tipos do banco de questões
```

```

---

## utils/

Engines e lógica de negócio (coração do sistema)

```

utils/
scheduleEngine.ts           # Geração inicial do cronograma
adaptivePlanningEngine.ts   # Ajustes automáticos do plano
reviewEngine.ts             # Criação de revisões
behaviorTracker.ts          # Consistência e padrões
predictionEngine.ts         # Risco e carga sugerida

practiceEngine.ts           # Criação de sessões de prática
questionBankEngine.ts       # Seleção de questões

progressEngine.ts           # Progresso esperado vs real
phaseEngine.ts              # Fase do usuário (ritmo, sprint, etc)

```

---

## components/

Componentes reutilizáveis de UI

```

components/

practice/
PracticeHeroCard.tsx
PracticeSessionCard.tsx
PracticeResultCard.tsx
SubjectPerformanceCard.tsx

widgets/
CountdownRingCard.tsx
NextBlockCard.tsx
AIDailySignalCard.tsx
DailyPracticeCard.tsx
WeakSubjectCard.tsx

ui/
Button.tsx
Card.tsx
ProgressBar.tsx

```

---

## widgets/

Infraestrutura de widgets desacoplados

```

widgets/
snapshot.ts             # Snapshot do estado global
fromAppContext.ts       # Conversão de contexto → widget
selectors.ts            # Seletores de dados
types.ts                # Tipos dos widgets

```

---

## data/

Dados locais do app (seed inicial)

```

data/
questions/
seed/

```
  portuguese.json
  logical-reasoning.json
  constitutional-law.json
  administrative-law.json
```

```

---

# 🧠 Fluxo do sistema

O AprovAI opera em um ciclo contínuo:

```

onboarding → cronograma → execução → prática → adaptação

```

---

## 🔄 Integração entre camadas

### Execução

- usuário conclui bloco
- ScheduleContext registra
- AIContext analisa comportamento

### Prática

- PracticeContext cria sessão
- practiceEngine define foco
- questionBankEngine entrega questões

### Resultado

- respostas geram QuestionResult
- SubjectPerformance é atualizado
- practiceSignals são gerados

### Adaptação

- ScheduleContext chama adaptivePlanningEngine
- sistema ajusta:
  - carga
  - revisões
  - foco por matéria

---

# 📊 Papel da Home

A Home é o centro do sistema.

Ela exibe:

- próximo bloco
- sinal da IA
- prática sugerida
- matéria mais fraca
- progresso real

---

# 🧪 Papel da Prática

A prática NÃO é um módulo isolado.

Ela é um **sensor do sistema**.

Responsável por:

- validar aprendizado
- detectar inconsistência
- alimentar adaptação

---

# ⚠️ Decisões arquiteturais importantes

- lógica de negócio fora da UI  
- contextos separados por responsabilidade  
- engines puras (sem dependência de UI)  
- dados persistidos localmente (AsyncStorage)  
- widgets desacoplados da navegação  

---

# 🚀 Evolução futura (planejada)

- otimização do question bank  
- melhoria da UX da prática  
- refinamento da adaptação  
- possível backend (quando necessário)  

---

# 🧠 Conclusão

O AprovAI não é apenas um app.

Ele é um sistema que:

- organiza  
- orienta  
- valida  
- adapta  
- evolui com o usuário  

Essa estrutura garante base sólida para crescimento sem perda de controle arquitetural.
```
