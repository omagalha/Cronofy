# 🚀 Cronofy

Seu plano de estudos inteligente para concursos públicos.

---

## 🧠 Visão

Cronofy é um app de organização de estudos com foco em:

- entrada simples (sem fricção)
- valor imediato (cronograma automático)
- execução real (concluir blocos)
- progresso visível
- senso de urgência (data da prova)
- evolução futura para IA adaptativa

O app deve parecer:
- simples
- premium
- limpo
- funcional desde o primeiro uso
- sem poluição visual

---

## 🧱 Arquitetura

### 📁 Estrutura

app/
  index.tsx
  _layout.tsx

  home.tsx
  schedule.tsx

  auth/
    login.tsx
    signin.tsx

  setup/
    index.tsx
    concurso.tsx
    data-prova.tsx
    nivel.tsx
    foco.tsx
    disponibilidade.tsx
    dias.tsx
    materias.tsx

context/
  SetupContext.tsx
  ScheduleContext.tsx
  AppProvider.tsx
  AppContext.tsx

components/
  ui/
    ProgressRing.tsx
    SubjectProgressCard.tsx
    CountdownWidget.tsx

utils/
  scheduleEngine.ts
  examDate.ts

---

## 🔥 Regras de Organização

- app/ → telas
- context/ → estado global
- utils/ → regras de negócio
- components/ui → UI reutilizável

❌ NÃO colocar lógica nas telas  
❌ NÃO duplicar lógica fora do engine  

---

## 🧠 Contextos

### SetupContext
- setupData
- matérias
- dias disponíveis
- persistência

### ScheduleContext
- schedule
- persistedSchedule
- isScheduleStale
- refreshSchedule
- completeBlockById

### AppContext
- ponte de consumo
- useAppContext()

---

## 🧠 Estado Global

UserSetupData = {
  concurso: string
  examDate: string
  nivel: string
  foco: string
  disponibilidade: string
  materias: string[]
  diasDisponiveis: string[]
}

---

## 🧠 Cronograma

StudyBlock = {
  id: string
  subject: string
  time: string
  duration: string
  type?: 'new' | 'review' | 'practice'
  tip?: string
  completed?: boolean
  completedAt?: string
}

---

## 🔁 Persistência

- AsyncStorage
- salvar setup + schedule
- restaurar ao abrir

---

## 🧠 Cronograma Resiliente

Engine controla:

- createSetupHash
- buildPersistedSchedule
- isScheduleOutdated

Se setup mudar:
→ cronograma fica desatualizado

UX:
→ mostrar aviso
→ permitir atualizar

---

## 📅 Regras do Cronograma

Blocos:
- até 1h → 1
- 1–2h → 2
- 2–4h → 3
- +4h → 4

Duração:
- iniciante → 45min
- intermediário → 1h
- avançado → 1h30

Foco:
- rápida → rotação
- base → equilíbrio
- revisão → adiciona review
- constância → limita blocos

---

## ✅ Execução

completeBlock:
- marca bloco como concluído
- salva completed + completedAt

---

## 📊 Progresso por Matéria

getSubjectProgressMap(schedule)

- calcula % concluído
- agrupa revisão com matéria original

UI:
- SubjectProgressCard
- ProgressRing

---

## 🎨 Progress Ring

- círculo oco
- borda fina
- discreto
- premium

---

## ⏳ Data da Prova

campo:
examDate: string

formato:
YYYY-MM-DD

---

## 🧠 examDate.ts

- getDaysUntilExam
- formatExamDate
- getCountdownLabel
- getCountdownTone

---

## 🚀 Countdown Widget

Mostra:
- dias restantes
- data da prova
- estado de urgência

Estados:
- >90 dias → neutro
- 30–90 → warning
- <30 → urgente
- hoje → "A prova é hoje"
- vazio → "Defina a data da prova"

---

## 📱 Home Screen

Ordem:

Header  
Countdown  
Aviso stale  
Hero  
Stats  
Resumo  
Progresso  
Blocos  
Botões  

---

### Hero

Mostra:
- dia atual
- próximo bloco NÃO concluído

Estados:
- próximo bloco
- tudo concluído
- vazio

---

### Stats

- matérias
- concluídos
- blocos

---

### Resumo

- concurso
- prova
- nível
- foco
- disponibilidade

---

### Progresso

- lista de matérias
- % concluído
- círculo visual

---

### Blocos

- subject
- horário
- duração
- tip
- botão concluir

---

## 🔐 Login

- opcional
- só depois de valor entregue

---

## 💎 Free vs Pro

Free:
- cronograma
- execução
- progresso
- countdown

Pro:
- IA
- insights
- análise
- sugestões

---

## 🎯 Estratégia

1. entrar sem fricção  
2. gerar valor  
3. engajar  
4. salvar progresso  
5. monetizar  

---

## ⚠️ Regras IMPORTANTES

- NÃO travar usuário
- NÃO paywall agressivo
- SEMPRE mostrar valor antes
- lógica no engine
- UI limpa e premium

---

## 🔮 Futuro

- Firebase Auth
- sync na nuvem
- IA adaptativa
- streak
- dashboard

---

## 🧠 Filosofia

Simples → funcional → escalável → inteligente