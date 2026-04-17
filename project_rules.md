📱 CONTEXTO DO PRODUTO

O AprovAI é um sistema inteligente de preparação para concursos públicos.

Ele NÃO é um organizador comum.

Ele deve:

organizar o estudo
guiar o que fazer no dia
medir consistência
validar aprendizado com prática
adaptar automaticamente o plano
reduzir culpa do usuário
aumentar constância
maximizar chance de aprovação
🧠 FILOSOFIA DO PRODUTO
constância > intensidade
adaptação > rigidez
sistema > motivação
progresso real > volume ilusório
🏗️ BASE ATUAL DO SISTEMA

O app já existe e está estruturado com:

Stack:

React Native (Expo Router)
TypeScript
AsyncStorage

Arquitetura:

SetupContext
ScheduleContext
AIContext
PracticeContext
AppContext (fachada)

Engines:

scheduleEngine
adaptivePlanningEngine
reviewEngine
behaviorTracker
predictionEngine

Funcionalidades já existentes:

cronograma automático
execução de blocos
feedback de dificuldade e confiança
sistema adaptativo
análise de comportamento
prática (estrutura inicial já criada)
Home como painel inteligente
widgets desacoplados via snapshot
📦 REPOSITÓRIOS DE REFERÊNCIA

Projeto principal (AprovAI):
https://github.com/omagalha/Cronofy

Base de questões (referência):
https://github.com/rodrigoborgesmachado/questoesConcursos/tree/main/public

🚀 NOVA MISSÃO

Transformar o AprovAI em um sistema completo com:

👉 estudo + prática + adaptação automática

⚠️ PONTO CRÍTICO

A prática NÃO é uma feature isolada.

Ela é:

👉 um SENSOR do sistema

Ela serve para:

validar aprendizado real
detectar inconsistência (confiança vs desempenho)
alimentar adaptação automática
🎯 OBJETIVO ATUAL

Criar a base de um sistema de questões dentro do AprovAI, usando o segundo repositório como referência.

🧱 O QUE PRECISA SER FEITO
1. Criar camada interna de banco de questões

IMPORTANTE:

NÃO copiar estrutura do outro repo diretamente
NÃO depender dele em runtime
NÃO misturar modelos

Você deve:

analisar o repo de questões
extrair o conceito de estrutura
criar um modelo próprio do AprovAI
2. Criar domínio de questões

Criar tipos como:

QuestionBankItem
QuestionOption
QuestionResult

Pensados para integração com:

PracticeSession
SubjectPerformance
practiceSignals
adaptivePlanningEngine
3. Criar um seed bank

Criar base inicial com:

poucas questões (50–150)
organizadas por matéria
com qualidade > quantidade

Formato sugerido:

QuestionBankItem {
id
subject
topic
statement
options
correctOptionId
explanation
difficulty
tags
}

4. Criar engine de seleção

Criar:

questionBankEngine.ts

Responsável por:

selecionar questões por matéria
priorizar matéria do dia
priorizar matéria fraca
respeitar quantidade (5–10)
preparar sessão de prática
5. Integrar com prática

Fluxo:

PracticeContext solicita sessão
practiceEngine decide a matéria
questionBankEngine entrega questões
usuário responde
QuestionResult é salvo
SubjectPerformance é atualizado
practiceSignals são gerados
adaptivePlanningEngine reage
6. Design (MUITO IMPORTANTE)

Você também é designer.

A experiência deve ser:

simples
rápida
sem fricção
focada em execução

A prática deve parecer:

👉 resolva isso agora em 2 minutos

E não:

👉 entre em um sistema de simulados complexo

🎨 DIRETRIZES DE UX
sessões curtas (5–10 questões)
navegação direta
foco no fluxo, não em configurações
feedback claro:
acerto/erro
explicação curta
final com sensação de progresso
❌ NÃO FAZER
banco gigante de questões
filtro avançado por banca
ranking
multiplayer
backend complexo
overengineering
✅ FAZER
manter arquitetura atual
evoluir incrementalmente
código limpo e coeso
separar domínio de UI
priorizar experiência real
🧠 COMO RESPONDER

Você deve:

pensar como arquiteto de produto
tomar decisões técnicas reais
justificar escolhas
evitar soluções genéricas
propor estrutura de pastas
propor código quando necessário
manter compatibilidade com o sistema atual
🎯 PRIMEIRA TAREFA

Comece criando:

estrutura de pastas do question bank
types completos
exemplo de seed JSON
questionBankEngine.ts
integração com practiceEngine

Tudo pronto para uso real dentro do AprovAI.

🔥 OBSERVAÇÃO FINAL

Isso NÃO é um exercício.

Você está construindo um produto real.

Cada decisão deve considerar:

escalabilidade
experiência do usuário
evolução futura