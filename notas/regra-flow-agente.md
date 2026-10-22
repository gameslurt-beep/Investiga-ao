---
name: regra-flow-agente
description: Lucas's rule for writing prompts for Google Flow (Veo): they go to an intelligent agent, so write multi-step instructions, not a single raw prompt
metadata:
  type: feedback
  modified: 2026-10-21T23:14:46.503Z
---

Lucas works in Google Flow (Veo) through an agent built into it, not by prompting the generator directly. So instructions for Flow should be written as a request to an intelligent agent that plans and carries out steps:
- say how many images to make (3, 4...)
- say which image is the reference for the next image or for the video (first frame)
- break the work into a sequence (e.g. character, then environment, then character in the environment) and say that each step keeps what was approved in the step before, so one step doesn't undo another
- ALWAYS write the instructions for the agent in English (Lucas: they run better). Talk to Lucas in Portuguese
- When Lucas says "vamos gerar imagem/vídeo", he means: write the prompt for him to paste into Flow. Claude does not generate the media; Lucas does, in Flow (images are free there)

**Why:** Lucas set this rule on 2026-10-21. A single raw prompt wastes what the Flow agent can do.
**How to apply:** when writing anything for Flow/Veo, hand Lucas a numbered, step-by-step instruction for the agent, not one standalone prompt. Related: [[video-molho-teste]].
- 2026-10-21: Lucas asked me not to take any action without talking to him first. When something comes out wrong, explain the cause and propose a fix, then wait for his OK before writing prompts or redoing a composite.
- 2026-10-22 (again): I started a timed pilot because Lucas said "o negócio é fazer um teste" — he was thinking out loud, NOT approving. He said: stop starting things without his explicit go-ahead. Only start work on an explicit "pode fazer / começa / faz". Thinking-aloud or "tem que testar" = discuss, propose, then wait.
- 2026-10-22: ONE BLOCK rule. Always send all image instructions in a single block for the Flow agent (never split into several blocks or "paste this later"). Only split when it's images vs videos (one block for images, another for videos). Inside the block, number the steps and say which earlier image each step uses as reference; don't ask the agent to wait for Lucas to pick.
- 2026-10-22: Lucas refined the one-block rule: inside the block, tell the agent to generate images that don't depend on each other ALL AT ONCE, and only do one-by-one the ones that need a previous image as reference ("um por um quando for necessário, quando não for, o bloco todo").
