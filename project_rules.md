# 🌳 CRONOFY — APP TREE v2

---

# 🎯 OBJETIVO

Este documento define:

* estrutura de pastas
* telas do app
* fluxo de navegação
* funcionalidades atuais
* roadmap (free → pro)

Serve como guia para desenvolvimento e continuidade do projeto.

---

# 🧱 ESTRUTURA DE PASTAS

```plaintext
app/
  index.tsx
  home.tsx
  schedule.tsx

  setup/
    index.tsx
    concurso.tsx
    nivel.tsx
    foco.tsx
    disponibilidade.tsx
    dias.tsx
    materias.tsx

  auth/ (futuro)
    login.tsx
    signup.tsx

context/
  AppContext.tsx
  SetupContext.tsx
  ScheduleContext.tsx
  AIContext.tsx

utils/
  scheduleEngine.ts
  behaviorTracker.ts
  predictionEngine.ts
  aiEngine.ts

components/
  ui/
    AIInsightsCard.tsx
    SubjectProgressCard.tsx
    CountdownWidget.tsx

hooks/ (futuro)
services/ (futuro)
constants/ (futuro)
assets/
```

---

# 🧭 FLUXO DE NAVEGAÇÃO

```plaintext
index.tsx
   ↓
setup (se não configurado)
   ↓
home
   ↓
schedule
```

---

# 📱 TELAS

---

## 🏁 `index.tsx`

### Responsabilidade:

* verificar se setup está completo
* verificar se cronograma existe
* redirecionar automaticamente

### Regras:

```plaintext
sem setup → /setup
com setup + sem schedule → /setup
com tudo → /home
```

---

## ⚙️ SETUP FLOW

### 📍 `setup/index.tsx`

* tela inicial de configuração
* lista de etapas

---

### 📍 `setup/concurso.tsx`

* usuário define objetivo (ex: Banco do Brasil)

---

### 📍 `setup/nivel.tsx`

* iniciante / intermediário / avançado

---

### 📍 `setup/foco.tsx`

* objetivo principal (ex: passar rápido)

---

### 📍 `setup/disponibilidade.tsx`

* horas por dia

---

### 📍 `setup/dias.tsx`

* dias disponíveis

---

### 📍 `setup/materias.tsx`

* matérias do estudo

---

## 🏠 `home.tsx`

### Responsabilidade:

Tela principal do app

---

### Componentes:

#### 🔹 Próximo bloco

* próximo estudo do dia

#### 🔹 Progresso por matéria

```plaintext
SubjectProgressCard
```

#### 🔹 IA (MUITO IMPORTANTE)

```plaintext
AIInsightsCard
```

Mostra:

* consistência
* risco
* melhor horário
* ajuste sugerido

#### 🔹 Countdown (opcional)

```plaintext
CountdownWidget
```

---

## 📅 `schedule.tsx`

### Responsabilidade:

* visualizar cronograma completo
* marcar blocos como concluídos

---

### Interações:

✔ marcar bloco como concluído
✔ atualizar progresso
✔ disparar IA

---

### Integração principal:

```plaintext
completeBlockById
→ scheduleEngine
→ AIContext
→ aiEngine
```

---

# 🧠 SISTEMA DE IA NA UI

## 📍 `AIInsightsCard.tsx`

Mostra:

* mensagem da IA
* risco atual
* sugestão

---

### Exemplo de dados:

```plaintext
"Seu risco de quebra está alto"
"Você rende melhor à noite"
"Reduza a carga para 70%"
```

---

# 📦 FUNCIONALIDADES

---

## 🆓 FREE (ATUAL)

✔ criação de cronograma
✔ definição de matérias
✔ persistência local
✔ marcar blocos
✔ progresso por matéria
✔ IA básica
✔ insights simples

---

## 💎 PRO (FUTURO)

✔ histórico completo de desempenho
✔ gráficos
✔ previsões avançadas
✔ adaptação automática do cronograma
✔ widgets personalizados
✔ login + sincronização
✔ backup em nuvem
✔ IA mais agressiva (replanejamento)

---

# 🔁 FLUXO INTERNO DO APP

```plaintext
usuário conclui bloco
→ ScheduleContext
→ completeBlock
→ gerar UserStudyLog
→ AIContext (upsert)
→ aiEngine (análise)
→ aiAnalysis
→ Home renderiza insights
```

---

# 🧠 RELAÇÃO ENTRE CAMADAS

```plaintext
UI (app/)
↓
Context (state)
↓
Engines (lógica)
↓
Dados do usuário
```

---

# 📊 COMPONENTES IMPORTANTES

---

## 🔹 AIInsightsCard

* consome `ai.aiAnalysis`
* renderiza insights

---

## 🔹 SubjectProgressCard

* progresso por matéria

---

## 🔹 CountdownWidget

* dias até prova

---

# ⚠️ REGRAS IMPORTANTES

---

## 1. Separação de responsabilidade

* UI → renderiza
* Context → controla estado
* Engine → calcula

---

## 2. IA NÃO fica na UI

* IA fica no `aiEngine`
* UI só consome resultado

---

## 3. Schedule NÃO contém IA

* apenas dispara eventos

---

## 4. 1 log por dia

usar:

```plaintext
upsertStudyLog
```

---

# 🚀 ROADMAP

---

## Fase 1 (ATUAL)

✔ estrutura
✔ engine
✔ IA integrada

---

## Fase 2

* UI da IA bonita
* melhorar UX
* feedback visual

---

## Fase 3

* histórico
* gráficos
* ranking pessoal

---

## Fase 4 (PRO)

* login
* nuvem
* IA adaptativa completa

---

# 🧠 COMO USAR ESTE DOCUMENTO

Ao iniciar novo chat:

1. cole `project_rules.md`
2. cole `app_tree.md`
3. diga:

```plaintext
continuar Cronofy
```

---

# 🔚 RESUMO

Cronofy é:

* um planner inteligente
* com IA comportamental
* focado em consistência
* com evolução progressiva

---

👉 Esse arquivo define **como o app funciona visualmente e estruturalmente**
👉 O `project_rules.md` define **como ele pensa**

Juntos, você tem um sistema completo.
