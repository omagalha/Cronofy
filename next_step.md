# 🚀 Próximo passo — Cronofy

## 📍 Onde eu parei

* Estrutura de telas criada (Expo Router)

* Navegação funcionando

* `index.tsx` usando Redirect

* `_layout.tsx` configurado com Stack

* Setup completo (fluxo funcionando)

* Home criada com:

  * cor principal (azul)
  * logo aplicada
  * header organizado
  * card do dia
  * botões:

    * "Começar estudo"
    * "Ver cronograma"

* Assets organizados:

  * logo sem fundo → usada no app
  * icon com fundo → usado como ícone

---

## ⚠️ O que já está resolvido

* erro de imagem (require)
* erro de navegação (Redirect vs router)
* estrutura correta de rotas
* separação entre:

  * index (controle)
  * home (UI)

---

## 🎯 Próximo passo (IMPORTANTE)

Criar a tela:

👉 `schedule.tsx`

Essa tela deve:

* receber navegação da Home
* mostrar cronograma (mock por enquanto)
* exibir:

  * dia da semana
  * matérias
  * blocos de estudo

---

## 🧱 Estrutura inicial da schedule

* título "Cronograma"
* lista de dias
* lista de blocos

---

## 🔜 Próximos passos depois disso

1. Criar estado global (guardar dados do usuário)
2. Salvar dados do setup
3. Integrar Firebase
4. Integrar IA
5. Gerar cronograma real

---

## 🧠 Regras importantes

* manter MVP simples
* não complicar
* validar funcionamento antes de estilizar
* foco em funcionalidade

---

## 💡 Decisão de produto

Matérias no MVP:

* usuário preenche manualmente
* IA NÃO busca automaticamente ainda
* no futuro: sugestão automática + confirmação do usuário

---

## 🧭 Fluxo atual do app

Login
↓
Onboarding
↓
Setup
↓
Home
↓
Schedule

---

## 🧠 Instrução para amanhã

"Continuar do próximo passo: criar schedule.tsx com base no projeto Cronofy"
