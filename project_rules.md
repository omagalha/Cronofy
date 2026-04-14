🚀 Cronofy — Project Rules v2

🧠 Visão do Projeto

Cronofy é um app de organização de estudos para concursos com foco em:

- entrada simples (sem fricção)
- valor imediato (cronograma automático)
- progressão natural (uso → login → pro)
- evolução para assistente inteligente (IA)

O app deve parecer:
- simples
- premium
- funcional desde o primeiro uso
- limpo e sem poluição visual
- escalável

---

🧱 Arquitetura

📁 Estrutura

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

hooks/
constants/
assets/

---

🔥 Regras de Organização

- app/ → telas
- context/ → estado global
- utils/ → regras de negócio
- components/ui → UI reutilizável
- hooks/ → lógica isolada

❌ NÃO colocar lógica nas telas  
❌ NÃO duplicar regras fora do engine  

---

🧠 Contextos (ANTI-SPAGHETTI)

SetupContext:
- setupData
- persistência
- matérias
- dias disponíveis

ScheduleContext:
- persistedSchedule
- schedule
- isScheduleStale
- refreshSchedule
- completeBlockById

AppProvider:
- combina Setup + Schedule

AppContext:
- ponte de consumo
- useAppContext()

---

🧠 Estado Global

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

🧠 Cronograma

StudyBlock = {
  id: string
  subject: string
  time: string
  duration: string
  type?: 'new' | 'review' | 'practice'
  tip?: string
  completed?: boolean
  completedAt?: string
  skipped?: boolean
}

ScheduleDay = {
  id: string
  day: string
  blocks: StudyBlock[]
}

PersistedSchedule = {
  days: ScheduleDay[]
  meta: {
    generatedAt: string
    engineVersion: string
    setupHash: string
  }
}

---

🔁 Persistência

- usar AsyncStorage
- salvar setupData e schedule
- restaurar ao abrir o app

---

🧠 Cronograma Resiliente

Obrigatório no engine:

- createSetupHash
- buildPersistedSchedule
- isScheduleOutdated

Se setup mudar:
→ marcar cronograma como desatualizado

UX:
→ mostrar aviso
→ permitir atualizar

❌ NÃO sobrescrever automaticamente

---

📅 Regras do Cronograma

Blocos por dia:
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

✅ Execução

completeBlock:
- marca bloco como concluído
- salva completed + completedAt

Objetivo:
→ transformar app em sistema de execução

---

📊 Sistema de Progresso

getSubjectProgressMap(schedule)

- calcula progresso por matéria
- normaliza "Revisão - X" → X

UI:
- SubjectProgressCard
- ProgressRing

---

🎨 Progress Ring

- círculo oco
- borda fina
- discreto
- premium
- sem exagero visual

---

⏳ Sistema de Data da Prova

campo:
examDate: string

formato:
YYYY-MM-DD

utils/examDate.ts:
- getDaysUntilExam
- formatExamDate
- getCountdownTone
- getCountdownLabel

estados:
- sem data → definir data
- >90 dias → neutro
- 30–90 → warning
- <30 → urgente
- hoje → "A prova é hoje"

---

🚀 Countdown Widget

- mostra dias restantes
- mostra data formatada
- muda cor por urgência

posição:
→ logo após o header

---

📱 Home Screen

ordem:

Header
Countdown
Aviso stale
Hero (hoje)
Stats
Resumo
Progresso por matéria
Blocos do dia
Botões

---

Hero:

- mostra dia atual
- mostra próximo bloco NÃO concluído

estados:
- próximo bloco
- tudo concluído
- nenhum bloco

---

Stats:

- matérias
- concluídos
- blocos

---

Resumo:

- concurso
- prova
- nível
- foco
- disponibilidade

---

Progresso:

- lista de matérias
- % concluído
- círculo premium

---

Blocos:

- subject
- time
- duration
- tip
- botão concluir

---

🔐 Login

- opcional
- só após valor entregue

---

💎 Free vs Pro

Free:
- cronograma
- progresso
- countdown
- execução

Pro:
- IA
- insights
- análise
- sugestões

---

🎯 Estratégia

1. entrar sem fricção  
2. gerar valor  
3. engajar  
4. salvar  
5. monetizar  

---

⚠️ Regras IMPORTANTES

- NÃO travar usuário no início
- NÃO paywall agressivo
- SEMPRE mostrar valor antes
- lógica no engine
- UI limpa e premium

---

🔮 Futuro

- Firebase
- sync
- IA adaptativa
- streak
- dashboard

---

🧠 Filosofia

Simples → funcional → escalável → inteligente