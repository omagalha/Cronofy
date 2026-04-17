# 🧠 AprovAI

**AprovAI** é um aplicativo mobile inteligente para organização de estudos voltado para concursos públicos.

Ele não é apenas um planner.

O AprovAI funciona como um **sistema adaptativo de preparação**, que:

- organiza automaticamente o cronograma
- guia o usuário no dia a dia
- mede consistência
- identifica dificuldades
- adapta o plano com base no comportamento
- reduz a frustração e a culpa
- aumenta a constância

---

## 🎯 Proposta

A maioria das pessoas falha não por falta de esforço, mas por:

- não saber o que estudar agora
- estudar sem estratégia
- esquecer rapidamente o conteúdo
- não conseguir manter consistência
- não ter feedback claro de progresso

O AprovAI resolve isso com um sistema que:

> **pensa, adapta e evolui junto com o usuário**

---

## 🧠 Filosofia do Produto

- constância > intensidade  
- adaptação > rigidez  
- sistema > motivação  
- progresso real > volume ilusório  

---

## ⚙️ Stack

- React Native
- Expo Router
- TypeScript
- AsyncStorage

---

## 🏗️ Arquitetura

O projeto segue uma arquitetura orientada a domínio, separando responsabilidades:

### Contextos

- **SetupContext**
  - dados do usuário
  - prova, matérias, disponibilidade

- **ScheduleContext**
  - cronograma
  - execução de blocos
  - integração com adaptação

- **AIContext**
  - análise de comportamento
  - consistência
  - taxa de conclusão
  - risco

- **AppContext**
  - fachada unificada
  - ponto de acesso para a UI

---

### Engines

- **scheduleEngine**
  - gera cronograma inicial

- **adaptivePlanningEngine**
  - ajusta o plano automaticamente com base em:
    - desempenho
    - consistência
    - risco
    - fase do usuário

- **reviewEngine**
  - cria revisões automaticamente

- **behaviorTracker**
  - mede consistência e padrões

- **predictionEngine**
  - estima risco e carga ideal

---

## 🧩 Funcionalidades atuais

- onboarding inteligente
- geração automática de cronograma
- execução diária por blocos
- registro de dificuldade e confiança
- ajustes adaptativos automáticos
- sugestões inteligentes de estudo
- painel de controle na home
- acompanhamento de progresso
- streak de consistência

---

## 🔥 Diferencial

O AprovAI não apenas organiza.

Ele:

- aprende com o usuário
- detecta padrões
- ajusta a carga
- redistribui atrasos
- prioriza matérias fracas
- protege a constância

---

## 🚀 Em desenvolvimento

### 🔹 Prática (Simulados)

Nova funcionalidade em desenvolvimento:

- sessões de questões baseadas nas matérias do dia
- feedback por matéria
- integração com o sistema adaptativo

Objetivo:

> estudar → praticar → ajustar → evoluir

---

## ❌ Fora do escopo atual

Para manter o foco no MVP:

- modo grupo
- ranking
- funcionalidades sociais
- simulados avançados
- backend complexo

---

## 🧪 Status do Projeto

O AprovAI está em fase de:

> **MVP (Minimum Viable Product)**

Foco atual:

- estabilização
- melhoria de experiência
- validação com usuários reais

---

## 💰 Monetização (futuro)

Modelo planejado:

### Gratuito
- cronograma
- execução
- prática básica
- progresso

### Pro
- insights avançados
- adaptação inteligente completa
- análise de desempenho por matéria
- recomendações automáticas

---

## 🧠 Visão

Construir um sistema que:

- organiza
- orienta
- adapta
- mede progresso real
- aumenta a constância

E não apenas mais um app de estudo.

---

## 📱 Roadmap

### Curto prazo
- estabilizar fluxo principal
- implementar prática simples
- melhorar Home como painel de controle

### Médio prazo
- integrar prática com adaptação
- melhorar insights
- introduzir versão Pro

### Longo prazo
- sistema completo de preparação
- inteligência preditiva
- evolução baseada em dados reais

---

## 👨‍💻 Autor

Desenvolvido por Thales.

---

## 📌 Observação

Este projeto está sendo construído com foco em:

- produto real
- experiência do usuário
- evolução incremental
- decisões orientadas a valor

---
