# 🚀 AprovAI

> Sistema inteligente de preparação para concursos públicos  
> Foco em constância, adaptação e progresso real

---

## 🧠 Sobre o projeto

O **AprovAI** não é apenas um organizador de estudos.

Ele é um sistema que:

- organiza automaticamente o plano de estudo
- guia o usuário no que fazer diariamente
- mede consistência e execução real
- valida aprendizado através de prática
- adapta o cronograma com base no desempenho
- reduz fricção e culpa
- aumenta constância
- maximiza a chance de aprovação

---

## 🎯 Filosofia do produto

O AprovAI foi construído com base em princípios simples:

- constância > intensidade
- adaptação > rigidez
- sistema > motivação
- progresso real > volume ilusório

---

## 🏗️ Arquitetura

O sistema foi projetado para ser modular, escalável e orientado a domínio.

### Contextos

- SetupContext → dados iniciais do usuário  
- ScheduleContext → cronograma e execução de blocos  
- AIContext → análise comportamental e consistência  
- PracticeContext → sessões de prática e desempenho  
- AppContext → fachada unificada do sistema  

---

### Engines

- scheduleEngine → geração inicial do plano  
- adaptivePlanningEngine → adaptação automática  
- reviewEngine → criação de revisões  
- behaviorTracker → análise de consistência  
- predictionEngine → risco e carga sugerida  
- practiceEngine → construção de sessões de prática  
- questionBankEngine → seleção de questões  

---

## 🔄 Fluxo principal do sistema

O AprovAI opera em um ciclo contínuo:

onboarding → cronograma → execução → prática → adaptação

Mais detalhado:

1. O sistema gera um plano automático  
2. O usuário executa blocos de estudo  
3. Fornece feedback (dificuldade + confiança)  
4. Realiza prática (validação objetiva)  
5. O sistema coleta dados  
6. O plano é ajustado automaticamente  

---

## 🧪 Sistema de prática

A prática não é uma feature isolada.

Ela é um **sensor do sistema**.

### Funções:

- validar aprendizado real  
- detectar inconsistência entre confiança e desempenho  
- alimentar o sistema adaptativo  

### Características:

- sessões curtas (5–10 questões)  
- baseadas no plano do dia  
- focadas em matérias fracas  
- feedback imediato  

---

## 📚 Banco de questões

O AprovAI utiliza um **Question Bank interno**, com:

- base inicial (seed)
- estrutura padronizada
- integração com o sistema adaptativo

### Estrutura:

data/
  questions/
    seed/
      constitutional-law.json
      portuguese.json

### Modelo:

QuestionBankItem {
  id: string
  subject: string
  topic?: string
  statement: string
  options: { id: string, text: string }[]
  correctOptionId: string
  explanation?: string
  difficulty?: number
  tags: string[]
}

---

## 🧠 Adaptação inteligente

O sistema adapta automaticamente o plano com base em:

- consistência do usuário
- taxa de conclusão
- dificuldade percebida
- confiança declarada
- desempenho na prática

### Ações possíveis:

- redistribuição de blocos  
- redução de carga  
- inserção de revisão  
- reforço de matéria fraca  
- proteção de constância  

---

## 📊 Home (Painel Inteligente)

A Home não é um dashboard.

Ela é um **painel de decisão**.

Exibe:

- o que estudar hoje  
- próximo bloco  
- sinal da IA  
- prática sugerida  
- matéria mais fraca  
- progresso real  

---

## 🎨 Experiência do usuário

O AprovAI foi desenhado para:

- reduzir fricção  
- eliminar decisões desnecessárias  
- manter o usuário em movimento  

A prática segue o princípio:

"Resolva isso agora em 2 minutos"

---

## ⚠️ Decisões de produto

O AprovAI NÃO é:

- um banco de questões massivo  
- um sistema de ranking  
- uma rede social  
- um app de motivação  

Ele é:

👉 um sistema que faz o usuário estudar de forma consistente e eficiente

---

## 🛠️ Stack

- React Native (Expo Router)  
- TypeScript  
- AsyncStorage  

---

## 🚧 Roadmap (alto nível)

- [x] Cronograma automático  
- [x] Execução de blocos  
- [x] Sistema adaptativo  
- [x] Análise de comportamento  
- [x] Estrutura de prática  
- [ ] Integração completa com banco de questões  
- [ ] Otimização de UX da prática  
- [ ] Ajustes finos de adaptação  

---

## 💡 Objetivo final

Construir um sistema que:

- organiza  
- orienta  
- valida  
- adapta  
- evolui com o usuário  

E não apenas mais um app de estudos.

---

## 🧠 Visão

O AprovAI é um sistema que pensa.

E quanto mais o usuário usa, melhor ele fica.